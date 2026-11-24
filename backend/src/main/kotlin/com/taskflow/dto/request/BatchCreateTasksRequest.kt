package com.taskflow.dto.request

import jakarta.validation.Valid
import jakarta.validation.constraints.NotEmpty

data class BatchCreateTasksRequest(
    @field:NotEmpty(message = "Tasks list cannot be empty")
    @field:Valid
    val tasks: List<CreateTaskRequest>
)
