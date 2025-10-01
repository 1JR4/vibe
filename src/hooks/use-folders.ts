import { useState, useEffect, useCallback } from 'react';
import { apiClient, ApiError } from '@/lib/api-client';
import { useAuthGuard } from './useAuthGuard';

export interface FolderWithAppCount {
	id: string;
	userId: string;
	name: string;
	description: string | null;
	color: string | null;
	icon: string | null;
	order: number;
	createdAt: Date | null;
	updatedAt: Date | null;
	appCount: number;
}

interface FolderHookState {
	folders: FolderWithAppCount[];
	loading: boolean;
	error: string | null;
	refetch: () => void;
}

/**
 * Hook to fetch all folders for the authenticated user
 */
export function useFolders(): FolderHookState {
	const [folders, setFolders] = useState<FolderWithAppCount[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const fetchFolders = useCallback(async () => {
		try {
			setLoading(true);
			setError(null);
			const response = await apiClient.getFolders();
			if (response.success && response.data) {
				setFolders(response.data.folders);
			} else {
				throw new Error(response.error?.message || 'Failed to fetch folders');
			}
		} catch (err) {
			if (err instanceof ApiError) {
				setError(`Failed to fetch folders: ${err.message}`);
			} else {
				setError('Failed to fetch folders');
			}
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchFolders();
	}, [fetchFolders]);

	return {
		folders,
		loading,
		error,
		refetch: fetchFolders,
	};
}

/**
 * Create a new folder
 */
export async function createFolder(folderData: {
	name: string;
	description?: string;
	color?: string;
	icon?: string;
}): Promise<FolderWithAppCount> {
	try {
		const response = await apiClient.createFolder(folderData);
		if (response.success && response.data) {
			return response.data.folder;
		}
		throw new Error(response.error?.message || 'Failed to create folder');
	} catch (err) {
		if (err instanceof ApiError) {
			throw new Error(`Failed to create folder: ${err.message}`);
		}
		throw err;
	}
}

/**
 * Update a folder
 */
export async function updateFolder(
	folderId: string,
	updates: {
		name?: string;
		description?: string;
		color?: string;
		icon?: string;
		order?: number;
	}
): Promise<FolderWithAppCount> {
	try {
		const response = await apiClient.updateFolder(folderId, updates);
		if (response.success && response.data) {
			return response.data.folder;
		}
		throw new Error(response.error?.message || 'Failed to update folder');
	} catch (err) {
		if (err instanceof ApiError) {
			throw new Error(`Failed to update folder: ${err.message}`);
		}
		throw err;
	}
}

/**
 * Delete a folder
 */
export async function deleteFolder(folderId: string): Promise<boolean> {
	try {
		const response = await apiClient.deleteFolder(folderId);
		if (response.success && response.data) {
			return response.data.success;
		}
		throw new Error(response.error?.message || 'Failed to delete folder');
	} catch (err) {
		if (err instanceof ApiError) {
			throw new Error(`Failed to delete folder: ${err.message}`);
		}
		throw err;
	}
}

/**
 * Move an app to a folder (or remove from folder if folderId is null)
 */
export async function moveAppToFolder(appId: string, folderId: string | null): Promise<boolean> {
	try {
		const response = await apiClient.moveAppToFolder(appId, folderId);
		if (response.success && response.data) {
			return response.data.success;
		}
		throw new Error(response.error?.message || 'Failed to move app to folder');
	} catch (err) {
		if (err instanceof ApiError) {
			throw new Error(`Failed to move app to folder: ${err.message}`);
		}
		throw err;
	}
}

/**
 * Hook for protected folder operations
 */
export function useFolderActions() {
	const { requireAuth } = useAuthGuard();

	const protectedCreateFolder = useCallback(
		async (folderData: Parameters<typeof createFolder>[0]) => {
			if (!requireAuth({ requireFullAuth: true, actionContext: 'to create a folder' })) {
				return null;
			}
			return await createFolder(folderData);
		},
		[requireAuth]
	);

	const protectedUpdateFolder = useCallback(
		async (folderId: string, updates: Parameters<typeof updateFolder>[1]) => {
			if (!requireAuth({ requireFullAuth: true, actionContext: 'to update a folder' })) {
				return null;
			}
			return await updateFolder(folderId, updates);
		},
		[requireAuth]
	);

	const protectedDeleteFolder = useCallback(
		async (folderId: string) => {
			if (!requireAuth({ requireFullAuth: true, actionContext: 'to delete a folder' })) {
				return null;
			}
			return await deleteFolder(folderId);
		},
		[requireAuth]
	);

	const protectedMoveAppToFolder = useCallback(
		async (appId: string, folderId: string | null) => {
			if (!requireAuth({ requireFullAuth: true, actionContext: 'to move an app to a folder' })) {
				return null;
			}
			return await moveAppToFolder(appId, folderId);
		},
		[requireAuth]
	);

	return {
		createFolder: protectedCreateFolder,
		updateFolder: protectedUpdateFolder,
		deleteFolder: protectedDeleteFolder,
		moveAppToFolder: protectedMoveAppToFolder,
	};
}
