package com.taskflow.domain.repository

import com.taskflow.domain.model.Task
import com.taskflow.domain.model.TaskStatus
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.JpaSpecificationExecutor
import org.springframework.stereotype.Repository
import java.time.LocalDate
import java.util.UUID

@Repository
interface TaskRepository : JpaRepository<Task, UUID>, JpaSpecificationExecutor<Task> {
    fun countByProjectId(projectId: UUID): Long
    fun countByProjectIdAndStatus(projectId: UUID, status: TaskStatus): Long
    fun countByProjectIdAndDueDateBeforeAndStatusNot(projectId: UUID, dueDate: LocalDate, status: TaskStatus): Long
}

