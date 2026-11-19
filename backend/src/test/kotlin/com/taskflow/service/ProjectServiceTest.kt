package com.taskflow.service

import com.taskflow.domain.model.Project
import com.taskflow.domain.model.ProjectMember
import com.taskflow.domain.model.ProjectRole
import com.taskflow.domain.model.TaskStatus
import com.taskflow.domain.model.User
import com.taskflow.domain.repository.ProjectMemberRepository
import com.taskflow.domain.repository.ProjectRepository
import com.taskflow.domain.repository.TaskRepository
import com.taskflow.domain.repository.UserRepository
import com.taskflow.dto.request.AddProjectMemberRequest
import com.taskflow.dto.request.CreateProjectRequest
import com.taskflow.exception.ConflictException
import com.taskflow.exception.ForbiddenException
import com.taskflow.exception.ResourceNotFoundException
import io.mockk.every
import io.mockk.mockk
import io.mockk.verify
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import java.time.LocalDate
import java.util.Optional
import java.util.UUID

class ProjectServiceTest {

    private lateinit var projectRepository: ProjectRepository
    private lateinit var taskRepository: TaskRepository
    private lateinit var projectMemberRepository: ProjectMemberRepository
    private lateinit var userRepository: UserRepository
    private lateinit var authService: AuthService
    private lateinit var projectService: ProjectService

    private val currentUserId = UUID.randomUUID()
    private val currentUser = User(
        id = currentUserId,
        name = "Bob",
        email = "bob@example.com",
        passwordHash = "hash"
    )

    @BeforeEach
    fun setUp() {
        projectRepository = mockk()
        taskRepository = mockk()
        projectMemberRepository = mockk()
        userRepository = mockk()
        authService = mockk()
        projectService = ProjectService(
            projectRepository,
            taskRepository,
            projectMemberRepository,
            userRepository,
            authService
        )

        every { authService.getCurrentUserId() } returns currentUserId
        every { authService.getCurrentUser() } returns currentUser
    }

    @Test
    fun `getUserProjects returns all projects owned by or shared with current user`() {
        val project1 = Project(id = UUID.randomUUID(), name = "Project 1", owner = currentUser)
        val project2 = Project(id = UUID.randomUUID(), name = "Project 2", owner = currentUser)

        every { projectRepository.findAllByOwnerOrMember(currentUserId) } returns listOf(project1, project2)

        val result = projectService.getUserProjects()

        assertEquals(2, result.size)
        assertEquals("Project 1", result[0].name)
        assertEquals("Project 2", result[1].name)
    }

    @Test
    fun `createProject successfully associates current user as owner and member`() {
        val request = CreateProjectRequest(name = "Mobile App", description = "New flutter app")
        val savedProject = Project(
            id = UUID.randomUUID(),
            name = "Mobile App",
            description = "New flutter app",
            owner = currentUser
        )

        every { projectRepository.save(any()) } returns savedProject
        every { projectMemberRepository.save(any()) } answers { firstArg() }

        val result = projectService.createProject(request)

        assertEquals("Mobile App", result.name)
        assertEquals(currentUserId, result.ownerId)
        verify { projectRepository.save(match { it.name == "Mobile App" && it.owner.id == currentUserId }) }
        verify { projectMemberRepository.save(match { it.role == ProjectRole.OWNER && it.user.id == currentUserId }) }
    }

    @Test
    fun `getProjectSummary correctly aggregates status counts and overdue counts`() {
        val projectId = UUID.randomUUID()
        val project = Project(id = projectId, name = "Platform", owner = currentUser)

        every { projectRepository.findById(projectId) } returns Optional.of(project)
        every { projectMemberRepository.existsByProjectIdAndUserId(projectId, currentUserId) } returns true
        every { taskRepository.countByProjectId(projectId) } returns 10L
        every { taskRepository.countByProjectIdAndStatus(projectId, TaskStatus.TODO) } returns 3L
        every { taskRepository.countByProjectIdAndStatus(projectId, TaskStatus.IN_PROGRESS) } returns 4L
        every { taskRepository.countByProjectIdAndStatus(projectId, TaskStatus.DONE) } returns 3L
        every {
            taskRepository.countByProjectIdAndDueDateBeforeAndStatusNot(
                projectId = projectId,
                dueDate = any<LocalDate>(),
                status = TaskStatus.DONE
            )
        } returns 2L

        val summary = projectService.getProjectSummary(projectId)

        assertEquals(projectId, summary.projectId)
        assertEquals(10L, summary.totalTasks)
        assertEquals(3L, summary.todoCount)
        assertEquals(4L, summary.inProgressCount)
        assertEquals(3L, summary.doneCount)
        assertEquals(2L, summary.overdueCount)
    }

    @Test
    fun `getProjectMembers returns list of registered project members`() {
        val projectId = UUID.randomUUID()
        val project = Project(id = projectId, name = "Platform", owner = currentUser)
        val member1 = ProjectMember(id = UUID.randomUUID(), project = project, user = currentUser, role = ProjectRole.OWNER)

        every { projectRepository.findById(projectId) } returns Optional.of(project)
        every { projectMemberRepository.findByProjectIdWithUser(projectId) } returns listOf(member1)

        val members = projectService.getProjectMembers(projectId)

        assertEquals(1, members.size)
        assertEquals(currentUser.name, members[0].name)
        assertEquals(ProjectRole.OWNER, members[0].role)
    }

    @Test
    fun `addProjectMember successfully adds registered user to project`() {
        val projectId = UUID.randomUUID()
        val project = Project(id = projectId, name = "Platform", owner = currentUser)
        val teammate = User(id = UUID.randomUUID(), name = "Alex", email = "alex@test.com", passwordHash = "hash")
        val request = AddProjectMemberRequest(email = "alex@test.com")

        every { projectRepository.findById(projectId) } returns Optional.of(project)
        every { userRepository.findByEmail("alex@test.com") } returns Optional.of(teammate)
        every { projectMemberRepository.existsByProjectIdAndUserId(projectId, teammate.id!!) } returns false
        every { projectMemberRepository.save(any()) } answers {
            val pm = firstArg<ProjectMember>()
            ProjectMember(id = UUID.randomUUID(), project = pm.project, user = pm.user, role = pm.role)
        }

        val result = projectService.addProjectMember(projectId, request)

        assertEquals(teammate.id, result.userId)
        assertEquals("Alex", result.name)
        assertEquals(ProjectRole.MEMBER, result.role)
        verify { projectMemberRepository.save(match { it.user.email == "alex@test.com" && it.role == ProjectRole.MEMBER }) }
    }

    @Test
    fun `addProjectMember throws ConflictException when user is already a member`() {
        val projectId = UUID.randomUUID()
        val project = Project(id = projectId, name = "Platform", owner = currentUser)
        val teammate = User(id = UUID.randomUUID(), name = "Alex", email = "alex@test.com", passwordHash = "hash")
        val request = AddProjectMemberRequest(email = "alex@test.com")

        every { projectRepository.findById(projectId) } returns Optional.of(project)
        every { userRepository.findByEmail("alex@test.com") } returns Optional.of(teammate)
        every { projectMemberRepository.existsByProjectIdAndUserId(projectId, teammate.id!!) } returns true

        assertThrows<ConflictException> {
            projectService.addProjectMember(projectId, request)
        }
    }

    @Test
    fun `addProjectMember throws ResourceNotFoundException when email not registered`() {
        val projectId = UUID.randomUUID()
        val project = Project(id = projectId, name = "Platform", owner = currentUser)
        val request = AddProjectMemberRequest(email = "nonexistent@test.com")

        every { projectRepository.findById(projectId) } returns Optional.of(project)
        every { userRepository.findByEmail("nonexistent@test.com") } returns Optional.empty()

        assertThrows<ResourceNotFoundException> {
            projectService.addProjectMember(projectId, request)
        }
    }

    @Test
    fun `verifyProjectOwnership throws ForbiddenException when accessed by non-member user`() {
        val otherUserId = UUID.randomUUID()
        val otherUser = User(id = otherUserId, name = "Eve", email = "eve@example.com", passwordHash = "hash")
        val projectId = UUID.randomUUID()
        val project = Project(id = projectId, name = "Secret Project", owner = otherUser)

        every { projectRepository.findById(projectId) } returns Optional.of(project)
        every { projectMemberRepository.existsByProjectIdAndUserId(projectId, currentUserId) } returns false

        assertThrows<ForbiddenException> {
            projectService.verifyProjectOwnership(projectId, currentUserId)
        }
    }

    @Test
    fun `verifyProjectOwnership throws ResourceNotFoundException when project does not exist`() {
        val projectId = UUID.randomUUID()

        every { projectRepository.findById(projectId) } returns Optional.empty()

        assertThrows<ResourceNotFoundException> {
            projectService.verifyProjectOwnership(projectId, currentUserId)
        }
    }
}
