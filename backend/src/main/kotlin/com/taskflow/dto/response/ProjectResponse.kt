package com.taskflow.dto.response

import java.time.Instant
import java.util.UUID

data class ProjectResponse(
    val id: UUID,
    val name: String,
    val description: String?,
    val ownerId: UUID,
    val createdAt: Instant
)

