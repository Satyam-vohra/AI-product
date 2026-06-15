export const openApiDocument = {
  openapi: '3.0.3',
  info: {
    title: 'Mantis AI API',
    version: '1.0.0',
    description: 'Production API for AI product diagnostics, knowledge search, uploads, analytics, and notifications.',
  },
  servers: [{ url: '/api/v1' }],
  tags: [
    { name: 'Health' },
    { name: 'Authentication' },
    { name: 'Products' },
    { name: 'Knowledge Base' },
    { name: 'Diagnostics' },
    { name: 'Search' },
    { name: 'Analytics' },
    { name: 'Notifications' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
  },
  paths: {
    '/health': {
      get: {
        tags: ['Health'],
        summary: 'Check API liveness and runtime metadata',
        responses: { '200': { description: 'API is healthy' } },
      },
    },
    '/auth/register': {
      post: {
        tags: ['Authentication'],
        summary: 'Register a user, company manager, or service engineer',
        responses: { '201': { description: 'Registration successful' }, '409': { description: 'Email already exists' } },
      },
    },
    '/auth/login': {
      post: {
        tags: ['Authentication'],
        summary: 'Login and receive access/refresh tokens',
        responses: { '200': { description: 'Login successful' }, '401': { description: 'Invalid credentials' } },
      },
    },
    '/auth/profile': {
      get: {
        tags: ['Authentication'],
        security: [{ bearerAuth: [] }],
        summary: 'Get current authenticated profile',
        responses: { '200': { description: 'Profile returned' }, '401': { description: 'Unauthorized' } },
      },
    },
    '/products': {
      get: {
        tags: ['Products'],
        summary: 'List products with category/search pagination',
        responses: { '200': { description: 'Product list returned' } },
      },
      post: {
        tags: ['Products'],
        security: [{ bearerAuth: [] }],
        summary: 'Create a product with optional images/manual upload',
        responses: { '201': { description: 'Product created' } },
      },
    },
    '/kb': {
      get: {
        tags: ['Knowledge Base'],
        summary: 'List indexed knowledge documents',
        responses: { '200': { description: 'Knowledge documents returned' } },
      },
      post: {
        tags: ['Knowledge Base'],
        security: [{ bearerAuth: [] }],
        summary: 'Upload or create a knowledge document and build embeddings',
        responses: { '201': { description: 'Knowledge document created' } },
      },
    },
    '/sessions': {
      post: {
        tags: ['Diagnostics'],
        security: [{ bearerAuth: [] }],
        summary: 'Create an AI diagnostic session for a product',
        responses: { '201': { description: 'Session created' } },
      },
    },
    '/sessions/{id}/messages': {
      post: {
        tags: ['Diagnostics'],
        security: [{ bearerAuth: [] }],
        summary: 'Send a chat message to the AI diagnostic agent',
        responses: { '200': { description: 'Updated chat history returned' } },
      },
    },
    '/search': {
      get: {
        tags: ['Search'],
        summary: 'Global search across products and knowledge documents',
        responses: { '200': { description: 'Search results returned' } },
      },
    },
    '/analytics/events': {
      post: {
        tags: ['Analytics'],
        summary: 'Capture a product analytics event',
        responses: { '202': { description: 'Event accepted' } },
      },
    },
    '/analytics/summary': {
      get: {
        tags: ['Analytics'],
        security: [{ bearerAuth: [] }],
        summary: 'Return aggregate event analytics',
        responses: { '200': { description: 'Analytics summary returned' } },
      },
    },
    '/notifications': {
      get: {
        tags: ['Notifications'],
        security: [{ bearerAuth: [] }],
        summary: 'List user notifications',
        responses: { '200': { description: 'Notifications returned' } },
      },
    },
    '/notifications/{id}/ack': {
      post: {
        tags: ['Notifications'],
        security: [{ bearerAuth: [] }],
        summary: 'Acknowledge a notification',
        responses: { '200': { description: 'Notification acknowledged' } },
      },
    },
  },
};
