package com.taskflow.controller

import com.taskflow.domain.model.TaskPriority
import com.taskflow.domain.model.TaskStatus
import com.taskflow.dto.request.AddProjectMemberRequest
import com.taskflow.dto.request.CreateProjectRequest
import com.taskflow.dto.request.CreateTaskRequest
import com.taskflow.dto.response.PageResponse
import com.taskflow.dto.response.ProjectMemberResponse
import com.taskflow.dto.response.ProjectResponse
import com.taskflow.dto.response.ProjectSummaryResponse
import com.taskflow.dto.response.TaskResponse
import com.taskflow.service.ProjectService
import com.taskflow.service.TaskService
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.security.SecurityRequirement
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import java.util.UUID

@RestController
@RequestMapping("/api/projects")
@Tag(name = "Projects", description = "Endpoints for project and project-scoped task management")
@SecurityRequirement(name = "bearerAuth")
class ProjectController(
    private val projectService: ProjectService,
    private val taskService: TaskService
) {

    @GetMapping
    @Operation(summary = "List all projects owned by the authenticated user")
    fun listProjects(): ResponseEntity<List<ProjectResponse>> {
        val projects = projectService.getUserProjects()
        return ResponseEntity.ok(projects)
    }

    @PostMapping
    @Operation(summary = "Create a new project owned by the authenticated user")
    fun createProject(@Valid @RequestBody request: CreateProjectRequest): ResponseEntity<ProjectResponse> {
        val created = projectService.createProject(request)
        return ResponseEntity.status(HttpStatus.CREATED).body(created)
    }

    @GetMapping("/{id}/summary")
    @Operation(summary = "Get project summary counts (TODO, IN_PROGRESS, DONE and overdue tasks)")
    fun getProjectSummary(@PathVariable id: UUID): ResponseEntity<ProjectSummaryResponse> {
        val summary = projectService.getProjectSummary(id)
        return ResponseEntity.ok(summary)
    }

    @GetMapping("/{id}/tasks")
    @Operation(summary = "List project tasks with filters (status, priority, assignee), sorting (dueDate, priority) and pagination")
    fun listTasks(
        @PathVariable id: UUID,
        @RequestParam(required = false) status: TaskStatus?,
        @RequestParam(required = false) priority: TaskPriority?,
        @RequestParam(required = false) assigneeId: UUID?,
        @RequestParam(required = false, defaultValue = "createdAt") sortBy: String,
        @RequestParam(required = false, defaultValue = "desc") direction: String,
        @RequestParam(required = false, defaultValue = "0") page: Int,
        @RequestParam(required = false, defaultValue = "20") size: Int
    ): ResponseEntity<PageResponse<TaskResponse>> {
        val tasks = taskService.getTasks(
            projectId = id,
            status = status,
            priority = priority,
            assigneeId = assigneeId,
            sortBy = sortBy,
            direction = direction,
            page = page,
            size = size
        )
        return ResponseEntity.ok(tasks)
    }

    @PostMapping("/{id}/tasks")
    @Operation(summary = "Create a new task within a project")
    fun createTask(
        @PathVariable id: UUID,
        @Valid @RequestBody request: CreateTaskRequest
    ): ResponseEntity<TaskResponse> {
        val task = taskService.createTask(id, request)
        return ResponseEntity.status(HttpStatus.CREATED).body(task)
    }

    @GetMapping("/{id}/members")
    @Operation(summary = "List all registered members of a project")
    fun getProjectMembers(@PathVariable id: UUID): ResponseEntity<List<ProjectMemberResponse>> {
        val members = projectService.getProjectMembers(id)
        return ResponseEntity.ok(members)
    }

    @PostMapping("/{id}/members")
    @Operation(summary = "Add a registered user to a project by email")
    fun addProjectMember(
        @PathVariable id: UUID,
        @Valid @RequestBody request: AddProjectMemberRequest
    ): ResponseEntity<ProjectMemberResponse> {
        val member = projectService.addProjectMember(id, request)
        return ResponseEntity.status(HttpStatus.CREATED).body(member)
    }
}

