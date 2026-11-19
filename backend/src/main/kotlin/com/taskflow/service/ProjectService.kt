package com.taskflow.service

import com.taskflow.domain.model.Project
import com.taskflow.domain.model.TaskStatus
import com.taskflow.domain.repository.ProjectRepository
import com.taskflow.domain.repository.TaskRepository
import com.taskflow.dto.request.CreateProjectRequest
import com.taskflow.dto.response.ProjectResponse
import com.taskflow.dto.response.ProjectSummaryResponse
import com.taskflow.exception.ForbiddenException
import com.taskflow.exception.ResourceNotFoundException
import com.taskflow.mapper.toResponse
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDate
import java.util.UUID

@Service
class ProjectService(
    private val projectRepository: ProjectRepository,
    private val taskRepository: TaskRepository,
    private val authService: AuthService
) {

    @Transactional(readOnly = true)
    fun getUserProjects(): List<ProjectResponse> {
        val currentUserId = authService.getCurrentUserId()
        return projectRepository.findAllByOwnerIdOrderByCreatedAtDesc(currentUserId)
            .map { it.toResponse() }
    }

    @Transactional
    fun createProject(request: CreateProjectRequest): ProjectResponse {
        val currentUser = authService.getCurrentUser()
        val project = Project(
            name = request.name.trim(),
            description = request.description?.trim(),
            owner = currentUser
        )
        return projectRepository.save(project).toResponse()
    }

    @Transactional(readOnly = true)
    fun getProjectSummary(projectId: UUID): ProjectSummaryResponse {
        val currentUserId = authService.getCurrentUserId()
        // Ensure user owns project
        verifyProjectOwnership(projectId, currentUserId)

        val totalTasks = taskRepository.countByProjectId(projectId)
        val todoCount = taskRepository.countByProjectIdAndStatus(projectId, TaskStatus.TODO)
        val inProgressCount = taskRepository.countByProjectIdAndStatus(projectId, TaskStatus.IN_PROGRESS)
        val doneCount = taskRepository.countByProjectIdAndStatus(projectId, TaskStatus.DONE)

        // Overdue logic: due_date < today AND status != DONE
        val overdueCount = taskRepository.countByProjectIdAndDueDateBeforeAndStatusNot(
            projectId = projectId,
            dueDate = LocalDate.now(),
            status = TaskStatus.DONE
        )

        return ProjectSummaryResponse(
            projectId = projectId,
            totalTasks = totalTasks,
            todoCount = todoCount,
            inProgressCount = inProgressCount,
            doneCount = doneCount,
            overdueCount = overdueCount
        )
    }

    @Transactional(readOnly = true)
    fun getProjectIfOwner(projectId: UUID, currentUserId: UUID): Project {
        val project = projectRepository.findById(projectId)
            .orElseThrow { ResourceNotFoundException("Project not found with ID: $projectId") }

        if (project.owner.id != currentUserId) {
            throw ForbiddenException("You do not own or have permission to access project $projectId")
        }

        return project
    }

    @Transactional(readOnly = true)
    fun verifyProjectOwnership(projectId: UUID, currentUserId: UUID) {
        getProjectIfOwner(projectId, currentUserId)
    }
}

