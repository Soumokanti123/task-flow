package com.taskflow.service

import com.taskflow.domain.model.User
import com.taskflow.domain.repository.UserRepository
import com.taskflow.dto.request.LoginRequest
import com.taskflow.dto.request.RegisterRequest
import com.taskflow.exception.DuplicateEmailException
import com.taskflow.security.JwtService
import com.taskflow.security.UserPrincipal
import io.mockk.every
import io.mockk.mockk
import io.mockk.verify
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import org.springframework.security.authentication.AuthenticationManager
import org.springframework.security.authentication.BadCredentialsException
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.security.crypto.password.PasswordEncoder
import java.util.UUID

class AuthServiceTest {

    private lateinit var userRepository: UserRepository
    private lateinit var passwordEncoder: PasswordEncoder
    private lateinit var jwtService: JwtService
    private lateinit var authenticationManager: AuthenticationManager
    private lateinit var authService: AuthService

    @BeforeEach
    fun setUp() {
        userRepository = mockk()
        passwordEncoder = mockk()
        jwtService = mockk()
        authenticationManager = mockk()
        authService = AuthService(userRepository, passwordEncoder, jwtService, authenticationManager)
    }

    @Test
    fun `register successfully creates user and returns jwt token`() {
        val request = RegisterRequest(name = "Alice", email = "alice@example.com", password = "SecretPassword123")
        val savedUser = User(
            id = UUID.randomUUID(),
            name = "Alice",
            email = "alice@example.com",
            passwordHash = "hashedPassword"
        )

        every { userRepository.existsByEmail("alice@example.com") } returns false
        every { passwordEncoder.encode("SecretPassword123") } returns "hashedPassword"
        every { userRepository.save(any()) } returns savedUser
        every { jwtService.generateToken(any()) } returns "mock-jwt-token"

        val response = authService.register(request)

        assertNotNull(response)
        assertEquals("mock-jwt-token", response.token)
        assertEquals("Alice", response.user.name)
        assertEquals("alice@example.com", response.user.email)
        verify(exactly = 1) { userRepository.save(any()) }
    }

    @Test
    fun `register throws DuplicateEmailException when email already exists`() {
        val request = RegisterRequest(name = "Alice", email = "alice@example.com", password = "SecretPassword123")

        every { userRepository.existsByEmail("alice@example.com") } returns true

        val exception = assertThrows<DuplicateEmailException> {
            authService.register(request)
        }

        assertTrue(exception.message!!.contains("already exists"))
        verify(exactly = 0) { userRepository.save(any()) }
    }

    @Test
    fun `login successfully authenticates and returns token`() {
        val request = LoginRequest(email = "alice@example.com", password = "SecretPassword123")
        val user = User(
            id = UUID.randomUUID(),
            name = "Alice",
            email = "alice@example.com",
            passwordHash = "hashedPassword"
        )
        val principal = UserPrincipal(user)
        val authToken = UsernamePasswordAuthenticationToken(principal, null, principal.authorities)

        every { authenticationManager.authenticate(any()) } returns authToken
        every { jwtService.generateToken(principal) } returns "mock-login-token"

        val response = authService.login(request)

        assertEquals("mock-login-token", response.token)
        assertEquals("alice@example.com", response.user.email)
    }

    @Test
    fun `login fails with BadCredentialsException when credentials invalid`() {
        val request = LoginRequest(email = "alice@example.com", password = "WrongPassword")

        every { authenticationManager.authenticate(any()) } throws BadCredentialsException("Bad credentials")

        assertThrows<BadCredentialsException> {
            authService.login(request)
        }
    }
}

