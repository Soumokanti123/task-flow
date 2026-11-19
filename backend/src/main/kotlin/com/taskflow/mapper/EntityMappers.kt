package com.taskflow.mapper

import com.taskflow.domain.model.Project
import com.taskflow.domain.model.Task
import com.taskflow.domain.model.User
import com.taskflow.dto.response.ProjectResponse
import com.taskflow.dto.response.TaskResponse
import com.taskflow.dto.response.UserResponse

/**
 * Mapper / Factory Pattern implementation via idiomatic Kotlin extension functions.
 * Enforces clean separation between internal JPA entities and public API DTOs.
 */
fun User.toResponse(): UserResponse {
    return UserResponse(
        id = this.id ?: throw IllegalStateException("User ID cannot be null when mapping to DTO"),
        name = this.name,
        email = this.email,
        createdAt = this.createdAt
    )
}

fun Project.toResponse(): ProjectResponse {
    return ProjectResponse(
        id = this.id ?: throw IllegalStateException("Project ID cannot be null when mapping to DTO"),
        name = this.name,
        description = this.description,
        ownerId = this.owner.id ?: throw IllegalStateException("Project owner ID cannot be null"),
        createdAt = this.createdAt
    )
}

fun Task.toResponse(): TaskResponse {
    return TaskResponse(
        id = this.id ?: throw IllegalStateException("Task ID cannot be null when mapping to DTO"),
        title = this.title,
        description = this.description,
        status = this.status,
        priority = this.priority,
        dueDate = this.dueDate,
        projectId = this.project.id ?: throw IllegalStateException("Task project ID cannot be null"),
        assignee = this.assignee?.toResponse(),
        createdAt = this.createdAt,
        updatedAt = this.updatedAt
    )
}

