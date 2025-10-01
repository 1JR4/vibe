CREATE TABLE `app_folders` (
	`id` text PRIMARY KEY NOT NULL,
	`app_id` text NOT NULL,
	`folder_id` text NOT NULL,
	`added_at` integer DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`app_id`) REFERENCES `apps`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`folder_id`) REFERENCES `folders`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `app_folders_app_folder_idx` ON `app_folders` (`app_id`,`folder_id`);--> statement-breakpoint
CREATE INDEX `app_folders_app_idx` ON `app_folders` (`app_id`);--> statement-breakpoint
CREATE INDEX `app_folders_folder_idx` ON `app_folders` (`folder_id`);--> statement-breakpoint
CREATE TABLE `folders` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`color` text,
	`icon` text,
	`order` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP,
	`updated_at` integer DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `folders_user_idx` ON `folders` (`user_id`);--> statement-breakpoint
CREATE INDEX `folders_user_order_idx` ON `folders` (`user_id`,`order`);