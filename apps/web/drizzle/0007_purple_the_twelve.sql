CREATE TABLE `season_champions` (
	`id` text PRIMARY KEY NOT NULL,
	`season_key` text NOT NULL,
	`scope` text NOT NULL,
	`rank` integer NOT NULL,
	`user_id` text NOT NULL,
	`league` text NOT NULL,
	`score` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`season_key`) REFERENCES `seasons`(`key`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `season_champions_season_idx` ON `season_champions` (`season_key`);--> statement-breakpoint
CREATE INDEX `season_champions_user_idx` ON `season_champions` (`user_id`);--> statement-breakpoint
CREATE INDEX `season_champions_scope_idx` ON `season_champions` (`season_key`,`scope`);--> statement-breakpoint
CREATE TABLE `season_participants` (
	`id` text PRIMARY KEY NOT NULL,
	`season_key` text NOT NULL,
	`rank` integer NOT NULL,
	`user_id` text NOT NULL,
	`league` text NOT NULL,
	`score` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`season_key`) REFERENCES `seasons`(`key`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `season_participants_season_idx` ON `season_participants` (`season_key`);--> statement-breakpoint
CREATE INDEX `season_participants_user_idx` ON `season_participants` (`user_id`);--> statement-breakpoint
CREATE TABLE `seasons` (
	`key` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`started_at` integer NOT NULL,
	`ended_at` integer NOT NULL,
	`closed_at` integer
);
