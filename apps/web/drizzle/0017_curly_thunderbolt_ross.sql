ALTER TABLE `meclis_players` ADD `team` text;--> statement-breakpoint
ALTER TABLE `meclis_sessions` ADD `team_mode` integer DEFAULT false NOT NULL;