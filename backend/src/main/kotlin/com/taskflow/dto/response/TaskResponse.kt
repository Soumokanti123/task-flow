package com.taskflow.dto.response

import com.taskflow.domain.model.TaskPriority
import com.taskflow.domain.model.TaskStatus
import java.time.Instant
import java.time.LocalDate
import java.util.UUID

data class TaskResponse(
    val id: UUID,
    val title: String,
    val description: String?,
    val status: TaskStatus,
    val priority: TaskPriority,
    val dueDate: LocalDate?,
    val projectId: UUID,
    val assignee: UserResponse?,
    val createdAt: Instant,
    val updatedAt: Instant
)

