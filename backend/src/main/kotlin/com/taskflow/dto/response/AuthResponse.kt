package com.taskflow.dto.response

data class AuthResponse(
    val token: String,
    val user: UserResponse
)

