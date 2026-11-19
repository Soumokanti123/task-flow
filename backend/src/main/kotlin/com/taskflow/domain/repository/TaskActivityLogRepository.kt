package com.taskflow.domain.repository

import com.taskflow.domain.model.TaskActivityLog
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository
import java.util.UUID

@Repository
interface TaskActivityLogRepository : JpaRepository<TaskActivityLog, UUID> {
    fun findAllByTaskIdOrderByChangedAtDesc(taskId: UUID): List<TaskActivityLog>
}

