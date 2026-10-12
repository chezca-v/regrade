# AI Agent Guidelines & Context

This document provides instructions, context, and constraints for AI coding agents (such as Claude, Cursor, Copilot, etc.) working within this repository.

## 🎯 Primary Directive
* Write clean, maintainable, production-ready code that strictly adheres to the existing patterns, styling conventions, and architecture of this project.
* Do not introduce breaking changes or unnecessary dependencies without explicit user confirmation.

## 🛠️ Code Standards & Best Practices
* **Language/Framework Conventions:** Follow idiomatic practices for the primary language used in this repository.
* **Error Handling:** Always handle edge cases gracefully. Avoid unhandled promise rejections or silent failures.
* **Typing/Linting:** Ensure all code passes linting and strict type-checking rules configured in the project.
* **Comments:** Document complex business logic or non-obvious algorithms, but avoid cluttering self-explanatory code with redundant comments.

## 🧪 Testing Protocol
* When writing new features or refactoring code, include or update corresponding unit/integration tests in the `tests/` directory.
* Verify that all local tests pass before proposing changes.

## 🔒 Security & Safety Constraints
* **Never hardcode secrets:** Always use environment variables (`.env`) for API keys, passwords, and sensitive configurations.
* **Sanitize Inputs:** Ensure all user inputs and external data payloads are properly validated and sanitized.