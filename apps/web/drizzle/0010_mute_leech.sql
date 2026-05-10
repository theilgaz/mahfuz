CREATE TABLE `meclis_players` (
	`meclis_id` text NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`ready` integer DEFAULT false NOT NULL,
	`votes` text DEFAULT '[]' NOT NULL,
	`total_score` integer DEFAULT 0 NOT NULL,
	`current_score` integer DEFAULT 0 NOT NULL,
	`finished_at` integer,
	`joined_at` integer NOT NULL,
	PRIMARY KEY(`meclis_id`, `user_id`),
	FOREIGN KEY (`meclis_id`) REFERENCES `meclis_sessions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `meclis_players_user_idx` ON `meclis_players` (`user_id`);--> statement-breakpoint
CREATE TABLE `meclis_results` (
	`id` text PRIMARY KEY NOT NULL,
	`meclis_id` text NOT NULL,
	`game_index` integer NOT NULL,
	`game_id` text NOT NULL,
	`user_id` text NOT NULL,
	`score` integer NOT NULL,
	`correct_count` integer DEFAULT 0 NOT NULL,
	`wrong_count` integer DEFAULT 0 NOT NULL,
	`duration_ms` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`meclis_id`) REFERENCES `meclis_sessions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `meclis_results_meclis_idx` ON `meclis_results` (`meclis_id`);--> statement-breakpoint
CREATE INDEX `meclis_results_user_idx` ON `meclis_results` (`user_id`);--> statement-breakpoint
CREATE TABLE `meclis_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`host_user_id` text NOT NULL,
	`status` text DEFAULT 'lobby' NOT NULL,
	`difficulty` text DEFAULT 'easy' NOT NULL,
	`game_pool` text DEFAULT '[]' NOT NULL,
	`current_game_index` integer DEFAULT 0 NOT NULL,
	`round_started_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`host_user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `meclis_sessions_code_unique` ON `meclis_sessions` (`code`);--> statement-breakpoint
CREATE INDEX `meclis_sessions_code_idx` ON `meclis_sessions` (`code`);--> statement-breakpoint
CREATE INDEX `meclis_sessions_host_idx` ON `meclis_sessions` (`host_user_id`);