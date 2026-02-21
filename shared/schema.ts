import { pgTable, text, serial, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export type SeverityLevel = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFO";

export type Finding = {
  severity: SeverityLevel;
  category: string;
  title: string;
  detail: string;
};

export const scans = pgTable("scans", {
  id: serial("id").primaryKey(),
  url: text("url").notNull(),
  targetIp: text("target_ip"),
  server: text("server"),
  isScrapable: boolean("is_scrapable").notNull().default(true),
  ddosProtected: boolean("ddos_protected").notNull().default(false),
  headers: jsonb("headers").$type<Record<string, string>>().notNull().default({}),
  recommendations: jsonb("recommendations").$type<string[]>().notNull().default([]),
  findings: jsonb("findings").$type<Finding[]>().notNull().default([]),
  sessionId: text("session_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertScanSchema = createInsertSchema(scans).omit({
  id: true,
  createdAt: true,
});

export type Scan = typeof scans.$inferSelect;
export type InsertScan = z.infer<typeof insertScanSchema>;
