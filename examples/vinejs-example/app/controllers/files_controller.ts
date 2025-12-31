import type { HttpContext } from '@adonisjs/core/http'
import vine from '@vinejs/vine'
import {
  SwaggerInfo,
  SwaggerResponse,
  SwaggerRequestBody,
  vineFile,
} from 'adonis-open-swagger'

export default class FilesController {
  @SwaggerInfo({
    tags: ['Files'],
    summary: 'Upload a single file',
    description: 'Upload a single file with multipart/form-data',
  })
  @SwaggerRequestBody(
    'File upload data',
    vine.object({
      name: vine.string(),
      file: vineFile({ description: 'The file to upload' }),
    }),
    { contentType: 'multipart/form-data' }
  )
  @SwaggerResponse(201, 'File uploaded successfully')
  @SwaggerResponse(400, 'Invalid file')
  async upload({ request, response }: HttpContext) {
    // Mock file upload
    return response.status(201).json({
      message: 'File uploaded successfully',
      filename: 'uploaded-file.pdf',
    })
  }

  @SwaggerInfo({
    tags: ['Files'],
    summary: 'Upload multiple files',
    description: 'Upload multiple files with multipart/form-data',
  })
  @SwaggerRequestBody(
    'Multiple files upload',
    vine.object({
      title: vine.string(),
      files: vineFile({ multiple: true, minItems: 1, maxItems: 5, description: 'Files to upload' }),
    }),
    { contentType: 'multipart/form-data' }
  )
  @SwaggerResponse(201, 'Files uploaded successfully')
  @SwaggerResponse(400, 'Invalid files')
  async uploadMultiple({ request, response }: HttpContext) {
    // Mock multiple file upload
    return response.status(201).json({
      message: 'Files uploaded successfully',
      count: 3,
    })
  }
}

