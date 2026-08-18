import swaggerJSDoc from "swagger-jsdoc";
import path from "path";

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Task Tracker API",
      version: "1.0.0",
      description: "API documentation for the Task Tracker application",
    },
    servers: [
      {
        url: "http://localhost:3000",
        description: "Development Server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        ErrorResponse: {
          type: "object",
          properties: {
            error: { type: "string", example: "BadRequest" },
            message: { type: "string", example: "Invalid parameters" },
          },
        },
        Project: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            name: { type: "string", example: "Mobile App Redesign" },
            description: {
              type: "string",
              nullable: true,
              example: "Client facing dashboard updates",
            },
            userId: { type: "string", format: "uuid" },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        Task: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            name: { type: "string", example: "Design Landing Page" },
            description: { type: "string", nullable: true },
            status: {
              type: "string",
              enum: ["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"],
            },
            priority: { type: "string", enum: ["LOW", "MEDIUM", "HIGH"] },
            estimatedTime: { type: "integer", nullable: true, example: 120 },
            dueDate: { type: "string", format: "date-time", nullable: true },
            projectId: { type: "string", format: "uuid" },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        TimeEntry: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            durationMinutes: { type: "integer", example: 45 },
            entryDate: {
              type: "string",
              format: "date",
              example: "2026-08-10",
            },
            note: { type: "string", nullable: true },
            taskId: { type: "string", format: "uuid" },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        TaskHistory: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            taskId: { type: "string", format: "uuid" },
            actorId: { type: "string", format: "uuid" },
            action: { type: "string", example: "TASK_UPDATED" },
            changes: { type: "object" },
            createdAt: { type: "string", format: "date-time" },
            actor: {
              type: "object",
              properties: {
                id: { type: "string", format: "uuid" },
                name: { type: "string" },
                email: { type: "string" },
              },
            },
          },
        },
      },
    },
  },
  apis: [
    // Paths for production (Docker runs compiled .js in dist)
    path.join(process.cwd(), "dist/routes/**/*.js"),
    path.join(process.cwd(), "dist/controllers/**/*.js"),
    // Paths for development (tsx runs .ts in src)
    path.join(process.cwd(), "src/routes/**/*.ts"),
    path.join(process.cwd(), "src/controllers/**/*.ts"),
  ],
};

export const swaggerSpec = swaggerJSDoc(options);
