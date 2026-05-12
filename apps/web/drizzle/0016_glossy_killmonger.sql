ALTER TABLE `meclis_sessions` ADD `target_game_count` integer DEFAULT 3 NOT NULL;--> statement-breakpoint
ALTER TABLE `meclis_sessions` ADD `round_duration_ms` integer DEFAULT 60000 NOT NULL;--> statement-breakpoint
ALTER TABLE `meclis_sessions` ADD `visibility` text DEFAULT 'private' NOT NULL;--> statement-breakpoint
ALTER TABLE `meclis_sessions` ADD `password_hash` text;--> statement-breakpoint
ALTER TABLE `meclis_sessions` ADD `password_salt` text;