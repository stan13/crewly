import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { api } from "./_generated/api";
import { Doc, Id } from "./_generated/dataModel";

export const list = query({
  args: {},
  handler: async (ctx): Promise<Array<Doc<"contacts">>> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    
    // Get linked user IDs
    const linkedUserIds = await ctx.runQuery(api.accountLinks.getLinkedUserIds);
    if (!linkedUserIds) return [];
    
    // Get contacts for all linked users
    return await Promise.all(
      linkedUserIds.map((linkedUserId) =>
        ctx.db
          .query("contacts")
          .withIndex("by_user", (q) => q.eq("userId", linkedUserId))
          .collect()
      )
    ).then((results) => results.flat());
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    
    return await ctx.db.insert("contacts", {
      ...args,
      userId,
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
    if (!contact || contact.userId !== userId) {
      throw new Error("Contact not found");
    }
    
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
    if (!contact || contact.userId !== userId) {
      throw new Error("Contact not found");
    }
    
    await ctx.db.delete(args.id);
  },
});
