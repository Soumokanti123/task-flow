package com.taskflow.dto.response

import java.util.UUID

data class ProjectSummaryResponse(
    val projectId: UUID,
    val totalTasks: Long,
    val todoCount: Long,
    val inProgressCount: Long,
    val doneCount: Long,
    val overdueCount: Long
)

