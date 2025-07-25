import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { api } from "./_generated/api";
import { Doc, Id } from "./_generated/dataModel";

export const list = query({
  args: {
    boatId: v.optional(v.id("boats")),
  },
  handler: async (ctx, args): Promise<Array<Doc<"contacts">>> => {
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
    
    // Get contacts for this boat and sort alphabetically by name
    const contacts = await ctx.db
      .query("contacts")
      .withIndex("by_boat", (q) => q.eq("boatId", boatId))
      .collect();
    
    return contacts.sort((a, b) => a.name.localeCompare(b.name));
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    boatId: v.optional(v.id("boats")),
  },
  handler: async (ctx, args): Promise<Id<"contacts">> => {
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
    
    return await ctx.db.insert("contacts", {
      name: args.name,
      email: args.email,
      phone: args.phone,
      boatId,
      createdBy: userId,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("contacts"),
    name: v.string(),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    
    const contact = await ctx.db.get(args.id);
    if (!contact) throw new Error("Contact not found");

    // Verify user has access to this boat
    const boat = await ctx.db.get(contact.boatId);
    if (!boat) throw new Error("Boat not found");

    const hasAccess = 
      boat.ownerId === userId ||
      await ctx.db
        .query("boatMembers")
        .withIndex("by_boat_and_user", (q) => q.eq("boatId", contact.boatId).eq("userId", userId))
        .first();

    if (!hasAccess) throw new Error("No access to this boat");
    
    await ctx.db.patch(args.id, {
      name: args.name,
      email: args.email,
      phone: args.phone,
    });
  },
});

export const remove = mutation({
  args: { id: v.id("contacts") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    
    const contact = await ctx.db.get(args.id);
    if (!contact) throw new Error("Contact not found");

    // Verify user has access to this boat
    const boat = await ctx.db.get(contact.boatId);
    if (!boat) throw new Error("Boat not found");

    const hasAccess = 
      boat.ownerId === userId ||
      await ctx.db
        .query("boatMembers")
        .withIndex("by_boat_and_user", (q) => q.eq("boatId", contact.boatId).eq("userId", userId))
        .first();

    if (!hasAccess) throw new Error("No access to this boat");
    
    await ctx.db.delete(args.id);
  },
});
