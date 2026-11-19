package com.taskflow.controller

import com.taskflow.dto.request.UpdateTaskRequest
import com.taskflow.dto.request.UpdateTaskStatusRequest
import com.taskflow.dto.response.TaskResponse
import com.taskflow.service.TaskService
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.security.SecurityRequirement
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import java.util.UUID

@RestController
@RequestMapping("/api/tasks")
@Tag(name = "Tasks", description = "Endpoints for individual task operations")
@SecurityRequirement(name = "bearerAuth")
class TaskController(
    private val taskService: TaskService
) {

    @PutMapping("/{id}")
    @Operation(summary = "Update task details")
    fun updateTask(
        @PathVariable id: UUID,
        @Valid @RequestBody request: UpdateTaskRequest
    ): ResponseEntity<TaskResponse> {
        val updated = taskService.updateTask(id, request)
        return ResponseEntity.ok(updated)
    }

    @PatchMapping("/{id}/status")
    @Operation(summary = "Update only the status of a task")
    fun updateTaskStatus(
        @PathVariable id: UUID,
        @Valid @RequestBody request: UpdateTaskStatusRequest
    ): ResponseEntity<TaskResponse> {
        val updated = taskService.updateTaskStatus(id, request)
        return ResponseEntity.ok(updated)
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a task")
    fun deleteTask(@PathVariable id: UUID): ResponseEntity<Void> {
        taskService.deleteTask(id)
        return ResponseEntity.noContent().build()
    }
}
