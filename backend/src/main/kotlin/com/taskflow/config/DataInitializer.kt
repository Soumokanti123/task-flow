package com.taskflow.config

import com.taskflow.domain.model.*
import com.taskflow.domain.repository.ProjectMemberRepository
import com.taskflow.domain.repository.ProjectRepository
import com.taskflow.domain.repository.TaskRepository
import com.taskflow.domain.repository.UserRepository
import org.slf4j.LoggerFactory
import org.springframework.boot.CommandLineRunner
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.stereotype.Component
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDate

@Component
class DataInitializer(
    private val userRepository: UserRepository,
    private val projectRepository: ProjectRepository,
    private val projectMemberRepository: ProjectMemberRepository,
    private val taskRepository: TaskRepository,
    private val passwordEncoder: PasswordEncoder
) : CommandLineRunner {

    private val logger = LoggerFactory.getLogger(DataInitializer::class.java)

    @Transactional
    override fun run(vararg args: String?) {
        val demoEmail = "demo@taskflow.dev"
        if (userRepository.existsByEmail(demoEmail)) {
            logger.info("Demo seed data already exists.")
            return
        }

        logger.info("Seeding initial data for TaskFlow...")

        val demoUser = userRepository.save(
            User(
                name = "Demo User",
                email = demoEmail,
                passwordHash = passwordEncoder.encode("Password123!")
            )
        )

        val teammate = userRepository.save(
            User(
                name = "Alex Teammate",
                email = "alex@taskflow.dev",
                passwordHash = passwordEncoder.encode("Password123!")
            )
        )

        val project = projectRepository.save(
            Project(
                name = "TaskFlow Core Platform",
                description = "Primary sprint tasks and infrastructure delivery for TaskFlow",
                owner = demoUser
            )
        )

        projectMemberRepository.save(
            ProjectMember(
                project = project,
                user = demoUser,
                role = ProjectRole.OWNER
            )
        )

        projectMemberRepository.save(
            ProjectMember(
                project = project,
                user = teammate,
                role = ProjectRole.MEMBER
            )
        )

        // Seed sample tasks across statuses and overdue criteria
        val today = LocalDate.now()

        val task1 = Task(
            title = "Architect REST API & Database Schema",
            description = "Draft ER diagram, establish Flyway migrations, and configure Spring Boot 3",
            status = TaskStatus.DONE,
            priority = TaskPriority.HIGH,
            dueDate = today.minusDays(2),
            project = project,
            assignee = demoUser
        )

        val task2 = Task(
            title = "Implement JWT Authentication & RBAC",
            description = "Stateless security filter with HMAC-SHA256 signature verification",
            status = TaskStatus.IN_PROGRESS,
            priority = TaskPriority.HIGH,
            dueDate = today.plusDays(1),
            project = project,
            assignee = teammate
        )

        val task3 = Task(
            title = "Fix critical regression in legacy session migration",
            description = "Urgent hotfix required for session fallback; overdue item demonstration",
            status = TaskStatus.TODO,
            priority = TaskPriority.HIGH,
            dueDate = today.minusDays(1), // OVERDUE!
            project = project,
            assignee = demoUser
        )

        val task4 = Task(
            title = "Develop Interactive Kanban Board UI",
            description = "Build clean 3-column board with drag/select status transitions in React",
            status = TaskStatus.IN_PROGRESS,
            priority = TaskPriority.MEDIUM,
            dueDate = today.plusDays(4),
            project = project,
            assignee = demoUser
        )

        val task5 = Task(
            title = "Setup Docker Compose & Production Profile",
            description = "Multi-stage Dockerfile and container orchestration for backend, frontend and PostgreSQL",
            status = TaskStatus.TODO,
            priority = TaskPriority.LOW,
            dueDate = today.plusDays(6),
            project = project,
            assignee = null
        )

        taskRepository.saveAll(listOf(task1, task2, task3, task4, task5))
        logger.info("Demo seed data created successfully. Log in with '$demoEmail' / 'Password123!'")
    }
}

