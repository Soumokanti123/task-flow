package com.taskflow.dto.response

import com.taskflow.domain.model.ProjectRole
import java.time.Instant
import java.util.UUID

data class ProjectMemberResponse(
    val id: UUID,
    val userId: UUID,
    val name: String,
    val email: String,
    val role: ProjectRole,
    val joinedAt: Instant
)

