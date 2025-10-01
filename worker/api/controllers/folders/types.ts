import type { Folder } from '../../../database/schema';

export interface FolderWithAppCount extends Folder {
	appCount: number;
}

export interface FoldersListData {
	folders: FolderWithAppCount[];
}

export interface SingleFolderData {
	folder: FolderWithAppCount;
}

export interface CreateFolderRequest {
	name: string;
	description?: string;
	color?: string;
	icon?: string;
}

export interface UpdateFolderRequest {
	name?: string;
	description?: string;
	color?: string;
	icon?: string;
	order?: number;
}

export interface MoveToFolderRequest {
	appId: string;
	folderId: string | null; // null means remove from all folders
}

export interface FolderDeleteData {
	success: boolean;
	message: string;
}
