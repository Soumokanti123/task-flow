package com.taskflow.service

import com.taskflow.domain.model.Task
import com.taskflow.domain.model.TaskActivityLog
import com.taskflow.domain.model.TaskPriority
import com.taskflow.domain.model.TaskStatus
import com.taskflow.domain.repository.TaskActivityLogRepository
import com.taskflow.domain.repository.TaskRepository
import com.taskflow.domain.repository.UserRepository
import com.taskflow.domain.specification.TaskSpecification
import com.taskflow.dto.request.CreateTaskRequest
import com.taskflow.dto.request.UpdateTaskRequest
import com.taskflow.dto.request.UpdateTaskStatusRequest
import com.taskflow.dto.response.PageResponse
import com.taskflow.dto.response.TaskResponse
import com.taskflow.exception.BadRequestException
import com.taskflow.exception.ForbiddenException
import com.taskflow.exception.ResourceNotFoundException
import com.taskflow.mapper.toResponse
import org.springframework.data.domain.PageRequest
import org.springframework.data.domain.Sort
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDate
import java.util.UUID

@Service
class TaskService(
    private val taskRepository: TaskRepository,
    private val taskActivityLogRepository: TaskActivityLogRepository,
    private val userRepository: UserRepository,
    private val projectService: ProjectService,
    private val authService: AuthService
) {

    @Transactional(readOnly = true)
    fun getTasks(
        projectId: UUID,
        status: TaskStatus?,
        priority: TaskPriority?,
        assigneeId: UUID?,
        sortBy: String?,
        direction: String?,
        page: Int,
        size: Int
    ): PageResponse<TaskResponse> {
        val currentUserId = authService.getCurrentUserId()
        // Enforce ownership
        projectService.verifyProjectOwnership(projectId, currentUserId)

        // Determine sort field and direction
        val sortProperty = when (sortBy?.lowercase()) {
            "duedate" -> "dueDate"
            "priority" -> "priority"
            "createdat" -> "createdAt"
            "title" -> "title"
            else -> "createdAt"
        }

        val sortDirection = if (direction?.lowercase() == "asc") Sort.Direction.ASC else Sort.Direction.DESC
        val pageable = PageRequest.of(page.coerceAtLeast(0), size.coerceIn(1, 100), Sort.by(sortDirection, sortProperty))

        val spec = TaskSpecification.build(
            projectId = projectId,
            status = status,
            priority = priority,
            assigneeId = assigneeId
        )

        val taskPage = taskRepository.findAll(spec, pageable)

        return PageResponse(
            content = taskPage.content.map { it.toResponse() },
            page = taskPage.number,
            size = taskPage.size,
            totalElements = taskPage.totalElements,
            totalPages = taskPage.totalPages,
            isFirst = taskPage.isFirst,
            isLast = taskPage.isLast
        )
    }

    @Transactional
    fun createTask(projectId: UUID, request: CreateTaskRequest): TaskResponse {
        val currentUserId = authService.getCurrentUserId()
        val project = projectService.getProjectIfOwner(projectId, currentUserId)

        // Explicit validation: dueDate cannot be in the past on create
        if (request.dueDate != null && request.dueDate.isBefore(LocalDate.now())) {
            throw BadRequestException("Due date cannot be in the past")
        }

        val assignee = request.assigneeId?.let {
            if (!projectService.isUserProjectMember(projectId, it)) {
                throw BadRequestException("Assignee must be a registered member of this project")
            }
            userRepository.findById(it)
                .orElseThrow { ResourceNotFoundException("Assignee not found with ID: $it") }
        }

        val task = Task(
            title = request.title.trim(),
            description = request.description?.trim(),
            status = request.status,
            priority = request.priority,
            dueDate = request.dueDate,
            project = project,
            assignee = assignee
        )

        return taskRepository.save(task).toResponse()
    }

    @Transactional
    fun updateTask(taskId: UUID, request: UpdateTaskRequest): TaskResponse {
        val currentUserId = authService.getCurrentUserId()
        val task = getTaskAndVerifyOwnership(taskId, currentUserId)

        val assignee = request.assigneeId?.let {
            if (!projectService.isUserProjectMember(task.project.id!!, it)) {
                throw BadRequestException("Assignee must be a registered member of this project")
            }
            userRepository.findById(it)
                .orElseThrow { ResourceNotFoundException("Assignee not found with ID: $it") }
        }

        val oldStatus = task.status
        task.title = request.title.trim()
        task.description = request.description?.trim()
        task.status = request.status
        task.priority = request.priority
        task.dueDate = request.dueDate
        task.assignee = assignee

        // Record activity log if status changed
        if (oldStatus != request.status) {
            val currentUser = authService.getCurrentUser()
            taskActivityLogRepository.save(
                TaskActivityLog(
                    task = task,
                    user = currentUser,
                    oldStatus = oldStatus,
                    newStatus = request.status
                )
            )
        }

        return taskRepository.save(task).toResponse()
    }

    @Transactional
    fun updateTaskStatus(taskId: UUID, request: UpdateTaskStatusRequest): TaskResponse {
        val currentUserId = authService.getCurrentUserId()
        val task = getTaskAndVerifyOwnership(taskId, currentUserId)

        val oldStatus = task.status
        if (oldStatus != request.status) {
            task.status = request.status
            val currentUser = authService.getCurrentUser()
            taskActivityLogRepository.save(
                TaskActivityLog(
                    task = task,
                    user = currentUser,
                    oldStatus = oldStatus,
                    newStatus = request.status
                )
            )
        }

        return taskRepository.save(task).toResponse()
    }

    @Transactional
    fun deleteTask(taskId: UUID) {
        val currentUserId = authService.getCurrentUserId()
        val task = getTaskAndVerifyOwnership(taskId, currentUserId)
        taskRepository.delete(task)
    }

    @Transactional(readOnly = true)
    fun getTaskAndVerifyOwnership(taskId: UUID, currentUserId: UUID): Task {
        val task = taskRepository.findById(taskId)
            .orElseThrow { ResourceNotFoundException("Task not found with ID: $taskId") }

        if (task.project.owner.id != currentUserId) {
            throw ForbiddenException("You do not have permission to access or modify this task")
        }

        return task
    }
}

