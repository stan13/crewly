import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  userSettings: defineTable({
    userId: v.string(),
    locationName: v.optional(v.string()),
    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),
    temperatureUnit: v.optional(v.union(v.literal("fahrenheit"), v.literal("celsius"))),
  }).index("by_user", ["userId"]),

  contacts: defineTable({
    name: v.string(),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    userId: v.id("users"),
  }).index("by_user", ["userId"]),

  boatSessions: defineTable({
    date: v.string(), // YYYY-MM-DD format
    startTime: v.string(), // HH:MM format
    endTime: v.string(), // HH:MM format
    contactIds: v.array(v.id("contacts")),
    userId: v.id("users"),
  }).index("by_user_and_date", ["userId", "date"]),

  accountLinks: defineTable({
    fromUserId: v.id("users"),
    toUserId: v.id("users"),
    status: v.union(v.literal("pending"), v.literal("accepted")),
  })
    .index("by_from_user", ["fromUserId"])
    .index("by_to_user", ["toUserId"])
    .index("by_users", ["fromUserId", "toUserId"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
