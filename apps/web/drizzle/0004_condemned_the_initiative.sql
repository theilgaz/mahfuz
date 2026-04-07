CREATE TABLE `daily_challenge_results` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`date` text NOT NULL,
	`game_id` text NOT NULL,
	`score` integer NOT NULL,
	`completed` integer DEFAULT false NOT NULL,
	`guesses` integer DEFAULT 0,
	`duration_ms` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `daily_challenge_user_date_idx` ON `daily_challenge_results` (`user_id`,`date`);--> statement-breakpoint
CREATE TABLE `family_members` (
	`subscription_id` text NOT NULL,
	`member_id` text NOT NULL,
	`role` text DEFAULT 'member' NOT NULL,
	`added_at` integer NOT NULL,
	FOREIGN KEY (`subscription_id`) REFERENCES `subscriptions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`member_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `game_scores` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`game_id` text NOT NULL,
	`score` integer NOT NULL,
	`mode` text,
	`difficulty` text,
	`duration_ms` integer,
	`metadata` text DEFAULT '{}',
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `game_scores_user_idx` ON `game_scores` (`user_id`);--> statement-breakpoint
CREATE INDEX `game_scores_game_idx` ON `game_scores` (`game_id`);--> statement-breakpoint
CREATE INDEX `game_scores_created_idx` ON `game_scores` (`created_at`);--> statement-breakpoint
CREATE TABLE `hatim_group_members` (
	`group_id` text NOT NULL,
	`user_id` text NOT NULL,
	`assigned_sections` text DEFAULT '[]' NOT NULL,
	`joined_at` integer NOT NULL,
	FOREIGN KEY (`group_id`) REFERENCES `hatim_groups`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `hatim_group_members_group_idx` ON `hatim_group_members` (`group_id`);--> statement-breakpoint
CREATE INDEX `hatim_group_members_user_idx` ON `hatim_group_members` (`user_id`);--> statement-breakpoint
CREATE TABLE `hatim_group_progress` (
	`id` text PRIMARY KEY NOT NULL,
	`group_id` text NOT NULL,
	`user_id` text NOT NULL,
	`section_id` text NOT NULL,
	`completed_at` integer NOT NULL,
	FOREIGN KEY (`group_id`) REFERENCES `hatim_groups`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `hatim_group_progress_group_idx` ON `hatim_group_progress` (`group_id`);--> statement-breakpoint
CREATE INDEX `hatim_group_progress_user_idx` ON `hatim_group_progress` (`user_id`);--> statement-breakpoint
CREATE TABLE `hatim_groups` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`creator_id` text NOT NULL,
	`scope_type` text DEFAULT 'full' NOT NULL,
	`scope_data` text DEFAULT '{}' NOT NULL,
	`target_date` integer,
	`invite_code` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`creator_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `hatim_groups_invite_code_unique` ON `hatim_groups` (`invite_code`);--> statement-breakpoint
CREATE INDEX `hatim_groups_creator_idx` ON `hatim_groups` (`creator_id`);--> statement-breakpoint
CREATE INDEX `hatim_groups_invite_idx` ON `hatim_groups` (`invite_code`);--> statement-breakpoint
CREATE TABLE `recitation_mistakes` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`verse_key` text NOT NULL,
	`word_text` text NOT NULL,
	`word_position` integer,
	`mistake_type` text DEFAULT 'wrong' NOT NULL,
	`session_id` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `recitation_mistakes_user_idx` ON `recitation_mistakes` (`user_id`);--> statement-breakpoint
CREATE INDEX `recitation_mistakes_verse_idx` ON `recitation_mistakes` (`verse_key`);--> statement-breakpoint
CREATE TABLE `subscriptions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`plan` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`current_period_start` integer,
	`current_period_end` integer,
	`provider` text DEFAULT 'lemon_squeezy' NOT NULL,
	`provider_id` text,
	`provider_customer_id` text,
	`cancel_at_period_end` integer DEFAULT false,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `subscriptions_user_idx` ON `subscriptions` (`user_id`);--> statement-breakpoint
CREATE INDEX `subscriptions_status_idx` ON `subscriptions` (`status`);--> statement-breakpoint
CREATE TABLE `verse_notes` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`verse_key` text NOT NULL,
	`content` text NOT NULL,
	`tags` text DEFAULT '[]' NOT NULL,
	`is_private` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `verse_notes_user_idx` ON `verse_notes` (`user_id`);--> statement-breakpoint
CREATE INDEX `verse_notes_verse_idx` ON `verse_notes` (`verse_key`);