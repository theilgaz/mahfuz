CREATE TABLE `user_achievements` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`achievement_id` text NOT NULL,
	`unlocked_at` integer NOT NULL,
	`context` text DEFAULT '{}',
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `user_achievements_user_idx` ON `user_achievements` (`user_id`);--> statement-breakpoint
CREATE INDEX `user_achievements_user_ach_idx` ON `user_achievements` (`user_id`,`achievement_id`);
