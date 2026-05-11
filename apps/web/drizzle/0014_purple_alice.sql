ALTER TABLE `reciters` ADD `featured` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `reciters` ADD `voice_tags` text DEFAULT '[]' NOT NULL;