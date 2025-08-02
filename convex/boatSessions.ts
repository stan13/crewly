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
      // Convert contactIds to crew format
      const crew = args.contactIds.map(contactId => ({
        contactId,
        status: "pending" as const,
      }));
      
      await ctx.db.patch(existing._id, {
        startTime: args.startTime,
        endTime: args.endTime,
        crew,
      });
      return existing._id;
    } else {
      // Convert contactIds to crew format
      const crew = args.contactIds.map(contactId => ({
        contactId,
        status: "pending" as const,
      }));
      
      return await ctx.db.insert("boatSessions", {
        date: args.date,
        startTime: args.startTime,
        endTime: args.endTime,
        crew,
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
        crew: [],
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
      // Check if contact is already in crew
      const crew = session.crew || [];
      const existingCrewMember = crew.find(member => member.contactId === args.contactId);
      
      if (!existingCrewMember) {
        await ctx.db.patch(session._id, {
          crew: [...crew, { contactId: args.contactId, status: "pending" as const }],
        });
      }
    } else {
      // Default times based on day of week
      const dayOfWeek = new Date(args.date).getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // Sunday = 0, Saturday = 6
      const defaultStartTime = isWeekend ? "12:00" : "17:00"; // 12pm weekends, 5pm weekdays
      const defaultEndTime = isWeekend ? "18:00" : "20:00";   // 6pm weekends, 8pm weekdays
      
      await ctx.db.insert("boatSessions", {
        date: args.date,
        startTime: defaultStartTime,
        endTime: defaultEndTime,
        crew: [{ contactId: args.contactId, status: "pending" as const }],
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
      const crew = session.crew || [];
      await ctx.db.patch(session._id, {
        crew: crew.filter(member => member.contactId !== args.contactId),
      });
    }
  },
});

export const updateCrewConfirmation = mutation({
  args: {
    date: v.string(),
    contactId: v.id("contacts"),
    status: v.union(v.literal("confirmed"), v.literal("declined"), v.literal("pending")),
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
    
    if (!session) throw new Error("Session not found");
    
    const crew = session.crew || [];
    const crewMemberIndex = crew.findIndex(member => member.contactId === args.contactId);
    
    if (crewMemberIndex === -1) throw new Error("Contact not found in session");
    
    // Update the crew member's status
    const updatedCrew = [...crew];
    updatedCrew[crewMemberIndex] = {
      ...updatedCrew[crewMemberIndex],
      status: args.status,
      confirmedAt: args.status !== "pending" ? Date.now() : undefined,
    };
    
    await ctx.db.patch(session._id, { crew: updatedCrew });
  },
});

export const getCrewConfirmations = query({
  args: {
    date: v.string(),
    boatId: v.optional(v.id("boats")),
  },
  handler: async (ctx, args): Promise<Array<{
    contactId: Id<"contacts">;
    status: "confirmed" | "declined" | "pending";
    confirmedAt?: number;
    contact: Doc<"contacts"> | null;
  }> | null> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    
    // Get selected boat if not provided
    const boatId: Id<"boats"> | undefined = args.boatId || (await ctx.runQuery(api.boats.getSelectedBoat))?._id;
    if (!boatId) return null;

    // Verify user has access to this boat
    const boat = await ctx.db.get(boatId) as Doc<"boats"> | null;
    if (!boat) return null;

    const hasAccess = 
      boat.ownerId === userId ||
      await ctx.db
        .query("boatMembers")
        .withIndex("by_boat_and_user", (q) => q.eq("boatId", boatId).eq("userId", userId))
        .first();

    if (!hasAccess) return null;
    
    const session: Doc<"boatSessions"> | null = await ctx.db
      .query("boatSessions")
      .withIndex("by_boat_and_date", (q) => q.eq("boatId", boatId).eq("date", args.date))
      .unique();
    
    if (!session) return null;
    
    const crew = session.crew || [];
    
    // Get contact details for each crew member
    const crewWithContacts = await Promise.all(
      crew.map(async (member: { contactId: Id<"contacts">; status: "confirmed" | "declined" | "pending"; confirmedAt?: number }) => {
        const contact = await ctx.db.get(member.contactId);
        return {
          ...member,
          contact,
        };
      })
    );
    
    return crewWithContacts;
  },
});