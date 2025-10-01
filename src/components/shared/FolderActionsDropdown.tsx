import { useState } from 'react';
import { MoreVertical, Trash2, Edit2 } from 'lucide-react';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { ConfirmDeleteDialog } from './ConfirmDeleteDialog';
import { FolderDialog, type FolderFormData } from './FolderDialog';
import { updateFolder, deleteFolder, type FolderWithAppCount } from '@/hooks/use-folders';
import { toast } from 'sonner';

interface FolderActionsDropdownProps {
	folder: FolderWithAppCount;
	onFolderUpdated?: () => void;
	onFolderDeleted?: () => void;
	className?: string;
	variant?: 'default' | 'ghost';
	size?: 'default' | 'sm' | 'icon';
	showOnHover?: boolean;
}

export function FolderActionsDropdown({
	folder,
	onFolderUpdated,
	onFolderDeleted,
	className = '',
	variant = 'ghost',
	size = 'icon',
	showOnHover = false,
}: FolderActionsDropdownProps) {
	const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);

	const handleEditFolder = async (data: FolderFormData) => {
		try {
			await updateFolder(folder.id, data);
			toast.success('Folder updated successfully');
			setIsEditDialogOpen(false);
			onFolderUpdated?.();
		} catch (error) {
			console.error('Error updating folder:', error);
			throw error;
		}
	};

	const handleDeleteFolder = async () => {
		try {
			setIsDeleting(true);
			await deleteFolder(folder.id);
			toast.success('Folder deleted successfully');
			setIsDeleteDialogOpen(false);
			onFolderDeleted?.();
		} catch (error) {
			console.error('Error deleting folder:', error);
			toast.error('Failed to delete folder');
		} finally {
			setIsDeleting(false);
		}
	};

	const buttonClasses = showOnHover
		? `opacity-0 group-hover/folder:opacity-100 transition-all duration-200 hover:bg-bg-3/80 cursor-pointer ${className}`
		: `hover:bg-bg-3/80 cursor-pointer ${className}`;

	return (
		<>
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button
						variant={variant}
						size={size}
						className={buttonClasses}
						onClick={(e) => {
							e.stopPropagation();
							e.preventDefault();
						}}
					>
						<MoreVertical className="h-4 w-4" />
						<span className="sr-only">Folder actions</span>
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end" className="w-48">
					<DropdownMenuItem
						onClick={(e) => {
							e.stopPropagation();
							e.preventDefault();
							setIsEditDialogOpen(true);
						}}
					>
						<Edit2 className="h-4 w-4 mr-2" />
						Edit folder
					</DropdownMenuItem>
					<DropdownMenuItem
						onClick={(e) => {
							e.stopPropagation();
							e.preventDefault();
							setIsDeleteDialogOpen(true);
						}}
						className="text-destructive focus:text-destructive focus:bg-destructive/10"
					>
						<Trash2 className="h-4 w-4 mr-2" />
						Delete folder
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>

			<FolderDialog
				open={isEditDialogOpen}
				onOpenChange={setIsEditDialogOpen}
				onSave={handleEditFolder}
				folder={folder}
				mode="edit"
			/>

			<ConfirmDeleteDialog
				open={isDeleteDialogOpen}
				onOpenChange={setIsDeleteDialogOpen}
				onConfirm={handleDeleteFolder}
				isLoading={isDeleting}
				title="Delete Folder"
				description={`Are you sure you want to delete "${folder.name}"? Apps in this folder will not be deleted, but will be unfiled.`}
			/>
		</>
	);
}
