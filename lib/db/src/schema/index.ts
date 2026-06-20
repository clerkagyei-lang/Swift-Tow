import { pgTable, text, boolean, real, integer, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const usersTable = pgTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  phone: text("phone").notNull(),
  role: text("role", { enum: ["user", "driver", "admin"] }).notNull().default("user"),
  avatarUrl: text("avatar_url"),
  createdAt: text("created_at").notNull(),
});

export const driversTable = pgTable("drivers", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  phone: text("phone").notNull(),
  isOnline: boolean("is_online").notNull().default(false),
  currentLocation: jsonb("current_location"),
  avatarUrl: text("avatar_url"),
  rating: real("rating").notNull().default(0),
  totalTrips: integer("total_trips").notNull().default(0),
  activeJobId: text("active_job_id"),
  vehicleType: text("vehicle_type").notNull(),
  vehiclePlate: text("vehicle_plate").notNull(),
  licenseNumber: text("license_number").notNull(),
  approvalStatus: text("approval_status", { enum: ["pending", "approved", "suspended"] }).notNull().default("pending"),
  approvalNote: text("approval_note"),
  earningsToday: real("earnings_today").notNull().default(0),
  earningsTotal: real("earnings_total").notNull().default(0),
  createdAt: text("created_at").notNull(),
});

export const towRequestsTable = pgTable("tow_requests", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  userName: text("user_name").notNull(),
  userPhone: text("user_phone").notNull(),
  towType: text("tow_type", { enum: ["flatbed", "hook_chain", "repair"] }).notNull(),
  status: text("status", { enum: ["pending", "accepted", "in_progress", "completed", "cancelled"] }).notNull().default("pending"),
  pickupLocation: jsonb("pickup_location").notNull(),
  pickupAddress: text("pickup_address").notNull(),
  dropoffLocation: jsonb("dropoff_location"),
  dropoffAddress: text("dropoff_address"),
  vehicleDetails: text("vehicle_details").notNull(),
  driverId: text("driver_id"),
  estimatedArrival: integer("estimated_arrival"),
  amount: real("amount"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const tripsTable = pgTable("trips", {
  id: text("id").primaryKey(),
  towRequestId: text("tow_request_id").notNull(),
  userId: text("user_id").notNull(),
  driverId: text("driver_id").notNull(),
  driverName: text("driver_name").notNull(),
  pickupAddress: text("pickup_address").notNull(),
  dropoffAddress: text("dropoff_address"),
  vehicleDetails: text("vehicle_details").notNull(),
  towType: text("tow_type", { enum: ["flatbed", "hook_chain", "repair"] }).notNull(),
  amount: real("amount").notNull(),
  paymentMethod: text("payment_method", { enum: ["mtn_momo", "telecel_cash", "at_money", "cash"] }),
  paymentStatus: text("payment_status", { enum: ["pending", "paid"] }).notNull().default("pending"),
  completedAt: text("completed_at").notNull(),
});

export const insertUserSchema = createInsertSchema(usersTable);
export const insertDriverSchema = createInsertSchema(driversTable);
export const insertTowRequestSchema = createInsertSchema(towRequestsTable);
export const insertTripSchema = createInsertSchema(tripsTable);

export type User = typeof usersTable.$inferSelect;
export type Driver = typeof driversTable.$inferSelect;
export type TowRequest = typeof towRequestsTable.$inferSelect;
export type Trip = typeof tripsTable.$inferSelect;
