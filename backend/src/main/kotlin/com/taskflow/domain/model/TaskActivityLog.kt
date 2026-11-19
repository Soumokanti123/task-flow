package com.taskflow.domain.model

import jakarta.persistence.*
import org.hibernate.annotations.CreationTimestamp
import java.time.Instant
import java.util.UUID

@Entity
@Table(name = "task_activity_logs")
class TaskActivityLog(
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    val id: UUID? = null,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "task_id", nullable = false)
    val task: Task,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    val user: User,

    @Enumerated(EnumType.STRING)
    @Column(name = "old_status", nullable = false, length = 20)
    val oldStatus: TaskStatus,

    @Enumerated(EnumType.STRING)
    @Column(name = "new_status", nullable = false, length = 20)
    val newStatus: TaskStatus,

    @CreationTimestamp
    @Column(name = "changed_at", nullable = false, updatable = false)
    val changedAt: Instant = Instant.now()
)

