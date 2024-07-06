ALTER TABLE `products` ADD `name` text NOT NULL;--> statement-breakpoint
ALTER TABLE `products` DROP COLUMN `brand_name`;--> statement-breakpoint
ALTER TABLE `products` DROP COLUMN `chemical_name`;--> statement-breakpoint
ALTER TABLE `products` DROP COLUMN `search`;