package com.taskflow.controller

import com.taskflow.dto.request.AiGeneratePlanRequest
import com.taskflow.dto.response.AiPlanResponse
import com.taskflow.service.AiPlanningService
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.security.SecurityRequirement
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import java.util.UUID

@RestController
@RequestMapping("/api/projects/{projectId}/ai")
@Tag(name = "AI Planner", description = "Endpoints for AI-driven project task breakdown and sprint planning")
@SecurityRequirement(name = "bearerAuth")
class AiController(
    private val aiPlanningService: AiPlanningService
) {

    @PostMapping("/generate-plan")
    @Operation(summary = "Generate a structured sprint plan with task suggestions from a natural language prompt using AI")
    fun generatePlan(
        @PathVariable projectId: UUID,
        @Valid @RequestBody request: AiGeneratePlanRequest
    ): ResponseEntity<AiPlanResponse> {
        val plan = aiPlanningService.generatePlan(projectId, request)
        return ResponseEntity.ok(plan)
    }
}
