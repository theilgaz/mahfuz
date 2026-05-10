-- Data migration: rename gameId from "emoji-match" to "word-match"
-- after the game lost its emoji content and became pure Turkish↔Arabic
-- word matching.
UPDATE game_scores SET game_id = 'word-match' WHERE game_id = 'emoji-match';
--> statement-breakpoint
UPDATE meclis_results SET game_id = 'word-match' WHERE game_id = 'emoji-match';
--> statement-breakpoint
UPDATE daily_challenge_results SET game_id = 'word-match' WHERE game_id = 'emoji-match';
--> statement-breakpoint
UPDATE season_champions SET scope = 'word-match' WHERE scope = 'emoji-match';
