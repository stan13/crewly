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
    selectedBoatId: v.optional(v.id("boats")),
    theme: v.optional(v.union(v.literal("light"), v.literal("dark"))),
  }).index("by_user", ["userId"]),

  boats: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    ownerId: v.id("users"),
    createdAt: v.number(),
  }).index("by_owner", ["ownerId"]),

  boatMembers: defineTable({
    boatId: v.id("boats"),
    userId: v.id("users"),
    role: v.union(v.literal("owner"), v.literal("member")),
    invitedBy: v.id("users"),
    joinedAt: v.number(),
  })
    .index("by_boat", ["boatId"])
    .index("by_user", ["userId"])
    .index("by_boat_and_user", ["boatId", "userId"]),

  boatInvites: defineTable({
    boatId: v.id("boats"),
    email: v.string(),
    invitedBy: v.id("users"),
    status: v.union(v.literal("pending"), v.literal("accepted"), v.literal("declined")),
    createdAt: v.number(),
  })
    .index("by_boat", ["boatId"])
    .index("by_email", ["email"])
    .index("by_boat_and_email", ["boatId", "email"]),

  contacts: defineTable({
    name: v.string(),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    boatId: v.id("boats"),
    createdBy: v.id("users"),
  })
    .index("by_boat", ["boatId"])
    .index("by_boat_and_user", ["boatId", "createdBy"]),

  boatSessions: defineTable({
    date: v.string(), // YYYY-MM-DD format
    startTime: v.string(), // HH:MM format
    endTime: v.string(), // HH:MM format
    crew: v.array(v.object({
      contactId: v.id("contacts"),
      status: v.union(v.literal("confirmed"), v.literal("declined"), v.literal("pending")),
      confirmedAt: v.optional(v.number()),
    })),
    boatId: v.id("boats"),
    createdBy: v.id("users"),
  })
    .index("by_boat", ["boatId"])
    .index("by_boat_and_date", ["boatId", "date"]),

  // Keep old accountLinks for backward compatibility or migration
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
