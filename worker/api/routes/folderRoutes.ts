import { FolderController } from '../controllers/folders/controller';
import { Hono } from 'hono';
import { AppEnv } from '../../types/appenv';
import { adaptController } from '../honoAdapter';
import { AuthConfig, setAuthLevel } from '../../middleware/auth/routeAuth';

/**
 * Setup folder management routes
 */
export function setupFolderRoutes(app: Hono<AppEnv>): void {
	// Create a sub-router for folder routes
	const folderRouter = new Hono<AppEnv>();

	// ========================================
	// AUTHENTICATED USER ROUTES
	// ========================================

	// Get all user folders
	folderRouter.get('/', setAuthLevel(AuthConfig.authenticated), adaptController(FolderController, FolderController.getUserFolders));

	// Create a new folder
	folderRouter.post('/', setAuthLevel(AuthConfig.authenticated), adaptController(FolderController, FolderController.createFolder));

	// Get a single folder
	folderRouter.get('/:id', setAuthLevel(AuthConfig.authenticated), adaptController(FolderController, FolderController.getFolder));

	// Update a folder
	folderRouter.put('/:id', setAuthLevel(AuthConfig.authenticated), adaptController(FolderController, FolderController.updateFolder));

	// Delete a folder
	folderRouter.delete('/:id', setAuthLevel(AuthConfig.authenticated), adaptController(FolderController, FolderController.deleteFolder));

	// Get apps in a folder
	folderRouter.get('/:id/apps', setAuthLevel(AuthConfig.authenticated), adaptController(FolderController, FolderController.getAppsInFolder));

	// Move an app to a folder
	folderRouter.post('/move', setAuthLevel(AuthConfig.authenticated), adaptController(FolderController, FolderController.moveAppToFolder));

	// Mount the folder router under /api/folders
	app.route('/api/folders', folderRouter);
}
