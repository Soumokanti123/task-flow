package com.taskflow

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication

@SpringBootApplication
class TaskflowBackendApplication

fun main(args: Array<String>) {
	runApplication<TaskflowBackendApplication>(*args)
}
