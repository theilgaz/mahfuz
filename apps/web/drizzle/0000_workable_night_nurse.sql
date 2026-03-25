CREATE TABLE `account` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`provider_id` text NOT NULL,
	`user_id` text NOT NULL,
	`access_token` text,
	`refresh_token` text,
	`id_token` text,
	`access_token_expires_at` integer,
	`refresh_token_expires_at` integer,
	`scope` text,
	`password` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `session` (
	`id` text PRIMARY KEY NOT NULL,
	`expires_at` integer NOT NULL,
	`token` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`ip_address` text,
	`user_agent` text,
	`user_id` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `session_token_unique` ON `session` (`token`);--> statement-breakpoint
CREATE TABLE `user` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`email_verified` integer DEFAULT false NOT NULL,
	`image` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);--> statement-breakpoint
CREATE TABLE `verification` (
	`id` text PRIMARY KEY NOT NULL,
	`identifier` text NOT NULL,
	`value` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer,
	`updated_at` integer
);
--> statement-breakpoint
CREATE TABLE `ayahs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`surah_id` integer NOT NULL,
	`ayah_number` integer NOT NULL,
	`text_uthmani` text NOT NULL,
	`text_simple` text,
	`page_number` integer NOT NULL,
	`juz_number` integer NOT NULL,
	`hizb_number` integer NOT NULL,
	`ruku_number` integer NOT NULL,
	`sajdah` integer DEFAULT false,
	FOREIGN KEY (`surah_id`) REFERENCES `surahs`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `ayahs_surah_idx` ON `ayahs` (`surah_id`);--> statement-breakpoint
CREATE INDEX `ayahs_page_idx` ON `ayahs` (`page_number`);--> statement-breakpoint
CREATE INDEX `ayahs_juz_idx` ON `ayahs` (`juz_number`);--> statement-breakpoint
CREATE INDEX `ayahs_surah_ayah_idx` ON `ayahs` (`surah_id`,`ayah_number`);--> statement-breakpoint
CREATE TABLE `hatims` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`started_at` integer NOT NULL,
	`completed_at` integer,
	`last_page` integer DEFAULT 1 NOT NULL,
	`is_active` integer DEFAULT true
);
--> statement-breakpoint
CREATE INDEX `hatims_user_active_idx` ON `hatims` (`user_id`,`is_active`);--> statement-breakpoint
CREATE TABLE `reading_goals` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`daily_target_pages` integer DEFAULT 1 NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `reading_goals_user_id_unique` ON `reading_goals` (`user_id`);--> statement-breakpoint
CREATE TABLE `reading_sessions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`date` text NOT NULL,
	`pages_read` integer DEFAULT 0 NOT NULL,
	`ayahs_read` integer DEFAULT 0 NOT NULL,
	`duration_seconds` integer DEFAULT 0 NOT NULL,
	`start_page` integer,
	`end_page` integer
);
--> statement-breakpoint
CREATE INDEX `sessions_user_date_idx` ON `reading_sessions` (`user_id`,`date`);--> statement-breakpoint
CREATE TABLE `reciters` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`name_arabic` text,
	`name` text NOT NULL,
	`country` text,
	`style` text,
	`audio_base_url` text NOT NULL,
	`audio_format` text DEFAULT 'mp3' NOT NULL,
	`is_default` integer DEFAULT false,
	`is_active` integer DEFAULT true,
	`source` text DEFAULT 'qurancom',
	`qurancom_id` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `reciters_slug_unique` ON `reciters` (`slug`);--> statement-breakpoint
CREATE TABLE `surahs` (
	`id` integer PRIMARY KEY NOT NULL,
	`name_arabic` text NOT NULL,
	`name_simple` text NOT NULL,
	`name_translation` text NOT NULL,
	`revelation` text NOT NULL,
	`ayah_count` integer NOT NULL,
	`page_start` integer NOT NULL,
	`page_end` integer NOT NULL,
	`revelation_order` integer NOT NULL,
	`bismillah_pre` integer DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE `translation_sources` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`language` text NOT NULL,
	`author` text NOT NULL,
	`name` text NOT NULL,
	`is_default` integer DEFAULT false
);
--> statement-breakpoint
CREATE UNIQUE INDEX `translation_sources_slug_unique` ON `translation_sources` (`slug`);--> statement-breakpoint
CREATE TABLE `translations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`surah_id` integer NOT NULL,
	`ayah_number` integer NOT NULL,
	`source_id` integer NOT NULL,
	`text` text NOT NULL,
	FOREIGN KEY (`source_id`) REFERENCES `translation_sources`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `translations_verse_idx` ON `translations` (`surah_id`,`ayah_number`);--> statement-breakpoint
CREATE INDEX `translations_source_idx` ON `translations` (`source_id`);--> statement-breakpoint
CREATE INDEX `translations_source_verse_idx` ON `translations` (`source_id`,`surah_id`,`ayah_number`);--> statement-breakpoint
CREATE TABLE `words` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`ayah_id` integer NOT NULL,
	`position` integer NOT NULL,
	`text_uthmani` text NOT NULL,
	`transliteration` text,
	`meaning_tr` text,
	`meaning_en` text,
	`char_type` text DEFAULT 'word' NOT NULL,
	`tajweed_rule` text,
	`audio_timestamp` real,
	FOREIGN KEY (`ayah_id`) REFERENCES `ayahs`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `words_ayah_idx` ON `words` (`ayah_id`);--> statement-breakpoint
CREATE INDEX `words_ayah_pos_idx` ON `words` (`ayah_id`,`position`);