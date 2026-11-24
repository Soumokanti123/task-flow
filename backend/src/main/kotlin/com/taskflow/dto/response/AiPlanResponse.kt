package com.taskflow.dto.response

import com.taskflow.domain.model.TaskPriority
import java.time.LocalDate
import java.util.UUID

data class AiTaskSuggestion(
    val title: String,
    val description: String?,
    val priority: TaskPriority,
    val dueDate: LocalDate?,
    val suggestedAssigneeEmail: String? = null,
    val suggestedAssigneeId: UUID? = null,
    val suggestedAssigneeName: String? = null
)

data class AiPlanResponse(
    val planSummary: String,
    val suggestedTasks: List<AiTaskSuggestion>
)
