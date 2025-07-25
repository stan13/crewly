import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { Doc, Id } from "./_generated/dataModel";
import { api } from "./_generated/api";

// Get all boats the user has access to (owned or member)
export const getUserBoats = query({
  args: {},
  handler: async (ctx): Promise<Array<Doc<"boats"> & { role: "owner" | "member" }>> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    // Get boats user owns
    const ownedBoats = await ctx.db
      .query("boats")
      .withIndex("by_owner", (q) => q.eq("ownerId", userId))
      .collect();

    // Get boats user is a member of (but not owner of)
    const memberships = await ctx.db
      .query("boatMembers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const memberBoats = await Promise.all(
      memberships.map(async (membership) => {
        const boat = await ctx.db.get(membership.boatId);
        // Only include if user is not the owner (to avoid duplicates)
        return boat && boat.ownerId !== userId ? { ...boat, role: membership.role as "owner" | "member" } : null;
      })
    );

    const ownedBoatsWithRole = ownedBoats.map(boat => ({ ...boat, role: "owner" as const }));
    const validMemberBoats = memberBoats.filter(boat => boat !== null);

    return [...ownedBoatsWithRole, ...validMemberBoats];
  },
});

// Get the currently selected boat for the user
export const getSelectedBoat = query({
  args: {},
  handler: async (ctx): Promise<Doc<"boats"> | null> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const userSettings = await ctx.db
      .query("userSettings")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!userSettings?.selectedBoatId) {
      // If no selected boat, try to get the user's first boat
      const boats = await ctx.runQuery(api.boats.getUserBoats);
      return boats.length > 0 ? boats[0] : null;
    }

    return await ctx.db.get(userSettings.selectedBoatId);
  },
});

// Create a new boat
export const createBoat = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const boatId = await ctx.db.insert("boats", {
      name: args.name,
      description: args.description,
      ownerId: userId,
      createdAt: Date.now(),
    });

    // Add the owner as a member
    await ctx.db.insert("boatMembers", {
      boatId,
      userId,
      role: "owner",
      invitedBy: userId,
      joinedAt: Date.now(),
    });

    // Set this as the selected boat
    await ctx.runMutation(api.boats.selectBoat, { boatId });

    return boatId;
  },
});

// Select a boat for the user
export const selectBoat = mutation({
  args: {
    boatId: v.id("boats"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Verify user has access to this boat
    const boat = await ctx.db.get(args.boatId);
    if (!boat) throw new Error("Boat not found");

    const hasAccess = 
      boat.ownerId === userId ||
      await ctx.db
        .query("boatMembers")
        .withIndex("by_boat_and_user", (q) => q.eq("boatId", args.boatId).eq("userId", userId))
        .first();

    if (!hasAccess) throw new Error("No access to this boat");

    // Update user settings
    const existingSettings = await ctx.db
      .query("userSettings")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (existingSettings) {
      await ctx.db.patch(existingSettings._id, { selectedBoatId: args.boatId });
    } else {
      await ctx.db.insert("userSettings", {
        userId,
        selectedBoatId: args.boatId,
      });
    }
  },
});

// Invite user to boat by email
export const inviteUserToBoat = mutation({
  args: {
    boatId: v.id("boats"),
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Verify user owns the boat or is a member
    const boat = await ctx.db.get(args.boatId);
    if (!boat) throw new Error("Boat not found");

    const hasAccess = 
      boat.ownerId === userId ||
      await ctx.db
        .query("boatMembers")
        .withIndex("by_boat_and_user", (q) => q.eq("boatId", args.boatId).eq("userId", userId))
        .first();

    if (!hasAccess) throw new Error("No permission to invite users to this boat");

    // Check if invite already exists
    const existingInvite = await ctx.db
      .query("boatInvites")
      .withIndex("by_boat_and_email", (q) => q.eq("boatId", args.boatId).eq("email", args.email))
      .first();

    if (existingInvite && existingInvite.status === "pending") {
      throw new Error("Invite already sent to this email");
    }

    // Check if user is already a member
    const targetUser = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", args.email))
      .first();

    if (targetUser) {
      const existingMember = await ctx.db
        .query("boatMembers")
        .withIndex("by_boat_and_user", (q) => q.eq("boatId", args.boatId).eq("userId", targetUser._id))
        .first();

      if (existingMember) {
        throw new Error("User is already a member of this boat");
      }
    }

    return await ctx.db.insert("boatInvites", {
      boatId: args.boatId,
      email: args.email,
      invitedBy: userId,
      status: "pending",
      createdAt: Date.now(),
    });
  },
});

// Get pending invites for the current user
export const getPendingInvites = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const user = await ctx.db.get(userId);
    if (!user?.email) return [];

    const invites = await ctx.db
      .query("boatInvites")
      .withIndex("by_email", (q) => q.eq("email", user.email!))
      .filter((q) => q.eq(q.field("status"), "pending"))
      .collect();

    const invitesWithBoats = await Promise.all(
      invites.map(async (invite) => {
        const boat = await ctx.db.get(invite.boatId);
        const inviter = await ctx.db.get(invite.invitedBy);
        return {
          ...invite,
          boat,
          inviter,
        };
      })
    );

    return invitesWithBoats;
  },
});

// Accept a boat invite
export const acceptBoatInvite = mutation({
  args: {
    inviteId: v.id("boatInvites"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const user = await ctx.db.get(userId);
    if (!user?.email) throw new Error("User email not found");

    const invite = await ctx.db.get(args.inviteId);
    if (!invite || invite.email !== user.email || invite.status !== "pending") {
      throw new Error("Invalid invite");
    }

    // Add user as boat member
    await ctx.db.insert("boatMembers", {
      boatId: invite.boatId,
      userId,
      role: "member",
      invitedBy: invite.invitedBy,
      joinedAt: Date.now(),
    });

    // Mark invite as accepted
    await ctx.db.patch(args.inviteId, { status: "accepted" });

    // Set this as the user's selected boat if they don't have one
    const currentSelectedBoat = await ctx.runQuery(api.boats.getSelectedBoat);
    if (!currentSelectedBoat) {
      await ctx.runMutation(api.boats.selectBoat, { boatId: invite.boatId });
    }
  },
});

// Decline a boat invite
export const declineBoatInvite = mutation({
  args: {
    inviteId: v.id("boatInvites"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const user = await ctx.db.get(userId);
    if (!user?.email) throw new Error("User email not found");

    const invite = await ctx.db.get(args.inviteId);
    if (!invite || invite.email !== user.email || invite.status !== "pending") {
      throw new Error("Invalid invite");
    }

    await ctx.db.patch(args.inviteId, { status: "declined" });
  },
});

// Get boat members
export const getBoatMembers = query({
  args: {
    boatId: v.id("boats"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    // Verify user has access to this boat
    const boat = await ctx.db.get(args.boatId);
    if (!boat) return [];

    const hasAccess = 
      boat.ownerId === userId ||
      await ctx.db
        .query("boatMembers")
        .withIndex("by_boat_and_user", (q) => q.eq("boatId", args.boatId).eq("userId", userId))
        .first();

    if (!hasAccess) return [];

    const members = await ctx.db
      .query("boatMembers")
      .withIndex("by_boat", (q) => q.eq("boatId", args.boatId))
      .collect();

    const membersWithUsers = await Promise.all(
      members.map(async (member) => {
        const user = await ctx.db.get(member.userId);
        return {
          ...member,
          user,
        };
      })
    );

    return membersWithUsers;
  },
});