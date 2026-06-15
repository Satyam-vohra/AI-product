import request from 'supertest';
import app from '../src/app';

describe('API smoke tests', () => {
  it('returns health metadata', async () => {
    const response = await request(app).get('/api/v1/health').expect(200);

    expect(response.body.status).toBe('success');
    expect(response.body.data.service).toBe('mantis-ai-api');
  });

  it('serves OpenAPI JSON', async () => {
    const response = await request(app).get('/api/v1/openapi.json').expect(200);

    expect(response.body.openapi).toBe('3.0.3');
    expect(response.body.paths['/auth/login']).toBeDefined();
  });

  it('serves documentation HTML', async () => {
    const response = await request(app).get('/api/v1/docs').expect(200);

    expect(response.text).toContain('Mantis AI API Docs');
  });

  it('returns empty global search for blank query without touching database', async () => {
    const response = await request(app).get('/api/v1/search').expect(200);

    expect(response.body.data.products).toEqual([]);
    expect(response.body.data.knowledge).toEqual([]);
  });

  it('validates login payloads before controller execution', async () => {
    const response = await request(app).post('/api/v1/auth/login').send({ email: 'bad' }).expect(400);

    expect(response.body.status).toBe('error');
  });
});
