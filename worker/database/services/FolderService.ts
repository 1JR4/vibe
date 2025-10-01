import { eq, and, desc, count, sql } from 'drizzle-orm';
import { BaseService } from './BaseService';
import { folders, appFolders, apps, type Folder, type NewFolder, type NewAppFolder } from '../schema';
import type { FolderWithAppCount } from '../../api/controllers/folders/types';
import { generateId } from '../../utils/idGenerator';

export class FolderService extends BaseService {
	/**
	 * Get all folders for a user with app counts
	 */
	async getUserFolders(userId: string): Promise<FolderWithAppCount[]> {
		try {
			const result = await this.database
				.select({
					id: folders.id,
					userId: folders.userId,
					name: folders.name,
					description: folders.description,
					color: folders.color,
					icon: folders.icon,
					order: folders.order,
					createdAt: folders.createdAt,
					updatedAt: folders.updatedAt,
					appCount: count(appFolders.appId),
				})
				.from(folders)
				.leftJoin(appFolders, eq(folders.id, appFolders.folderId))
				.where(eq(folders.userId, userId))
				.groupBy(folders.id)
				.orderBy(desc(folders.order), folders.name);

			return result;
		} catch (error) {
			return this.handleDatabaseError(error, 'getUserFolders', { userId });
		}
	}

	/**
	 * Get a single folder by ID
	 */
	async getFolderById(folderId: string, userId: string): Promise<FolderWithAppCount | null> {
		try {
			const result = await this.database
				.select({
					id: folders.id,
					userId: folders.userId,
					name: folders.name,
					description: folders.description,
					color: folders.color,
					icon: folders.icon,
					order: folders.order,
					createdAt: folders.createdAt,
					updatedAt: folders.updatedAt,
					appCount: count(appFolders.appId),
				})
				.from(folders)
				.leftJoin(appFolders, eq(folders.id, appFolders.folderId))
				.where(and(eq(folders.id, folderId), eq(folders.userId, userId)))
				.groupBy(folders.id)
				.limit(1);

			return result[0] || null;
		} catch (error) {
			return this.handleDatabaseError(error, 'getFolderById', { folderId, userId });
		}
	}

	/**
	 * Create a new folder
	 */
	async createFolder(
		userId: string,
		folderData: { name: string; description?: string; color?: string; icon?: string }
	): Promise<Folder> {
		try {
			const folderId = generateId();

			// Get the highest order value for this user
			const maxOrderResult = await this.database
				.select({ maxOrder: sql<number>`COALESCE(MAX(${folders.order}), -1)` })
				.from(folders)
				.where(eq(folders.userId, userId));

			const nextOrder = (maxOrderResult[0]?.maxOrder ?? -1) + 1;

			const newFolder: NewFolder = {
				id: folderId,
				userId,
				name: folderData.name,
				description: folderData.description,
				color: folderData.color,
				icon: folderData.icon,
				order: nextOrder,
			};

			await this.database.insert(folders).values(newFolder);

			const createdFolder = await this.database
				.select()
				.from(folders)
				.where(eq(folders.id, folderId))
				.limit(1);

			return createdFolder[0];
		} catch (error) {
			return this.handleDatabaseError(error, 'createFolder', { userId, folderData });
		}
	}

	/**
	 * Update a folder
	 */
	async updateFolder(
		folderId: string,
		userId: string,
		updates: { name?: string; description?: string; color?: string; icon?: string; order?: number }
	): Promise<Folder | null> {
		try {
			// Verify ownership
			const existing = await this.getFolderById(folderId, userId);
			if (!existing) {
				return null;
			}

			await this.database
				.update(folders)
				.set({
					...updates,
					updatedAt: new Date(),
				})
				.where(and(eq(folders.id, folderId), eq(folders.userId, userId)));

			const updatedFolder = await this.database
				.select()
				.from(folders)
				.where(eq(folders.id, folderId))
				.limit(1);

			return updatedFolder[0];
		} catch (error) {
			return this.handleDatabaseError(error, 'updateFolder', { folderId, userId, updates });
		}
	}

	/**
	 * Delete a folder
	 */
	async deleteFolder(folderId: string, userId: string): Promise<boolean> {
		try {
			// Verify ownership
			const existing = await this.getFolderById(folderId, userId);
			if (!existing) {
				return false;
			}

			// Remove all apps from this folder first
			await this.database.delete(appFolders).where(eq(appFolders.folderId, folderId));

			// Delete the folder
			await this.database.delete(folders).where(and(eq(folders.id, folderId), eq(folders.userId, userId)));

			return true;
		} catch (error) {
			return this.handleDatabaseError(error, 'deleteFolder', { folderId, userId });
		}
	}

	/**
	 * Move an app to a folder
	 */
	async moveAppToFolder(appId: string, folderId: string | null, userId: string): Promise<boolean> {
		try {
			// Verify app ownership
			const app = await this.database.select().from(apps).where(eq(apps.id, appId)).limit(1);

			if (!app[0] || app[0].userId !== userId) {
				return false;
			}

			// If folderId is null, remove from all folders
			if (folderId === null) {
				await this.database.delete(appFolders).where(eq(appFolders.appId, appId));
				return true;
			}

			// Verify folder ownership
			const folder = await this.getFolderById(folderId, userId);
			if (!folder) {
				return false;
			}

			// Remove from any existing folders first
			await this.database.delete(appFolders).where(eq(appFolders.appId, appId));

			// Add to new folder
			const newAppFolder: NewAppFolder = {
				id: generateId(),
				appId,
				folderId,
			};

			await this.database.insert(appFolders).values(newAppFolder);

			return true;
		} catch (error) {
			return this.handleDatabaseError(error, 'moveAppToFolder', { appId, folderId, userId });
		}
	}

	/**
	 * Get apps in a specific folder
	 */
	async getAppsInFolder(folderId: string, userId: string) {
		try {
			// Verify folder ownership
			const folder = await this.getFolderById(folderId, userId);
			if (!folder) {
				return [];
			}

			const result = await this.database
				.select({
					id: apps.id,
					title: apps.title,
					description: apps.description,
					framework: apps.framework,
					status: apps.status,
					visibility: apps.visibility,
					createdAt: apps.createdAt,
					updatedAt: apps.updatedAt,
				})
				.from(apps)
				.innerJoin(appFolders, eq(apps.id, appFolders.appId))
				.where(and(eq(appFolders.folderId, folderId), eq(apps.userId, userId)))
				.orderBy(desc(apps.updatedAt));

			return result;
		} catch (error) {
			return this.handleDatabaseError(error, 'getAppsInFolder', { folderId, userId });
		}
	}

	/**
	 * Get folder ID for a specific app
	 */
	async getAppFolder(appId: string): Promise<string | null> {
		try {
			const result = await this.database
				.select({ folderId: appFolders.folderId })
				.from(appFolders)
				.where(eq(appFolders.appId, appId))
				.limit(1);

			return result[0]?.folderId || null;
		} catch (error) {
			return this.handleDatabaseError(error, 'getAppFolder', { appId });
		}
	}
}
