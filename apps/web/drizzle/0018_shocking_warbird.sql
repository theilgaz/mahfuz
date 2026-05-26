CREATE TABLE `tafsir_sources` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`language` text NOT NULL,
	`author` text NOT NULL,
	`name` text NOT NULL,
	`is_default` integer DEFAULT false
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tafsir_sources_slug_unique` ON `tafsir_sources` (`slug`);--> statement-breakpoint
CREATE TABLE `tafsirs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`source_id` integer NOT NULL,
	`surah_id` integer NOT NULL,
	`ayah_number` integer NOT NULL,
	`text_html` text NOT NULL,
	`text_plain` text NOT NULL,
	`group_key` text,
	FOREIGN KEY (`source_id`) REFERENCES `tafsir_sources`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `tafsirs_verse_idx` ON `tafsirs` (`surah_id`,`ayah_number`);--> statement-breakpoint
CREATE INDEX `tafsirs_source_idx` ON `tafsirs` (`source_id`);--> statement-breakpoint
CREATE INDEX `tafsirs_source_verse_idx` ON `tafsirs` (`source_id`,`surah_id`,`ayah_number`);