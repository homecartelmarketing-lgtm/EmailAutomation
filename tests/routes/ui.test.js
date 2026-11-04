import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { buildServer } from '../../src/server.js';
import fs from 'node:fs';

describe('UI Dashboard Endpoints', () => {
  let app;
  const testDb = 'test_ui.db';

  beforeEach(async () => {
    app = await buildServer({ DB_PATH: testDb, EMAIL_PROVIDER: 'mock' });
  });

  afterEach(async () => {
    await app.close();
    if (fs.existsSync(testDb)) {
      try { fs.unlinkSync(testDb); } catch (e) {}
    }
  });

  it('serves interactive HTML UI on GET / for web browsers', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/',
      headers: {
        accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    });

    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toContain('text/html');
    expect(res.payload).toContain('HomeCartel Automation Console');
    expect(res.payload).toContain('Scheduled Delay Queue');
  });

  it('serves interactive HTML UI on GET /ui and GET /admin', async () => {
    const resUi = await app.inject({ method: 'GET', url: '/ui' });
    expect(resUi.statusCode).toBe(200);
    expect(resUi.headers['content-type']).toContain('text/html');
    expect(resUi.payload).toContain('HomeCartel Automation Console');

    const resAdmin = await app.inject({ method: 'GET', url: '/admin' });
    expect(resAdmin.statusCode).toBe(200);
    expect(resAdmin.headers['content-type']).toContain('text/html');
  });

  it('serves JSON when format=json query parameter is passed', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/?format=json'
    });

    expect(res.statusCode).toBe(200);
    const json = JSON.parse(res.payload);
    expect(json.status).toBe('online');
    expect(json.store).toBe('homecartel.net');
  });
});
