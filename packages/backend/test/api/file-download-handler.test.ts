/**
 * Tests for file-download handler path traversal protection
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import { mkdtempSync, writeFileSync, mkdirSync, symlinkSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { createFileDownloadHandler } from '../../src/api/handlers/file-download-handler.js';

function createTestApp(siteRoot: string) {
  const app = express();

  const mockContainer = {
    getWorkspaceService: vi.fn().mockResolvedValue({
      getWorkspacePath: () => siteRoot,
    }),
  } as any;

  app.get(
    '/api/sites/:siteKey/workspaces/:workspaceKey/file-download',
    createFileDownloadHandler(mockContainer)
  );

  return app;
}

describe('File Download Handler', () => {
  let siteDir: string;
  let outsideDir: string;

  beforeEach(() => {
    siteDir = mkdtempSync(join(tmpdir(), 'quiqr-test-site-'));
    outsideDir = mkdtempSync(join(tmpdir(), 'quiqr-test-outside-'));

    // Create a valid file inside the site directory
    writeFileSync(join(siteDir, 'output.pdf'), 'PDF content');

    // Create a subdirectory with a file
    mkdirSync(join(siteDir, 'subdir'));
    writeFileSync(join(siteDir, 'subdir', 'report.html'), '<html>Report</html>');

    // Create a file outside the site directory
    writeFileSync(join(outsideDir, 'secret.txt'), 'sensitive data');
  });

  afterEach(() => {
    rmSync(siteDir, { recursive: true, force: true });
    rmSync(outsideDir, { recursive: true, force: true });
  });

  it('serves a file within the site directory', async () => {
    const app = createTestApp(siteDir);
    const res = await request(app)
      .get('/api/sites/test-site/workspaces/main/file-download')
      .query({ path: join(siteDir, 'output.pdf') });

    expect(res.status).toBe(200);
    expect(res.headers['content-disposition']).toContain('output.pdf');
    expect(res.text).toBe('PDF content');
  });

  it('serves a file using a relative path', async () => {
    const app = createTestApp(siteDir);
    const res = await request(app)
      .get('/api/sites/test-site/workspaces/main/file-download')
      .query({ path: 'subdir/report.html' });

    expect(res.status).toBe(200);
    expect(res.headers['content-disposition']).toContain('report.html');
    expect(res.text).toBe('<html>Report</html>');
  });

  it('rejects path traversal with .. sequences', async () => {
    const app = createTestApp(siteDir);
    const res = await request(app)
      .get('/api/sites/test-site/workspaces/main/file-download')
      .query({ path: join(siteDir, '..', 'quiqr-test-outside-something', 'secret.txt') });

    expect(res.status).toBeOneOf([403, 404]);
  });

  it('rejects absolute path outside site directory', async () => {
    const app = createTestApp(siteDir);
    const res = await request(app)
      .get('/api/sites/test-site/workspaces/main/file-download')
      .query({ path: join(outsideDir, 'secret.txt') });

    expect(res.status).toBe(403);
  });

  it('rejects symlink pointing outside site directory', async () => {
    // Create a symlink inside the site dir pointing to outside
    const symlinkPath = join(siteDir, 'evil-link.txt');
    try {
      symlinkSync(join(outsideDir, 'secret.txt'), symlinkPath);
    } catch {
      // Symlink creation may fail on some platforms, skip
      return;
    }

    const app = createTestApp(siteDir);
    const res = await request(app)
      .get('/api/sites/test-site/workspaces/main/file-download')
      .query({ path: symlinkPath });

    expect(res.status).toBe(403);
  });

  it('returns 404 for non-existent file', async () => {
    const app = createTestApp(siteDir);
    const res = await request(app)
      .get('/api/sites/test-site/workspaces/main/file-download')
      .query({ path: join(siteDir, 'nonexistent.pdf') });

    expect(res.status).toBe(404);
  });

  it('returns 400 when path parameter is missing', async () => {
    const app = createTestApp(siteDir);
    const res = await request(app)
      .get('/api/sites/test-site/workspaces/main/file-download');

    expect(res.status).toBe(400);
  });
});
