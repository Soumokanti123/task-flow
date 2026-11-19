package com.taskflow.dto.response

import java.time.Instant
import java.util.UUID

data class UserResponse(
    val id: UUID,
    val name: String,
    val email: String,
    val createdAt: Instant
)

