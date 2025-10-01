import { useState, useEffect } from 'react';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Folder, Loader2 } from 'lucide-react';
import type { FolderWithAppCount } from '@/hooks/use-folders';

interface FolderDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSave: (data: FolderFormData) => Promise<void>;
	folder?: FolderWithAppCount | null;
	mode: 'create' | 'edit';
}

export interface FolderFormData {
	name: string;
	description?: string;
	color?: string;
	icon?: string;
}

export function FolderDialog({
	open,
	onOpenChange,
	onSave,
	folder,
	mode,
}: FolderDialogProps) {
	const [formData, setFormData] = useState<FolderFormData>({
		name: '',
		description: '',
		color: '',
		icon: '',
	});
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (open) {
			if (mode === 'edit' && folder) {
				setFormData({
					name: folder.name,
					description: folder.description || '',
					color: folder.color || '',
					icon: folder.icon || '',
				});
			} else {
				setFormData({
					name: '',
					description: '',
					color: '',
					icon: '',
				});
			}
			setError(null);
		}
	}, [open, mode, folder]);

	const handleSave = async (e: React.FormEvent) => {
		e.preventDefault();
		e.stopPropagation();

		if (!formData.name.trim()) {
			setError('Folder name is required');
			return;
		}

		if (formData.name.length > 50) {
			setError('Folder name must be 50 characters or less');
			return;
		}

		try {
			setIsLoading(true);
			setError(null);
			await onSave({
				name: formData.name.trim(),
				description: formData.description?.trim() || undefined,
				color: formData.color || undefined,
				icon: formData.icon || undefined,
			});
			onOpenChange(false);
		} catch (err) {
			setError(
				err instanceof Error ? err.message : 'Failed to save folder',
			);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[425px]">
				<form onSubmit={handleSave}>
					<DialogHeader>
						<div className="flex items-center gap-3">
							<div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
								<Folder className="h-5 w-5 text-primary" />
							</div>
							<div className="flex-1">
								<DialogTitle className="text-left">
									{mode === 'create'
										? 'Create Folder'
										: 'Edit Folder'}
								</DialogTitle>
							</div>
						</div>
						<DialogDescription className="text-left pt-2">
							{mode === 'create'
								? 'Create a new folder to organize your apps.'
								: 'Edit folder details.'}
						</DialogDescription>
					</DialogHeader>

					<div className="grid gap-4 py-4">
						<div className="grid gap-2">
							<Label htmlFor="name">
								Name <span className="text-destructive">*</span>
							</Label>
							<Input
								id="name"
								placeholder="e.g., Work Projects"
								value={formData.name}
								onChange={(e) =>
									setFormData((prev) => ({
										...prev,
										name: e.target.value,
									}))
								}
								maxLength={50}
								disabled={isLoading}
								autoFocus
							/>
						</div>

						<div className="grid gap-2">
							<Label htmlFor="description">Description</Label>
							<Textarea
								id="description"
								placeholder="Optional description for this folder"
								value={formData.description}
								onChange={(e) =>
									setFormData((prev) => ({
										...prev,
										description: e.target.value,
									}))
								}
								disabled={isLoading}
								rows={3}
							/>
						</div>

						<div className="grid gap-2">
							<Label htmlFor="color">Color (hex code)</Label>
							<Input
								id="color"
								placeholder="#3b82f6"
								value={formData.color}
								onChange={(e) =>
									setFormData((prev) => ({
										...prev,
										color: e.target.value,
									}))
								}
								disabled={isLoading}
							/>
						</div>

						{error && (
							<div className="text-sm text-destructive">{error}</div>
						)}
					</div>

					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={() => onOpenChange(false)}
							disabled={isLoading}
						>
							Cancel
						</Button>
						<Button type="submit" disabled={isLoading}>
							{isLoading ? (
								<>
									<Loader2 className="h-4 w-4 animate-spin mr-2" />
									{mode === 'create'
										? 'Creating...'
										: 'Saving...'}
								</>
							) : (
								<>
									<Folder className="h-4 w-4 mr-2" />
									{mode === 'create'
										? 'Create Folder'
										: 'Save Changes'}
								</>
							)}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
