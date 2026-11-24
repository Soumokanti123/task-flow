package com.taskflow.service

import com.fasterxml.jackson.databind.ObjectMapper
import com.taskflow.domain.model.Project
import com.taskflow.domain.model.ProjectMember
import com.taskflow.domain.model.ProjectRole
import com.taskflow.domain.model.User
import com.taskflow.domain.repository.ProjectMemberRepository
import com.taskflow.dto.request.AiGeneratePlanRequest
import com.taskflow.exception.ForbiddenException
import io.mockk.every
import io.mockk.mockk
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import java.util.UUID

class AiPlanningServiceTest {

    private lateinit var projectService: ProjectService
    private lateinit var projectMemberRepository: ProjectMemberRepository
    private lateinit var authService: AuthService
    private val objectMapper = ObjectMapper()
    private lateinit var aiPlanningService: AiPlanningService

    private val currentUserId = UUID.randomUUID()
    private val currentUser = User(
        id = currentUserId,
        name = "Soumo Bera",
        email = "soumo@taskflow.dev",
        passwordHash = "hash"
    )
    private val teammateId = UUID.randomUUID()
    private val teammate = User(
        id = teammateId,
        name = "Alex Johnson",
        email = "alex@taskflow.dev",
        passwordHash = "hash"
    )
    private val projectId = UUID.randomUUID()
    private val project = Project(
        id = projectId,
        name = "Alpha Sprint",
        description = "Core payment and authentication sprint",
        owner = currentUser
    )

    @BeforeEach
    fun setUp() {
        projectService = mockk()
        projectMemberRepository = mockk()
        authService = mockk()

        aiPlanningService = AiPlanningService(
            projectService = projectService,
            projectMemberRepository = projectMemberRepository,
            authService = authService,
            objectMapper = objectMapper,
            geminiApiKey = "",
            geminiModel = "gemini-1.5-flash"
        )

        every { authService.getCurrentUserId() } returns currentUserId
        every { projectService.getProjectIfOwner(projectId, currentUserId) } returns project
    }

    @Test
    fun `generatePlan generates domain-aware tasks when prompt mentions auth`() {
        val members = listOf(
            ProjectMember(project = project, user = currentUser, role = ProjectRole.OWNER),
            ProjectMember(project = project, user = teammate, role = ProjectRole.MEMBER)
        )
        every { projectMemberRepository.findByProjectIdWithUser(projectId) } returns members

        val request = AiGeneratePlanRequest(
            prompt = "Implement secure JWT auth and refresh token flow",
            sprintDurationDays = 14,
            targetTaskCount = 5
        )

        val plan = aiPlanningService.generatePlan(projectId, request)

        assertNotNull(plan)
        assertTrue(plan.planSummary.isNotBlank())
        assertEquals(5, plan.suggestedTasks.size)
        assertTrue(plan.suggestedTasks.any { it.title.contains("JWT", ignoreCase = true) || it.title.contains("Auth", ignoreCase = true) })
        // Verify assignees are mapped from members
        assertTrue(plan.suggestedTasks.any { it.suggestedAssigneeEmail == "soumo@taskflow.dev" || it.suggestedAssigneeEmail == "alex@taskflow.dev" })
    }

    @Test
    fun `generatePlan generates docker devops tasks when prompt mentions docker`() {
        every { projectMemberRepository.findByProjectIdWithUser(projectId) } returns emptyList()

        val request = AiGeneratePlanRequest(
            prompt = "Dockerize the Spring Boot and React app with Nginx proxy",
            sprintDurationDays = 7,
            targetTaskCount = 4
        )

        val plan = aiPlanningService.generatePlan(projectId, request)

        assertNotNull(plan)
        assertEquals(4, plan.suggestedTasks.size)
        assertTrue(plan.suggestedTasks.any { it.title.contains("Docker", ignoreCase = true) || it.title.contains("Nginx", ignoreCase = true) })
    }

    @Test
    fun `generatePlan throws ForbiddenException when caller does not own project`() {
        every { projectService.getProjectIfOwner(projectId, currentUserId) } throws ForbiddenException("You do not own this project")

        val request = AiGeneratePlanRequest(prompt = "Build feature")

        assertThrows<ForbiddenException> {
            aiPlanningService.generatePlan(projectId, request)
        }
    }
}
