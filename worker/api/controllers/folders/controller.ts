import { FolderService } from '../../../database/services/FolderService';
import { BaseController } from '../baseController';
import { ApiResponse, ControllerResponse } from '../types';
import type { RouteContext } from '../../types/route-context';
import {
	FoldersListData,
	SingleFolderData,
	CreateFolderRequest,
	UpdateFolderRequest,
	MoveToFolderRequest,
	FolderDeleteData,
} from './types';
import { createLogger } from '../../../logger';

export class FolderController extends BaseController {
	static logger = createLogger('FolderController');

	/**
	 * Get all folders for the current user
	 */
	static async getUserFolders(
		_request: Request,
		env: Env,
		_ctx: ExecutionContext,
		context: RouteContext
	): Promise<ControllerResponse<ApiResponse<FoldersListData>>> {
		try {
			const user = context.user!;

			const folderService = new FolderService(env);
			const folders = await folderService.getUserFolders(user.id);

			const responseData: FoldersListData = {
				folders,
			};

			return FolderController.createSuccessResponse(responseData);
		} catch (error) {
			this.logger.error('Error fetching user folders:', error);
			return FolderController.createErrorResponse<FoldersListData>('Failed to fetch folders', 500);
		}
	}

	/**
	 * Get a single folder by ID
	 */
	static async getFolder(
		_request: Request,
		env: Env,
		_ctx: ExecutionContext,
		context: RouteContext
	): Promise<ControllerResponse<ApiResponse<SingleFolderData>>> {
		try {
			const user = context.user!;
			const folderId = context.pathParams.id;

			if (!folderId) {
				return FolderController.createErrorResponse<SingleFolderData>('Folder ID is required', 400);
			}

			const folderService = new FolderService(env);
			const folder = await folderService.getFolderById(folderId, user.id);

			if (!folder) {
				return FolderController.createErrorResponse<SingleFolderData>('Folder not found', 404);
			}

			const responseData: SingleFolderData = {
				folder,
			};

			return FolderController.createSuccessResponse(responseData);
		} catch (error) {
			this.logger.error('Error fetching folder:', error);
			return FolderController.createErrorResponse<SingleFolderData>('Failed to fetch folder', 500);
		}
	}

	/**
	 * Create a new folder
	 */
	static async createFolder(
		request: Request,
		env: Env,
		_ctx: ExecutionContext,
		context: RouteContext
	): Promise<ControllerResponse<ApiResponse<SingleFolderData>>> {
		try {
			const user = context.user!;
			const body: CreateFolderRequest = await request.json();

			if (!body.name || body.name.trim().length === 0) {
				return FolderController.createErrorResponse<SingleFolderData>('Folder name is required', 400);
			}

			if (body.name.length > 50) {
				return FolderController.createErrorResponse<SingleFolderData>('Folder name must be 50 characters or less', 400);
			}

			const folderService = new FolderService(env);
			const folder = await folderService.createFolder(user.id, {
				name: body.name.trim(),
				description: body.description?.trim(),
				color: body.color,
				icon: body.icon,
			});

			const folderWithCount = await folderService.getFolderById(folder.id, user.id);

			const responseData: SingleFolderData = {
				folder: folderWithCount!,
			};

			return FolderController.createSuccessResponse(responseData);
		} catch (error) {
			this.logger.error('Error creating folder:', error);
			return FolderController.createErrorResponse<SingleFolderData>('Failed to create folder', 500);
		}
	}

	/**
	 * Update a folder
	 */
	static async updateFolder(
		request: Request,
		env: Env,
		_ctx: ExecutionContext,
		context: RouteContext
	): Promise<ControllerResponse<ApiResponse<SingleFolderData>>> {
		try {
			const user = context.user!;
			const folderId = context.pathParams.id;

			if (!folderId) {
				return FolderController.createErrorResponse<SingleFolderData>('Folder ID is required', 400);
			}

			const body: UpdateFolderRequest = await request.json();

			if (body.name !== undefined) {
				if (body.name.trim().length === 0) {
					return FolderController.createErrorResponse<SingleFolderData>('Folder name cannot be empty', 400);
				}
				if (body.name.length > 50) {
					return FolderController.createErrorResponse<SingleFolderData>('Folder name must be 50 characters or less', 400);
				}
			}

			const folderService = new FolderService(env);
			const updatedFolder = await folderService.updateFolder(folderId, user.id, {
				name: body.name?.trim(),
				description: body.description?.trim(),
				color: body.color,
				icon: body.icon,
				order: body.order,
			});

			if (!updatedFolder) {
				return FolderController.createErrorResponse<SingleFolderData>('Folder not found', 404);
			}

			const folderWithCount = await folderService.getFolderById(updatedFolder.id, user.id);

			const responseData: SingleFolderData = {
				folder: folderWithCount!,
			};

			return FolderController.createSuccessResponse(responseData);
		} catch (error) {
			this.logger.error('Error updating folder:', error);
			return FolderController.createErrorResponse<SingleFolderData>('Failed to update folder', 500);
		}
	}

	/**
	 * Delete a folder
	 */
	static async deleteFolder(
		_request: Request,
		env: Env,
		_ctx: ExecutionContext,
		context: RouteContext
	): Promise<ControllerResponse<ApiResponse<FolderDeleteData>>> {
		try {
			const user = context.user!;
			const folderId = context.pathParams.id;

			if (!folderId) {
				return FolderController.createErrorResponse<FolderDeleteData>('Folder ID is required', 400);
			}

			const folderService = new FolderService(env);
			const success = await folderService.deleteFolder(folderId, user.id);

			if (!success) {
				return FolderController.createErrorResponse<FolderDeleteData>('Folder not found', 404);
			}

			const responseData: FolderDeleteData = {
				success: true,
				message: 'Folder deleted successfully',
			};

			return FolderController.createSuccessResponse(responseData);
		} catch (error) {
			this.logger.error('Error deleting folder:', error);
			return FolderController.createErrorResponse<FolderDeleteData>('Failed to delete folder', 500);
		}
	}

	/**
	 * Move an app to a folder
	 */
	static async moveAppToFolder(
		request: Request,
		env: Env,
		_ctx: ExecutionContext,
		context: RouteContext
	): Promise<ControllerResponse<ApiResponse<{ success: boolean; message: string }>>> {
		try {
			const user = context.user!;
			const body: MoveToFolderRequest = await request.json();

			if (!body.appId) {
				return FolderController.createErrorResponse('App ID is required', 400);
			}

			const folderService = new FolderService(env);
			const success = await folderService.moveAppToFolder(body.appId, body.folderId, user.id);

			if (!success) {
				return FolderController.createErrorResponse('App or folder not found', 404);
			}

			return FolderController.createSuccessResponse({
				success: true,
				message: body.folderId ? 'App moved to folder' : 'App removed from folder',
			});
		} catch (error) {
			this.logger.error('Error moving app to folder:', error);
			return FolderController.createErrorResponse('Failed to move app to folder', 500);
		}
	}

	/**
	 * Get apps in a folder
	 */
	static async getAppsInFolder(
		_request: Request,
		env: Env,
		_ctx: ExecutionContext,
		context: RouteContext
	): Promise<ControllerResponse<ApiResponse<{ apps: unknown[] }>>> {
		try {
			const user = context.user!;
			const folderId = context.pathParams.id;

			if (!folderId) {
				return FolderController.createErrorResponse('Folder ID is required', 400);
			}

			const folderService = new FolderService(env);
			const apps = await folderService.getAppsInFolder(folderId, user.id);

			return FolderController.createSuccessResponse({
				apps,
			});
		} catch (error) {
			this.logger.error('Error fetching apps in folder:', error);
			return FolderController.createErrorResponse('Failed to fetch apps in folder', 500);
		}
	}
}
