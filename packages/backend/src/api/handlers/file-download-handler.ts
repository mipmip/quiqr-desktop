/**
 * File Download Handler
 *
 * Serves files from within the workspace's site directory for browser download.
 * Includes path traversal protection: only files under the site root are served.
 */

import * as fs from 'fs';
import * as path from 'path';
import type { Request, Response } from 'express';
import type { AppContainer } from '../../config/container.js';

/**
 * Create a GET handler for file downloads restricted to the workspace site directory.
 *
 * Security:
 * - Resolves the requested path with fs.realpath() to eliminate symlinks and .. sequences
 * - Verifies the resolved path starts with the workspace's site root
 * - Rejects paths outside the site directory with 403
 */
export function createFileDownloadHandler(container: AppContainer) {
  return async (req: Request, res: Response) => {
    const { siteKey, workspaceKey } = req.params;
    const filePath = req.query.path;

    if (typeof siteKey !== 'string' || typeof workspaceKey !== 'string') {
      res.status(400).json({ error: 'Invalid site or workspace key' });
      return;
    }

    if (typeof filePath !== 'string' || filePath.length === 0) {
      res.status(400).json({ error: 'Missing or invalid path parameter' });
      return;
    }

    try {
      const workspaceService = await container.getWorkspaceService(siteKey, workspaceKey);
      const siteRoot = workspaceService.getWorkspacePath();

      // Resolve the site root to its real path (no symlinks)
      const realSiteRoot = await fs.promises.realpath(siteRoot);

      // If the path is relative, resolve it against the site root
      const targetPath = path.isAbsolute(filePath)
        ? filePath
        : path.join(realSiteRoot, filePath);

      // Check the file exists before resolving realpath
      try {
        await fs.promises.access(targetPath, fs.constants.R_OK);
      } catch {
        res.status(404).json({ error: 'File not found' });
        return;
      }

      // Resolve to real path (eliminates symlinks and .. sequences)
      const realPath = await fs.promises.realpath(targetPath);

      // Verify the resolved path is within the site root
      if (!realPath.startsWith(realSiteRoot + path.sep) && realPath !== realSiteRoot) {
        res.status(403).json({ error: 'Access denied' });
        return;
      }

      // Stream the file as a download
      const filename = path.basename(realPath);
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      const stream = fs.createReadStream(realPath);
      stream.pipe(res);
      stream.on('error', () => {
        if (!res.headersSent) {
          res.status(500).json({ error: 'Error reading file' });
        }
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      res.status(500).json({ error: message });
    }
  };
}
