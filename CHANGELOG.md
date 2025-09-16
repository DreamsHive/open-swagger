# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2024-01-XX

### Added

- Initial release of Open Swagger for AdonisJS v6
- Automatic OpenAPI specification generation from AdonisJS routes
- Scalar UI integration for modern API documentation
- Support for custom documentation via decorators
- Ace commands for generating and validating OpenAPI specs
- Configurable route scanning and filtering
- TypeScript support with full type definitions
- Middleware for CORS and security headers
- Example controller with decorator usage
- Comprehensive test suite

### Features

- 🚀 **Modern UI**: Uses Scalar instead of traditional Swagger UI
- 🔄 **Auto-generation**: Automatically generates OpenAPI specs from routes
- 🎨 **Customizable**: Flexible configuration and theming options
- 📝 **Custom docs**: Support for custom documentation via decorators
- 🛠️ **CLI Integration**: Seamless integration with AdonisJS Ace commands
- 📦 **TypeScript**: Full TypeScript support with proper type definitions

### Commands

- `node ace configure open-swagger` - Configure the package
- `node ace swagger:generate` - Generate OpenAPI specification files
- `node ace swagger:validate` - Validate the generated specification

### Decorators

- `@SwaggerInfo()` - Primary decorator combining tags, summary, and description
- `@SwaggerParam()` - Enhanced parameter decorator for query/path parameters
- `@SwaggerHeader()` - Header parameter decorator with clean API
- `@SwaggerResponse()` - Define response schemas
- `@SwaggerRequestBody()` - Define request body schema
- `@SwaggerParameter()` - Define parameters (legacy - use SwaggerParam instead)
- `@SwaggerDeprecated()` - Mark operations as deprecated
- `@SwaggerSecurity()` - Define security requirements
- `@Swagger()` - Combined decorator for common options
