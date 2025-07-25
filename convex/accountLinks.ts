import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { Id } from "./_generated/dataModel";

export const sendLinkRequest = mutation({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    
    // Find user by email
    const targetUser = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", args.email))
      .unique();
    
    if (!targetUser) {
      throw new Error("User not found with that email");
    }
    
    if (targetUser._id === userId) {
      throw new Error("Cannot link to yourself");
    }
    
    // Check if link already exists
    const existingLink = await ctx.db
      .query("accountLinks")
      .withIndex("by_users", (q) => q.eq("fromUserId", userId).eq("toUserId", targetUser._id))
      .unique();
    
    const reverseLink = await ctx.db
      .query("accountLinks")
      .withIndex("by_users", (q) => q.eq("fromUserId", targetUser._id).eq("toUserId", userId))
      .unique();
    
    if (existingLink || reverseLink) {
      throw new Error("Link request already exists");
    }
    
    return await ctx.db.insert("accountLinks", {
      fromUserId: userId,
      toUserId: targetUser._id,
      status: "pending",
    });
  },
});

export const acceptLinkRequest = mutation({
  args: {
    linkId: v.id("accountLinks"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    
    const link = await ctx.db.get(args.linkId);
    if (!link || link.toUserId !== userId) {
      throw new Error("Link request not found");
    }
    
    await ctx.db.patch(args.linkId, {
      status: "accepted",
    });
  },
});

export const rejectLinkRequest = mutation({
  args: {
    linkId: v.id("accountLinks"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    
    const link = await ctx.db.get(args.linkId);
    if (!link || link.toUserId !== userId) {
      throw new Error("Link request not found");
    }
    
    await ctx.db.delete(args.linkId);
  },
});

export const removeLink = mutation({
  args: {
    linkId: v.id("accountLinks"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    
    const link = await ctx.db.get(args.linkId);
    if (!link || (link.fromUserId !== userId && link.toUserId !== userId)) {
      throw new Error("Link not found");
    }
    
    await ctx.db.delete(args.linkId);
  },
});

export const getPendingRequests = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    
    const requests = await ctx.db
      .query("accountLinks")
      .withIndex("by_to_user", (q) => q.eq("toUserId", userId))
      .filter((q) => q.eq(q.field("status"), "pending"))
      .collect();
    
    const requestsWithUsers = await Promise.all(
      requests.map(async (request) => {
        const fromUser = await ctx.db.get(request.fromUserId);
        return {
          ...request,
          fromUser,
        };
      })
    );
    
    return requestsWithUsers;
  },
});

export const getLinkedAccounts = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    
    const outgoingLinks = await ctx.db
      .query("accountLinks")
      .withIndex("by_from_user", (q) => q.eq("fromUserId", userId))
      .filter((q) => q.eq(q.field("status"), "accepted"))
      .collect();
    
    const incomingLinks = await ctx.db
      .query("accountLinks")
      .withIndex("by_to_user", (q) => q.eq("toUserId", userId))
      .filter((q) => q.eq(q.field("status"), "accepted"))
      .collect();
    
    const allLinks = [...outgoingLinks, ...incomingLinks];
    
    const linksWithUsers = await Promise.all(
      allLinks.map(async (link) => {
        const otherUserId = link.fromUserId === userId ? link.toUserId : link.fromUserId;
        const otherUser = await ctx.db.get(otherUserId);
        return {
          ...link,
          otherUser,
        };
      })
    );
    
    return linksWithUsers;
  },
});

export const getLinkedUserIds = query({
  args: {},
  handler: async (ctx): Promise<Id<"users">[]> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    
    const outgoingLinks = await ctx.db
      .query("accountLinks")
      .withIndex("by_from_user", (q) => q.eq("fromUserId", userId))
      .filter((q) => q.eq(q.field("status"), "accepted"))
      .collect();
    
    const incomingLinks = await ctx.db
      .query("accountLinks")
      .withIndex("by_to_user", (q) => q.eq("toUserId", userId))
      .filter((q) => q.eq(q.field("status"), "accepted"))
      .collect();
    
    const linkedUserIds = [
      ...outgoingLinks.map(link => link.toUserId),
      ...incomingLinks.map(link => link.fromUserId),
    ];
    
    return [userId, ...linkedUserIds].filter((id): id is Id<"users"> => id !== null);
  },
});
