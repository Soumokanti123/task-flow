package com.taskflow.domain.specification

import com.taskflow.domain.model.Task
import com.taskflow.domain.model.TaskPriority
import com.taskflow.domain.model.TaskStatus
import org.springframework.data.jpa.domain.Specification
import java.util.UUID

/**
 * Strategy Pattern implementation for dynamic task querying and filtering.
 * Each filtering strategy generates an independent JPA Specification predicate
 * that can be composed dynamically using Specification.and().
 */
object TaskSpecification {

    fun hasProject(projectId: UUID): Specification<Task> {
        return Specification { root, _, criteriaBuilder ->
            criteriaBuilder.equal(root.get<Any>("project").get<UUID>("id"), projectId)
        }
    }

    fun hasStatus(status: TaskStatus?): Specification<Task> {
        return Specification { root, _, criteriaBuilder ->
            status?.let { criteriaBuilder.equal(root.get<TaskStatus>("status"), it) }
        }
    }

    fun hasPriority(priority: TaskPriority?): Specification<Task> {
        return Specification { root, _, criteriaBuilder ->
            priority?.let { criteriaBuilder.equal(root.get<TaskPriority>("priority"), it) }
        }
    }

    fun hasAssignee(assigneeId: UUID?): Specification<Task> {
        return Specification { root, _, criteriaBuilder ->
            assigneeId?.let { criteriaBuilder.equal(root.get<Any>("assignee").get<UUID>("id"), it) }
        }
    }

    fun build(
        projectId: UUID,
        status: TaskStatus? = null,
        priority: TaskPriority? = null,
        assigneeId: UUID? = null
    ): Specification<Task> {
        return Specification.where(hasProject(projectId))
            .and(hasStatus(status))
            .and(hasPriority(priority))
            .and(hasAssignee(assigneeId))
    }
}

