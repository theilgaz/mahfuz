ALTER TABLE `meclis_players` ADD `scope_vote` text;--> statement-breakpoint
ALTER TABLE `meclis_sessions` ADD `surah_scope` text DEFAULT 'all' NOT NULL;