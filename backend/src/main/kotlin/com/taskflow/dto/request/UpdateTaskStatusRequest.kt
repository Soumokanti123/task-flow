package com.taskflow.dto.request

import com.taskflow.domain.model.TaskStatus
import jakarta.validation.constraints.NotNull

data class UpdateTaskStatusRequest(
    @field:NotNull(message = "Status is required")
    val status: TaskStatus
)

