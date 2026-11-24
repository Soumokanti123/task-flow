package com.taskflow.service

import com.fasterxml.jackson.databind.JsonNode
import com.fasterxml.jackson.databind.ObjectMapper
import com.taskflow.domain.model.ProjectMember
import com.taskflow.domain.model.TaskPriority
import com.taskflow.domain.repository.ProjectMemberRepository
import com.taskflow.dto.request.AiGeneratePlanRequest
import com.taskflow.dto.response.AiPlanResponse
import com.taskflow.dto.response.AiTaskSuggestion
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.http.MediaType
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.client.RestClient
import java.time.LocalDate
import java.util.UUID

@Service
class AiPlanningService(
    private val projectService: ProjectService,
    private val projectMemberRepository: ProjectMemberRepository,
    private val authService: AuthService,
    private val objectMapper: ObjectMapper,
    @Value("\${gemini.api-key:}") private val geminiApiKey: String,
    @Value("\${gemini.model:gemini-1.5-flash}") private val geminiModel: String
) {
    private val logger = LoggerFactory.getLogger(AiPlanningService::class.java)
    private val restClient: RestClient = RestClient.builder().build()

    @Transactional(readOnly = true)
    fun generatePlan(projectId: UUID, request: AiGeneratePlanRequest): AiPlanResponse {
        val currentUserId = authService.getCurrentUserId()
        val project = projectService.getProjectIfOwner(projectId, currentUserId)
        val members = projectMemberRepository.findByProjectIdWithUser(projectId)

        val cleanApiKey = geminiApiKey.trim()

        if (cleanApiKey.isNotBlank() && cleanApiKey != "none" && cleanApiKey != "demo") {
            try {
                return callGeminiApi(project.name, project.description, members, request)
            } catch (e: Exception) {
                logger.warn("Gemini API call failed: {}. Falling back to heuristic planning engine.", e.message)
            }
        } else {
            logger.info("No Gemini API key provided. Using heuristic AI sprint planning engine.")
        }

        return generateHeuristicPlan(project.name, members, request)
    }

    private fun callGeminiApi(
        projectName: String,
        projectDescription: String?,
        members: List<ProjectMember>,
        request: AiGeneratePlanRequest
    ): AiPlanResponse {
        val memberListString = members.joinToString(", ") { "${it.user.name} (${it.user.email}, ${it.role})" }

        val systemInstruction = """
            You are an expert Principal Software Architect and Agile Technical Lead.
            Your task is to break down a high-level user goal into an actionable, realistic sprint plan for a Kanban board.
            Always output STRICT raw JSON conforming to this schema:
            {
              "planSummary": "Concise 2-sentence summary of the delivery plan and strategy",
              "tasks": [
                {
                  "title": "Concise imperative action (under 80 chars)",
                  "description": "Clear technical acceptance criteria and implementation guidance",
                  "priority": "LOW" | "MEDIUM" | "HIGH",
                  "suggestedDaysFromNow": integer between 1 and ${request.sprintDurationDays},
                  "suggestedAssigneeEmail": "email matching one of the team members, or null"
                }
              ]
            }
            Do NOT include markdown backticks or formatting outside the JSON. Return only the JSON object.
        """.trimIndent()

        val promptContent = """
            Project Name: $projectName
            Project Context: ${projectDescription ?: "No description provided"}
            Sprint Duration: ${request.sprintDurationDays} days
            Target Task Count: ${request.targetTaskCount}
            Available Team Members: $memberListString
            
            Goal / Objective to Plan:
            ${request.prompt.trim()}
        """.trimIndent()

        val requestPayload = mapOf(
            "contents" to listOf(
                mapOf(
                    "role" to "user",
                    "parts" to listOf(mapOf("text" to promptContent))
                )
            ),
            "systemInstruction" to mapOf(
                "parts" to listOf(mapOf("text" to systemInstruction))
            ),
            "generationConfig" to mapOf(
                "responseMimeType" to "application/json",
                "temperature" to 0.2
            )
        )

        val url = "https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${geminiApiKey.trim()}"

        val rawResponse = restClient.post()
            .uri(url)
            .contentType(MediaType.APPLICATION_JSON)
            .body(objectMapper.writeValueAsString(requestPayload))
            .retrieve()
            .body(String::class.java) ?: throw IllegalStateException("Empty response from Gemini API")

        return parseGeminiResponse(rawResponse, members, request.sprintDurationDays)
    }

    private fun parseGeminiResponse(
        rawResponse: String,
        members: List<ProjectMember>,
        sprintDays: Int
    ): AiPlanResponse {
        val rootNode = objectMapper.readTree(rawResponse)
        val textContent = rootNode.path("candidates").get(0)
            ?.path("content")?.path("parts")?.get(0)?.path("text")?.asText()
            ?: throw IllegalStateException("Unable to extract text candidate from Gemini response")

        // Clean out any accidental markdown code fence
        val cleanJson = textContent.replace("```json", "").replace("```", "").trim()
        val planNode = objectMapper.readTree(cleanJson)

        val planSummary = planNode.path("planSummary").asText("Sprint delivery plan generated by AI.")
        val tasksNode = planNode.path("tasks")

        val suggestions = mutableListOf<AiTaskSuggestion>()
        if (tasksNode.isArray) {
            for (node in tasksNode) {
                val title = node.path("title").asText("Task")
                val description = node.path("description").asText(null)
                val priorityStr = node.path("priority").asText("MEDIUM").uppercase()
                val priority = try { TaskPriority.valueOf(priorityStr) } catch (_: Exception) { TaskPriority.MEDIUM }
                val daysOffset = node.path("suggestedDaysFromNow").asInt(7).coerceIn(1, sprintDays)
                val email = node.path("suggestedAssigneeEmail").asText(null)?.trim()?.lowercase()

                val matchedMember = members.find { it.user.email.lowercase() == email }

                suggestions.add(
                    AiTaskSuggestion(
                        title = title,
                        description = description,
                        priority = priority,
                        dueDate = LocalDate.now().plusDays(daysOffset.toLong()),
                        suggestedAssigneeEmail = matchedMember?.user?.email,
                        suggestedAssigneeId = matchedMember?.user?.id,
                        suggestedAssigneeName = matchedMember?.user?.name
                    )
                )
            }
        }

        if (suggestions.isEmpty()) {
            throw IllegalStateException("No tasks found in Gemini response payload")
        }

        return AiPlanResponse(planSummary = planSummary, suggestedTasks = suggestions)
    }

    fun generateHeuristicPlan(
        projectName: String,
        members: List<ProjectMember>,
        request: AiGeneratePlanRequest
    ): AiPlanResponse {
        val lowerPrompt = request.prompt.lowercase()
        val count = request.targetTaskCount.coerceIn(3, 10)
        val sprintDays = request.sprintDurationDays

        data class RawItem(val title: String, val desc: String, val prio: TaskPriority, val dayFrac: Double)

        val items: List<RawItem> = when {
            lowerPrompt.contains("auth") || lowerPrompt.contains("login") || lowerPrompt.contains("jwt") || lowerPrompt.contains("security") -> listOf(
                RawItem("Design JWT & Session Token Architecture", "Define token TTL, claims (userId, role), and signing key rotation policies in configuration.", TaskPriority.HIGH, 0.2),
                RawItem("Implement Stateless JwtAuthenticationFilter", "Intercept HTTP requests, extract Bearer token, validate HMAC-SHA256 signature and set SecurityContext.", TaskPriority.HIGH, 0.4),
                RawItem("Build Authentication Endpoints (/login, /register)", "Validate email format and password strength, encode with BCrypt, and return access token DTO.", TaskPriority.HIGH, 0.6),
                RawItem("Create Responsive Auth Modal & Context in Frontend", "Implement Login/Register forms with error banners and automatic token persistence in AuthContext.", TaskPriority.MEDIUM, 0.8),
                RawItem("Implement Token Invalidation & Route Protection Guards", "Handle 401 Unauthorized responses with automatic session eviction and route redirection.", TaskPriority.MEDIUM, 1.0)
            )

            lowerPrompt.contains("docker") || lowerPrompt.contains("deploy") || lowerPrompt.contains("ci") || lowerPrompt.contains("cloud") || lowerPrompt.contains("k8s") -> listOf(
                RawItem("Write Multi-Stage Dockerfile for Spring Boot & React", "Separate compile-time builder image from minimal unprivileged JRE and Nginx runtime images.", TaskPriority.HIGH, 0.2),
                RawItem("Configure Nginx Reverse Proxy with CORS Encapsulation", "Proxy /api/ upstream to backend:8080 and serve compiled React static assets from /usr/share/nginx/html.", TaskPriority.HIGH, 0.4),
                RawItem("Setup Docker Compose with PostgreSQL Healthchecks", "Orchestrate db, backend, and frontend with depend_on service_healthy and volume persistence.", TaskPriority.HIGH, 0.6),
                RawItem("Create GitHub Actions CI Pipeline", "Automate linting, unit test execution (mvnw test, vitest), and Docker container build verification on push.", TaskPriority.MEDIUM, 0.8),
                RawItem("Configure Production Environment Variables & Secrets", "Externalize JWT_SECRET, DB_PASSWORD, and CORS_ALLOWED_ORIGINS via environment variables.", TaskPriority.MEDIUM, 1.0)
            )

            lowerPrompt.contains("payment") || lowerPrompt.contains("billing") || lowerPrompt.contains("stripe") -> listOf(
                RawItem("Design Payment Schema & Transaction Table", "Create payment_transactions table with status, idempotency_key, amount, and stripe_session_id.", TaskPriority.HIGH, 0.2),
                RawItem("Integrate Payment Gateway SDK & Checkout API", "Implement backend endpoint to initialize Stripe Checkout Session with success and cancel callback URLs.", TaskPriority.HIGH, 0.4),
                RawItem("Implement Secure Webhook Listener with Signature Verification", "Verify Stripe webhook signing secrets and update transaction statuses idempotently.", TaskPriority.HIGH, 0.7),
                RawItem("Build Frontend Pricing Table & Checkout Flow", "Display tier cards with feature breakdown and integrate checkout redirect button with loading states.", TaskPriority.MEDIUM, 0.85),
                RawItem("Add Invoicing & Receipt Download History", "Provide downloadable invoice summaries and status badges in customer account settings.", TaskPriority.LOW, 1.0)
            )

            lowerPrompt.contains("test") || lowerPrompt.contains("qa") || lowerPrompt.contains("performance") -> listOf(
                RawItem("Write Service-Layer MockK Unit Tests", "Verify business logic, exception throwing, and boundary conditions for core domain services.", TaskPriority.HIGH, 0.2),
                RawItem("Implement Vitest Component & Hook Tests", "Verify Kanban columns, task modals, and drag-and-drop callbacks using React Testing Library.", TaskPriority.MEDIUM, 0.5),
                RawItem("Setup Playwright Cross-Browser E2E Test Suite", "Automate complete user journey: login, project creation, task movement, and member addition.", TaskPriority.HIGH, 0.75),
                RawItem("Conduct Database Query Profiling & Index Optimization", "Analyze execution plans using EXPLAIN ANALYZE on frequently filtered task queries.", TaskPriority.MEDIUM, 0.9),
                RawItem("Load Test API Endpoints with Apache Benchmark / k6", "Benchmark 100 concurrent users against task status updates and verify connection pool stability.", TaskPriority.LOW, 1.0)
            )

            else -> listOf(
                RawItem("Analyze System Requirements & Technical Scope", "Draft architecture specification, data models, and API endpoint contracts for: ${request.prompt.take(60)}.", TaskPriority.HIGH, 0.2),
                RawItem("Design Database Migration & Relational Entities", "Create Flyway SQL migration with primary keys, indexes, foreign keys, and constraints.", TaskPriority.HIGH, 0.4),
                RawItem("Implement Core Domain Services & Business Logic", "Develop transactional service methods enforcing ownership, validations, and audit activity logging.", TaskPriority.HIGH, 0.6),
                RawItem("Build REST Controllers with OpenAPI Documentation", "Expose secure endpoints with Swagger annotations, input validation (@Valid), and error handling.", TaskPriority.MEDIUM, 0.8),
                RawItem("Deliver Frontend UI Components & User Experience", "Integrate API calls, responsive forms, loading indicators, and optimistic feedback.", TaskPriority.MEDIUM, 1.0)
            )
        }

        val selectedItems = items.take(count)
        val memberCount = members.size

        val suggestions = selectedItems.mapIndexed { idx, item ->
            val daysOffset = (item.dayFrac * sprintDays).toInt().coerceIn(1, sprintDays)
            val assignedMember = if (memberCount > 0) members[idx % memberCount] else null

            AiTaskSuggestion(
                title = item.title,
                description = item.desc,
                priority = item.prio,
                dueDate = LocalDate.now().plusDays(daysOffset.toLong()),
                suggestedAssigneeEmail = assignedMember?.user?.email,
                suggestedAssigneeId = assignedMember?.user?.id,
                suggestedAssigneeName = assignedMember?.user?.name
            )
        }

        val summary = "AI Sprint Plan for '$projectName': Structured ${suggestions.size} milestones across ${sprintDays} days focused on '${request.prompt.take(80)}'."

        return AiPlanResponse(planSummary = summary, suggestedTasks = suggestions)
    }
}
