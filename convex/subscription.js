import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const updateFromWebhook = mutation({
  args: {
    clerkUserId: v.string(),
    subscriptionId: v.string(),
    plan: v.string(),
    status: v.string(),
    currentPeriodEnd: v.number(),
  },
  handler: async (ctx, args) => {
    // Security: Only allow calls with webhook secret
    if (!process.env.CLERK_WEBHOOK_SECRET) {            
      throw new Error("Unauthorized");
    }

    await ctx.db.patch(
      await ctx.db
        .query("users")
        .withIndex("by_clerk_user_id", q => q.eq("clerkUserId", args.clerkUserId))
        .unique(),
      {
        plan: args.plan,
        subscriptionId: args.subscriptionId,
        subscriptionStatus: args.status,
        currentPeriodEnd: args.currentPeriodEnd,
      }
    );
  },
});