package com.taskflow.service

import com.taskflow.domain.model.User
import com.taskflow.domain.repository.UserRepository
import com.taskflow.dto.request.LoginRequest
import com.taskflow.dto.request.RegisterRequest
import com.taskflow.dto.response.AuthResponse
import com.taskflow.exception.DuplicateEmailException
import com.taskflow.exception.ResourceNotFoundException
import com.taskflow.mapper.toResponse
import com.taskflow.security.JwtService
import com.taskflow.security.UserPrincipal
import org.springframework.security.authentication.AuthenticationManager
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

@Service
class AuthService(
    private val userRepository: UserRepository,
    private val passwordEncoder: PasswordEncoder,
    private val jwtService: JwtService,
    private val authenticationManager: AuthenticationManager
) {

    @Transactional
    fun register(request: RegisterRequest): AuthResponse {
        val normalizedEmail = request.email.trim().lowercase()
        if (userRepository.existsByEmail(normalizedEmail)) {
            throw DuplicateEmailException("User with email '$normalizedEmail' already exists")
        }

        val newUser = User(
            name = request.name.trim(),
            email = normalizedEmail,
            passwordHash = passwordEncoder.encode(request.password)
        )

        val savedUser = userRepository.save(newUser)
        val principal = UserPrincipal(savedUser)
        val token = jwtService.generateToken(principal)

        return AuthResponse(
            token = token,
            user = savedUser.toResponse()
        )
    }

    @Transactional(readOnly = true)
    fun login(request: LoginRequest): AuthResponse {
        val normalizedEmail = request.email.trim().lowercase()

        val authentication = authenticationManager.authenticate(
            UsernamePasswordAuthenticationToken(normalizedEmail, request.password)
        )

        val principal = authentication.principal as UserPrincipal
        val token = jwtService.generateToken(principal)

        return AuthResponse(
            token = token,
            user = principal.user.toResponse()
        )
    }

    @Transactional(readOnly = true)
    fun getCurrentUser(): User {
        val authentication = SecurityContextHolder.getContext().authentication
            ?: throw IllegalStateException("No authenticated user found in SecurityContext")

        val principal = authentication.principal as? UserPrincipal
            ?: throw IllegalStateException("Principal is not of type UserPrincipal")

        return userRepository.findById(principal.id)
            .orElseThrow { ResourceNotFoundException("Authenticated user not found in database") }
    }

    @Transactional(readOnly = true)
    fun getCurrentUserId(): UUID {
        val authentication = SecurityContextHolder.getContext().authentication
            ?: throw IllegalStateException("No authenticated user found in SecurityContext")

        val principal = authentication.principal as? UserPrincipal
            ?: throw IllegalStateException("Principal is not of type UserPrincipal")

        return principal.id
    }
}

