CREATE TYPE "version_type" AS ENUM('stable', 'beta', 'alpha', 'dev');--> statement-breakpoint
CREATE TABLE "analytics" (
	"id" bigint PRIMARY KEY,
	"data" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tokens" (
	"id" bigint PRIMARY KEY,
	"key" varchar(64) NOT NULL UNIQUE,
	"token" text NOT NULL,
	"tokenExpiresIn" integer NOT NULL,
	"expiresAt" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" bigint PRIMARY KEY,
	"modrinthId" varchar(8) NOT NULL UNIQUE,
	"settings" jsonb DEFAULT '{"version":1,"analytics":{"crashLogs":true,"usage":false},"badges":true}' NOT NULL,
	"lastLoginAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "versions" (
	"id" bigint PRIMARY KEY,
	"name" varchar(24) NOT NULL UNIQUE,
	"code" integer NOT NULL UNIQUE,
	"type" "version_type" DEFAULT 'stable'::"version_type" NOT NULL,
	"changelog" text NOT NULL
);
