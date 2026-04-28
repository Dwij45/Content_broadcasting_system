import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { type Express } from 'express';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Broadcasting App API',
      version: '1.0.0',
      description: 'API Documentation for the Broadcasting Application',
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
    servers: [
      {
        url: 'https://content-broadcasting-system-8o9c.onrender.com',
        description: 'Production Server'
      },
      {
        url: `http://localhost:${process.env.PORT || 3000}`,
        description: 'Local Development Server'
      },
    ],
  },
  // Ensure we match the file extensions based on verbatimModuleSyntax and es2022
  apis: ['./src/modules/**/*.route.ts', './src/modules/**/*.controller.ts', './src/modules/**/*.schema.ts'],
};

const swaggerSpec = swaggerJsdoc(options);

export const setupSwagger = (app: Express) => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    swaggerOptions: {
      persistAuthorization: true,
    }
  }));
};
