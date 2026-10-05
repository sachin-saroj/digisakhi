CREATE TABLE `incident_reports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`description` text NOT NULL,
	`category` varchar(64) NOT NULL,
	`anonymous` int NOT NULL DEFAULT 1,
	`status` enum('New','In review','Resolved') NOT NULL DEFAULT 'New',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `incident_reports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `learning_progress` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`moduleId` varchar(64) NOT NULL,
	`quizScore` int NOT NULL DEFAULT 0,
	`questionCount` int NOT NULL DEFAULT 0,
	`completedAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `learning_progress_id` PRIMARY KEY(`id`),
	CONSTRAINT `learning_progress_user_module_unique` UNIQUE(`userId`,`moduleId`)
);
