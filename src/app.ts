import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import apiRouter from './presentation/routes';
import { errorHandler } from './core/middlewares/error-handler';
import { NotFoundError } from './core/errors/app-error';
import { env } from './config/environment';
import { openApiDocument } from './presentation/openapi';

const app = express();

// Set security HTTP headers
app.use(helmet());

// Enable CORS for the frontend application and local API tooling
app.use(cors({
  origin: env.NODE_ENV === 'production' ? env.CLIENT_URL : true,
  credentials: true,
}));

// Body parser, reading data from body into req.body
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Limit requests from same API
const limiter = rateLimit({
  max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
  windowMs: 15 * 60 * 1000, // 15 minutes
  message: 'Too many requests from this IP, please try again in 15 minutes!',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});
app.use('/api', limiter);

// API Versioning namespace
app.get('/api/v1/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    data: {
      service: 'mantis-ai-api',
      environment: env.NODE_ENV,
      uptimeSeconds: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    },
  });
});

app.get('/api/v1/openapi.json', (req, res) => {
  res.status(200).json(openApiDocument);
});

app.get('/api/v1/docs', (req, res) => {
  res.type('html').send(`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Mantis AI API Docs</title>
    <style>
      body { font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; margin: 0; background: #08111f; color: #e5edf7; }
      main { max-width: 960px; margin: 0 auto; padding: 48px 20px; }
      a { color: #22d3ee; }
      section { border: 1px solid rgba(148, 163, 184, .24); border-radius: 8px; padding: 18px; margin-top: 16px; background: rgba(15, 23, 42, .72); }
      code { background: rgba(148, 163, 184, .16); padding: 2px 6px; border-radius: 5px; }
    </style>
  </head>
  <body>
    <main>
      <h1>Mantis AI API Docs</h1>
      <p>OpenAPI schema: <a href="/api/v1/openapi.json">/api/v1/openapi.json</a></p>
      ${openApiDocument.tags.map((tag) => `<section><h2>${tag.name}</h2><p>See the OpenAPI document for request and response contracts.</p></section>`).join('')}
    </main>
  </body>
</html>`);
});
app.use('/api/v1', apiRouter);

// Handle unhandled routes
app.all('*', (req, res, next) => {
  next(new NotFoundError(`Can't find ${req.originalUrl} on this server!`));
});

// Global Error handling middleware
app.use(errorHandler);

export default app;
