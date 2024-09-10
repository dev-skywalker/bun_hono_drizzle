CREATE TABLE `saleItems` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`quantity` integer NOT NULL,
	`product_price` integer NOT NULL,
	`sub_total` integer NOT NULL,
	`product_id` integer,
	`sale_id` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`sale_id`) REFERENCES `sales`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `sales` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`date` integer NOT NULL,
	`note` text(256),
	`status` integer NOT NULL,
	`amount` integer NOT NULL,
	`shipping` integer NOT NULL,
	`warehouse_id` integer,
	`customer_id` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`customer_id`) REFERENCES `suppliers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `transferItems` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`quantity` integer NOT NULL,
	`product_price` integer NOT NULL,
	`sub_total` integer NOT NULL,
	`product_id` integer,
	`transfer_id` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`transfer_id`) REFERENCES `transfers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `transfers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`date` integer NOT NULL,
	`note` text(256),
	`status` integer NOT NULL,
	`amount` integer NOT NULL,
	`shipping` integer NOT NULL,
	`from_warehouse_id` integer,
	`to_warehouse_id` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`from_warehouse_id`) REFERENCES `warehouses`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`to_warehouse_id`) REFERENCES `warehouses`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
ALTER TABLE `purchaseItems` ADD `product_cost` integer NOT NULL;