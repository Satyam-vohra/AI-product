# Environment Setup

Required API variables:

- `PORT`: API port, default `5000`.
- `NODE_ENV`: `development`, `test`, or `production`.
- `CLIENT_URL`: Public frontend origin for CORS.
- `MONGO_URI`: MongoDB connection string.
- `REDIS_URL`: Redis connection string. Optional outside production.
- `JWT_SECRET`: Access-token signing secret.
- `JWT_REFRESH_SECRET`: Refresh-token signing secret.
- `JWT_ACCESS_EXPIRATION`: Access-token lifetime, default `15m`.
- `JWT_REFRESH_EXPIRATION`: Refresh-token lifetime, default `7d`.
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`: Upload provider credentials. Use `mock` for local no-op upload mode.
- `OPENAI_API_KEY`: Reserved for hosted LLM integration. The current diagnostic engine has deterministic fallback behavior.
- `OPENAI_MODEL`: Optional OpenAI model name for Responses API calls. Default is `gpt-5.5`.

Required frontend variables:

- `NEXT_PUBLIC_API_URL`: Browser-visible API base URL, for example `http://localhost:5000/api/v1`.

Production guidance:

- Use 32+ byte random JWT secrets from a secrets manager.
- Use separate MongoDB databases for development, staging, and production.
- Set `CLIENT_URL` to the exact deployed frontend origin.
- Keep Cloudinary credentials server-side only.
