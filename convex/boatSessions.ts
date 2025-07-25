import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { api } from "./_generated/api";
import { Doc, Id } from "./_generated/dataModel";

export const list = query({
  args: {
    boatId: v.optional(v.id("boats")),
  },
  handler: async (ctx, args): Promise<Doc<"boatSessions">[]> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    
    // Get selected boat if not provided
    const boatId: Id<"boats"> | undefined = args.boatId || (await ctx.runQuery(api.boats.getSelectedBoat))?._id;
    if (!boatId) return [];

    // Verify user has access to this boat
    const boat = await ctx.db.get(boatId) as Doc<"boats"> | null;
    if (!boat) return [];

    const hasAccess = 
      boat.ownerId === userId ||
      await ctx.db
        .query("boatMembers")
        .withIndex("by_boat_and_user", (q) => q.eq("boatId", boatId).eq("userId", userId))
        .first();

    if (!hasAccess) return [];
    
    return await ctx.db
      .query("boatSessions")
      .withIndex("by_boat", (q) => q.eq("boatId", boatId))
      .collect();
  },
});

export const createOrUpdate = mutation({
  args: {
    date: v.string(),
    startTime: v.string(),
    endTime: v.string(),
    contactIds: v.array(v.id("contacts")),
    boatId: v.optional(v.id("boats")),
  },
  handler: async (ctx, args): Promise<Id<"boatSessions">> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    
    // Get selected boat if not provided
    const boatId: Id<"boats"> | undefined = args.boatId || (await ctx.runQuery(api.boats.getSelectedBoat))?._id;
    if (!boatId) throw new Error("No boat selected");

    // Verify user has access to this boat
    const boat = await ctx.db.get(boatId) as Doc<"boats"> | null;
    if (!boat) throw new Error("Boat not found");

    const hasAccess = 
      boat.ownerId === userId ||
      await ctx.db
        .query("boatMembers")
        .withIndex("by_boat_and_user", (q) => q.eq("boatId", boatId).eq("userId", userId))
        .first();

    if (!hasAccess) throw new Error("No access to this boat");
    
    // Check if session already exists for this date and boat
    const existing: Doc<"boatSessions"> | null = await ctx.db
      .query("boatSessions")
      .withIndex("by_boat_and_date", (q) => q.eq("boatId", boatId).eq("date", args.date))
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
        date: args.date,
        startTime: args.startTime,
        endTime: args.endTime,
        contactIds: args.contactIds,
        boatId,
        createdBy: userId,
      });
    }
  },
});

export const updateTime = mutation({
  args: {
    date: v.string(),
    startTime: v.string(),
    endTime: v.string(),
    boatId: v.optional(v.id("boats")),
  },
  handler: async (ctx, args): Promise<void> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    
    // Get selected boat if not provided
    const boatId: Id<"boats"> | undefined = args.boatId || (await ctx.runQuery(api.boats.getSelectedBoat))?._id;
    if (!boatId) throw new Error("No boat selected");

    // Verify user has access to this boat
    const boat = await ctx.db.get(boatId) as Doc<"boats"> | null;
    if (!boat) throw new Error("Boat not found");

    const hasAccess = 
      boat.ownerId === userId ||
      await ctx.db
        .query("boatMembers")
        .withIndex("by_boat_and_user", (q) => q.eq("boatId", boatId).eq("userId", userId))
        .first();

    if (!hasAccess) throw new Error("No access to this boat");
    
    const session = await ctx.db
      .query("boatSessions")
      .withIndex("by_boat_and_date", (q) => q.eq("boatId", boatId).eq("date", args.date))
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
        boatId,
        createdBy: userId,
      });
    }
  },
});

export const addContact = mutation({
  args: {
    date: v.string(),
    contactId: v.id("contacts"),
    boatId: v.optional(v.id("boats")),
  },
  handler: async (ctx, args): Promise<void> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    
    // Get selected boat if not provided
    const boatId: Id<"boats"> | undefined = args.boatId || (await ctx.runQuery(api.boats.getSelectedBoat))?._id;
    if (!boatId) throw new Error("No boat selected");

    // Verify user has access to this boat
    const boat = await ctx.db.get(boatId) as Doc<"boats"> | null;
    if (!boat) throw new Error("Boat not found");

    const hasAccess = 
      boat.ownerId === userId ||
      await ctx.db
        .query("boatMembers")
        .withIndex("by_boat_and_user", (q) => q.eq("boatId", boatId).eq("userId", userId))
        .first();

    if (!hasAccess) throw new Error("No access to this boat");

    // Verify the contact belongs to this boat
    const contact = await ctx.db.get(args.contactId);
    if (!contact || contact.boatId !== boatId) {
      throw new Error("Contact not found or doesn't belong to this boat");
    }
    
    const session = await ctx.db
      .query("boatSessions")
      .withIndex("by_boat_and_date", (q) => q.eq("boatId", boatId).eq("date", args.date))
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
        boatId,
        createdBy: userId,
      });
    }
  },
});

export const removeContact = mutation({
  args: {
    date: v.string(),
    contactId: v.id("contacts"),
    boatId: v.optional(v.id("boats")),
  },
  handler: async (ctx, args): Promise<void> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    
    // Get selected boat if not provided
    const boatId: Id<"boats"> | undefined = args.boatId || (await ctx.runQuery(api.boats.getSelectedBoat))?._id;
    if (!boatId) throw new Error("No boat selected");

    // Verify user has access to this boat
    const boat = await ctx.db.get(boatId) as Doc<"boats"> | null;
    if (!boat) throw new Error("Boat not found");

    const hasAccess = 
      boat.ownerId === userId ||
      await ctx.db
        .query("boatMembers")
        .withIndex("by_boat_and_user", (q) => q.eq("boatId", boatId).eq("userId", userId))
        .first();

    if (!hasAccess) throw new Error("No access to this boat");
    
    const session = await ctx.db
      .query("boatSessions")
      .withIndex("by_boat_and_date", (q) => q.eq("boatId", boatId).eq("date", args.date))
      .unique();
    
    if (session) {
      await ctx.db.patch(session._id, {
        contactIds: session.contactIds.filter(id => id !== args.contactId),
      });
    }
  },
});