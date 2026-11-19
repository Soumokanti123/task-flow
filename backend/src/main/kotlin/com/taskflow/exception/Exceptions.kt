package com.taskflow.exception

class ResourceNotFoundException(message: String) : RuntimeException(message)

class ForbiddenException(message: String = "You do not have permission to access this resource") : RuntimeException(message)

class DuplicateEmailException(message: String = "Email is already registered") : RuntimeException(message)

class BadRequestException(message: String) : RuntimeException(message)

