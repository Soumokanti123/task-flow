package com.taskflow.security

import io.jsonwebtoken.Claims
import io.jsonwebtoken.Jwts
import io.jsonwebtoken.security.Keys
import org.springframework.beans.factory.annotation.Value
import org.springframework.security.core.userdetails.UserDetails
import org.springframework.stereotype.Service
import java.nio.charset.StandardCharsets
import java.util.Date
import java.util.UUID
import javax.crypto.SecretKey

@Service
class JwtService(
    @Value("\${security.jwt.secret}")
    private val secretKey: String,

    @Value("\${security.jwt.expiration-ms:86400000}")
    private val expirationMs: Long
) {

    private val signingKey: SecretKey by lazy {
        val keyBytes = secretKey.toByteArray(StandardCharsets.UTF_8)
        Keys.hmacShaKeyFor(keyBytes)
    }

    fun generateToken(userPrincipal: UserPrincipal): String {
        val now = Date()
        val expiryDate = Date(now.time + expirationMs)

        return Jwts.builder()
            .subject(userPrincipal.username)
            .claim("userId", userPrincipal.id.toString())
            .claim("name", userPrincipal.name)
            .issuedAt(now)
            .expiration(expiryDate)
            .signWith(signingKey)
            .compact()
    }

    fun extractUsername(token: String): String {
        return extractAllClaims(token).subject
    }

    fun extractUserId(token: String): UUID {
        val idString = extractAllClaims(token)["userId"] as String
        return UUID.fromString(idString)
    }

    fun isTokenValid(token: String, userDetails: UserDetails): Boolean {
        return try {
            val username = extractUsername(token)
            username == userDetails.username && !isTokenExpired(token)
        } catch (e: Exception) {
            false
        }
    }

    private fun isTokenExpired(token: String): Boolean {
        val expiration = extractAllClaims(token).expiration
        return expiration.before(Date())
    }

    private fun extractAllClaims(token: String): Claims {
        return Jwts.parser()
            .verifyWith(signingKey)
            .build()
            .parseSignedClaims(token)
            .payload
    }
}

