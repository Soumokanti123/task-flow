package com.taskflow.service

import com.taskflow.domain.model.*
import com.taskflow.domain.repository.TaskActivityLogRepository
import com.taskflow.domain.repository.TaskRepository
import com.taskflow.domain.repository.UserRepository
import com.taskflow.dto.request.CreateTaskRequest
import com.taskflow.dto.request.UpdateTaskRequest
import com.taskflow.dto.request.UpdateTaskStatusRequest
import com.taskflow.exception.BadRequestException
import com.taskflow.exception.ForbiddenException
import com.taskflow.exception.ResourceNotFoundException
import io.mockk.*
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import org.springframework.data.domain.PageImpl
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.domain.Specification
import java.time.LocalDate
import java.util.Optional
import java.util.UUID

class TaskServiceTest {

    private lateinit var taskRepository: TaskRepository
    private lateinit var taskActivityLogRepository: TaskActivityLogRepository
    private lateinit var userRepository: UserRepository
    private lateinit var projectService: ProjectService
    private lateinit var authService: AuthService
    private lateinit var taskService: TaskService

    private val currentUserId = UUID.randomUUID()
    private val currentUser = User(
        id = currentUserId,
        name = "Charlie",
        email = "charlie@example.com",
        passwordHash = "hash"
    )
    private val projectId = UUID.randomUUID()
    private val project = Project(
        id = projectId,
        name = "Backend Refactor",
        owner = currentUser
    )

    @BeforeEach
    fun setUp() {
        taskRepository = mockk()
        taskActivityLogRepository = mockk()
        userRepository = mockk()
        projectService = mockk()
        authService = mockk()
        taskService = TaskService(taskRepository, taskActivityLogRepository, userRepository, projectService, authService)

        every { authService.getCurrentUserId() } returns currentUserId
        every { authService.getCurrentUser() } returns currentUser
        every { projectService.getProjectIfOwner(projectId, currentUserId) } returns project
        every { projectService.verifyProjectOwnership(projectId, currentUserId) } just Runs
    }

    @Test
    fun `createTask successfully saves task with valid attributes`() {
        val tomorrow = LocalDate.now().plusDays(1)
        val request = CreateTaskRequest(
            title = "Write Unit Tests",
            description = "MockK tests for service layer",
            status = TaskStatus.TODO,
            priority = TaskPriority.HIGH,
            dueDate = tomorrow
        )

        val savedTask = Task(
            id = UUID.randomUUID(),
            title = "Write Unit Tests",
            description = "MockK tests for service layer",
            status = TaskStatus.TODO,
            priority = TaskPriority.HIGH,
            dueDate = tomorrow,
            project = project
        )

        every { taskRepository.save(any()) } returns savedTask

        val result = taskService.createTask(projectId, request)

        assertEquals("Write Unit Tests", result.title)
        assertEquals(TaskStatus.TODO, result.status)
        assertEquals(TaskPriority.HIGH, result.priority)
        assertEquals(tomorrow, result.dueDate)
        verify(exactly = 1) { taskRepository.save(any()) }
    }

    @Test
    fun `createTask throws BadRequestException when dueDate is in the past`() {
        val yesterday = LocalDate.now().minusDays(1)
        val request = CreateTaskRequest(
            title = "Overdue on creation",
            dueDate = yesterday
        )

        val ex = assertThrows<BadRequestException> {
            taskService.createTask(projectId, request)
        }

        assertTrue(ex.message!!.contains("Due date cannot be in the past"))
        verify(exactly = 0) { taskRepository.save(any()) }
    }

    @Test
    fun `updateTaskStatus transitions status and writes to activity log`() {
        val taskId = UUID.randomUUID()
        val task = Task(
            id = taskId,
            title = "Task 1",
            status = TaskStatus.TODO,
            project = project
        )

        every { taskRepository.findById(taskId) } returns Optional.of(task)
        every { taskRepository.save(any()) } answers { firstArg() }
        every { taskActivityLogRepository.save(any()) } returns mockk()

        val request = UpdateTaskStatusRequest(status = TaskStatus.IN_PROGRESS)
        val result = taskService.updateTaskStatus(taskId, request)

        assertEquals(TaskStatus.IN_PROGRESS, result.status)
        verify(exactly = 1) {
            taskActivityLogRepository.save(match {
                it.task.id == taskId &&
                it.oldStatus == TaskStatus.TODO &&
                it.newStatus == TaskStatus.IN_PROGRESS &&
                it.user.id == currentUserId
            })
        }
    }

    @Test
    fun `deleteTask deletes when user owns the task's project`() {
        val taskId = UUID.randomUUID()
        val task = Task(
            id = taskId,
            title = "Task To Delete",
            project = project
        )

        every { taskRepository.findById(taskId) } returns Optional.of(task)
        every { taskRepository.delete(task) } just Runs

        taskService.deleteTask(taskId)

        verify(exactly = 1) { taskRepository.delete(task) }
    }

    @Test
    fun `getTaskAndVerifyOwnership throws ForbiddenException when accessed by non-owner`() {
        val otherUser = User(id = UUID.randomUUID(), name = "Other", email = "other@test.com", passwordHash = "h")
        val otherProject = Project(id = UUID.randomUUID(), name = "Other Project", owner = otherUser)
        val taskId = UUID.randomUUID()
        val task = Task(id = taskId, title = "Private Task", project = otherProject)

        every { taskRepository.findById(taskId) } returns Optional.of(task)

        assertThrows<ForbiddenException> {
            taskService.getTaskAndVerifyOwnership(taskId, currentUserId)
        }
    }

    @Test
    fun `getTasks returns paged result using Specification strategy`() {
        val task = Task(
            id = UUID.randomUUID(),
            title = "Specification Task",
            project = project
        )
        val page = PageImpl(listOf(task))

        every { taskRepository.findAll(any<Specification<Task>>(), any<Pageable>()) } returns page

        val result = taskService.getTasks(
            projectId = projectId,
            status = TaskStatus.TODO,
            priority = TaskPriority.HIGH,
            assigneeId = null,
            sortBy = "dueDate",
            direction = "asc",
            page = 0,
            size = 10
        )

        assertEquals(1, result.content.size)
        assertEquals("Specification Task", result.content[0].title)
    }

    @Test
    fun `createTask throws BadRequestException when assignee is not a member of project`() {
        val nonMemberId = UUID.randomUUID()
        val request = CreateTaskRequest(
            title = "Task with outsider",
            assigneeId = nonMemberId
        )

        every { projectService.isUserProjectMember(projectId, nonMemberId) } returns false

        val ex = assertThrows<BadRequestException> {
            taskService.createTask(projectId, request)
        }
        assertEquals("Assignee must be a registered member of this project", ex.message)
    }

    @Test
    fun `createTask assigns user when assignee is a registered member of project`() {
        val memberUser = User(id = UUID.randomUUID(), name = "Alex", email = "alex@test.com", passwordHash = "h")
        val request = CreateTaskRequest(
            title = "Task with member",
            assigneeId = memberUser.id
        )

        val savedTask = Task(
            id = UUID.randomUUID(),
            title = "Task with member",
            project = project,
            assignee = memberUser
        )

        every { projectService.isUserProjectMember(projectId, memberUser.id!!) } returns true
        every { userRepository.findById(memberUser.id!!) } returns Optional.of(memberUser)
        every { taskRepository.save(any()) } returns savedTask

        val result = taskService.createTask(projectId, request)

        assertEquals("Task with member", result.title)
        assertNotNull(result.assignee)
        assertEquals(memberUser.id, result.assignee?.id)
        assertEquals("Alex", result.assignee?.name)
    }
}

