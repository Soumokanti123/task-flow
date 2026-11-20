package com.taskflow.domain.repository

import com.taskflow.domain.model.ProjectMember
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import java.util.Optional
import java.util.UUID

@Repository
interface ProjectMemberRepository : JpaRepository<ProjectMember, UUID> {

    @Query("SELECT pm FROM ProjectMember pm JOIN FETCH pm.user WHERE pm.project.id = :projectId ORDER BY pm.joinedAt ASC")
    fun findByProjectIdWithUser(@Param("projectId") projectId: UUID): List<ProjectMember>

    fun findByProjectIdAndUserId(projectId: UUID, userId: UUID): Optional<ProjectMember>

    fun existsByProjectIdAndUserId(projectId: UUID, userId: UUID): Boolean

    fun deleteByProjectIdAndUserId(projectId: UUID, userId: UUID)
}

