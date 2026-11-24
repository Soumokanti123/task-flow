package com.taskflow.dto.request

import jakarta.validation.constraints.Max
import jakarta.validation.constraints.Min
import jakarta.validation.constraints.NotBlank

data class AiGeneratePlanRequest(
    @field:NotBlank(message = "Prompt cannot be blank")
    val prompt: String,

    @field:Min(value = 1, message = "Sprint duration must be at least 1 day")
    @field:Max(value = 90, message = "Sprint duration cannot exceed 90 days")
    val sprintDurationDays: Int = 14,

    @field:Min(value = 1, message = "Task count must be at least 1")
    @field:Max(value = 20, message = "Task count cannot exceed 20")
    val targetTaskCount: Int = 5
)
