package com.taskflow.domain.repository

import com.taskflow.domain.model.Project
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import java.util.Optional
import java.util.UUID

@Repository
interface ProjectRepository : JpaRepository<Project, UUID> {
    fun findAllByOwnerIdOrderByCreatedAtDesc(ownerId: UUID): List<Project>
    fun findByIdAndOwnerId(id: UUID, ownerId: UUID): Optional<Project>
    fun existsByIdAndOwnerId(id: UUID, ownerId: UUID): Boolean

    @Query("SELECT DISTINCT p FROM Project p LEFT JOIN ProjectMember pm ON pm.project.id = p.id WHERE p.owner.id = :userId OR pm.user.id = :userId ORDER BY p.createdAt DESC")
    fun findAllByOwnerOrMember(@Param("userId") userId: UUID): List<Project>
}


