package com.taskflow.dto.request

import com.taskflow.domain.model.TaskPriority
import com.taskflow.domain.model.TaskStatus
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.NotNull
import jakarta.validation.constraints.Size
import java.time.LocalDate
import java.util.UUID

data class UpdateTaskRequest(
    @field:NotBlank(message = "Title is required")
    @field:Size(min = 1, max = 120, message = "Title must not exceed 120 characters")
    val title: String,

    @field:Size(max = 5000, message = "Description must not exceed 5000 characters")
    val description: String? = null,

    @field:NotNull(message = "Status is required")
    val status: TaskStatus,

    @field:NotNull(message = "Priority is required")
    val priority: TaskPriority,

    val dueDate: LocalDate? = null,

    val assigneeId: UUID? = null
)

