package com.taskflow.dto.request

import jakarta.validation.constraints.Email
import jakarta.validation.constraints.NotBlank

data class AddProjectMemberRequest(
    @field:NotBlank(message = "Email is required")
    @field:Email(message = "Valid email address is required")
    val email: String
)
