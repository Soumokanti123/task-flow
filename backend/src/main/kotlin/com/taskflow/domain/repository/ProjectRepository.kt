package com.taskflow.domain.repository

import com.taskflow.domain.model.Project
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository
import java.util.Optional
import java.util.UUID

@Repository
interface ProjectRepository : JpaRepository<Project, UUID> {
    fun findAllByOwnerIdOrderByCreatedAtDesc(ownerId: UUID): List<Project>
    fun findByIdAndOwnerId(id: UUID, ownerId: UUID): Optional<Project>
    fun existsByIdAndOwnerId(id: UUID, ownerId: UUID): Boolean
}

