CREATE TABLE `verse_similarity` (
	`ayah_id` integer NOT NULL,
	`similar_ayah_id` integer NOT NULL,
	`score` real NOT NULL,
	`method` text DEFAULT 'word-overlap' NOT NULL,
	PRIMARY KEY(`ayah_id`, `similar_ayah_id`),
	FOREIGN KEY (`ayah_id`) REFERENCES `ayahs`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`similar_ayah_id`) REFERENCES `ayahs`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `verse_similarity_ayah_idx` ON `verse_similarity` (`ayah_id`);
--> statement-breakpoint
CREATE INDEX `verse_similarity_similar_idx` ON `verse_similarity` (`similar_ayah_id`);
