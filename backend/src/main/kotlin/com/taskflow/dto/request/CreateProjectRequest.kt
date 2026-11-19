package com.taskflow.dto.request

import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size

data class CreateProjectRequest(
    @field:NotBlank(message = "Project name is required")
    @field:Size(min = 1, max = 100, message = "Project name must not exceed 100 characters")
    val name: String,

    @field:Size(max = 2000, message = "Description must not exceed 2000 characters")
    val description: String? = null
)

