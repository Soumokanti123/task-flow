package com.taskflow.service

import com.taskflow.domain.model.Project
import com.taskflow.domain.model.ProjectMember
import com.taskflow.domain.model.ProjectRole
import com.taskflow.domain.model.TaskStatus
import com.taskflow.domain.repository.ProjectMemberRepository
import com.taskflow.domain.repository.ProjectRepository
import com.taskflow.domain.repository.TaskRepository
import com.taskflow.domain.repository.UserRepository
import com.taskflow.dto.request.AddProjectMemberRequest
import com.taskflow.dto.request.CreateProjectRequest
import com.taskflow.dto.response.ProjectMemberResponse
import com.taskflow.dto.response.ProjectResponse
import com.taskflow.dto.response.ProjectSummaryResponse
import com.taskflow.exception.ConflictException
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
    private val projectMemberRepository: ProjectMemberRepository,
    private val userRepository: UserRepository,
    private val authService: AuthService
) {

    @Transactional(readOnly = true)
    fun getUserProjects(): List<ProjectResponse> {
        val currentUserId = authService.getCurrentUserId()
        return projectRepository.findAllByOwnerOrMember(currentUserId)
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
        val savedProject = projectRepository.save(project)
        // Automatically register creator/owner as project member
        projectMemberRepository.save(
            ProjectMember(
                project = savedProject,
                user = currentUser,
                role = ProjectRole.OWNER
            )
        )
        return savedProject.toResponse()
    }

    @Transactional(readOnly = true)
    fun getProjectSummary(projectId: UUID): ProjectSummaryResponse {
        val currentUserId = authService.getCurrentUserId()
        verifyProjectAccess(projectId, currentUserId)

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
    fun getProjectMembers(projectId: UUID): List<ProjectMemberResponse> {
        val currentUserId = authService.getCurrentUserId()
        verifyProjectAccess(projectId, currentUserId)
        return projectMemberRepository.findByProjectIdWithUser(projectId)
            .map { it.toResponse() }
    }

    @Transactional
    fun addProjectMember(projectId: UUID, request: AddProjectMemberRequest): ProjectMemberResponse {
        val currentUserId = authService.getCurrentUserId()
        // Only project owner can add members
        val project = getProjectIfOwner(projectId, currentUserId)

        val targetEmail = request.email.trim().lowercase()
        val targetUser = userRepository.findByEmail(targetEmail)
            .orElseThrow { ResourceNotFoundException("User not found with email: $targetEmail") }

        if (projectMemberRepository.existsByProjectIdAndUserId(projectId, targetUser.id!!)) {
            throw ConflictException("User '${targetUser.email}' is already a member of this project")
        }

        val member = ProjectMember(
            project = project,
            user = targetUser,
            role = ProjectRole.MEMBER
        )
        return projectMemberRepository.save(member).toResponse()
    }

    @Transactional(readOnly = true)
    fun isUserProjectMember(projectId: UUID, userId: UUID): Boolean {
        val project = projectRepository.findById(projectId).orElse(null) ?: return false
        if (project.owner.id == userId) return true
        return projectMemberRepository.existsByProjectIdAndUserId(projectId, userId)
    }

    @Transactional(readOnly = true)
    fun verifyProjectAccess(projectId: UUID, currentUserId: UUID): Project {
        val project = projectRepository.findById(projectId)
            .orElseThrow { ResourceNotFoundException("Project not found with ID: $projectId") }

        if (project.owner.id != currentUserId && !projectMemberRepository.existsByProjectIdAndUserId(projectId, currentUserId)) {
            throw ForbiddenException("You do not have access to project $projectId")
        }
        return project
    }

    @Transactional(readOnly = true)
    fun getProjectIfOwner(projectId: UUID, currentUserId: UUID): Project {
        val project = projectRepository.findById(projectId)
            .orElseThrow { ResourceNotFoundException("Project not found with ID: $projectId") }

        if (project.owner.id != currentUserId) {
            throw ForbiddenException("You do not own or have permission to manage project $projectId")
        }

        return project
    }

    @Transactional(readOnly = true)
    fun verifyProjectOwnership(projectId: UUID, currentUserId: UUID) {
        verifyProjectAccess(projectId, currentUserId)
    }
}
