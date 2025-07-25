import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    
    return await ctx.db
      .query("boatSessions")
      .withIndex("by_user_and_date", (q) => q.eq("userId", userId))
      .collect();
  },
});

export const createOrUpdate = mutation({
  args: {
    date: v.string(),
    startTime: v.string(),
    endTime: v.string(),
    contactIds: v.array(v.id("contacts")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    
    // Check if session already exists for this date
    const existing = await ctx.db
      .query("boatSessions")
      .withIndex("by_user_and_date", (q) => q.eq("userId", userId).eq("date", args.date))
      .unique();
    
    if (existing) {
      await ctx.db.patch(existing._id, {
        startTime: args.startTime,
        endTime: args.endTime,
        contactIds: args.contactIds,
      });
      return existing._id;
    } else {
      return await ctx.db.insert("boatSessions", {
        ...args,
        userId,
      });
    }
  },
});

export const updateTime = mutation({
  args: {
    date: v.string(),
    startTime: v.string(),
    endTime: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    
    const session = await ctx.db
      .query("boatSessions")
      .withIndex("by_user_and_date", (q) => q.eq("userId", userId).eq("date", args.date))
      .unique();
    
    if (session) {
      await ctx.db.patch(session._id, {
        startTime: args.startTime,
        endTime: args.endTime,
      });
    } else {
      await ctx.db.insert("boatSessions", {
        date: args.date,
        startTime: args.startTime,
        endTime: args.endTime,
        contactIds: [],
        userId,
      });
    }
  },
});

export const addContact = mutation({
  args: {
    date: v.string(),
    contactId: v.id("contacts"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    
    const session = await ctx.db
      .query("boatSessions")
      .withIndex("by_user_and_date", (q) => q.eq("userId", userId).eq("date", args.date))
      .unique();
    
    if (session) {
      if (!session.contactIds.includes(args.contactId)) {
        await ctx.db.patch(session._id, {
          contactIds: [...session.contactIds, args.contactId],
        });
      }
    } else {
      await ctx.db.insert("boatSessions", {
        date: args.date,
        startTime: "09:00",
        endTime: "17:00",
        contactIds: [args.contactId],
        userId,
      });
    }
  },
});

export const removeContact = mutation({
  args: {
    date: v.string(),
    contactId: v.id("contacts"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    
    const session = await ctx.db
      .query("boatSessions")
      .withIndex("by_user_and_date", (q) => q.eq("userId", userId).eq("date", args.date))
      .unique();
    
    if (session) {
      await ctx.db.patch(session._id, {
        contactIds: session.contactIds.filter(id => id !== args.contactId),
      });
    }
  },
});
