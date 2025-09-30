import { query } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";


export const getGroupOrMembers = query({
  args: {
    groupId: v.optional(v.id("groups")), // Optional - if provided, will return details for just this group
  },
  handler: async (ctx, args) => {
    // Use centralized getCurrentUser function
    const currentUser = await ctx.runQuery(internal.users.getCurrentUser);

    // Get all groups where the user is a member
    const allGroups = await ctx.db.query("groups").collect();
    const userGroups = allGroups.filter((group) =>
      group.members.some((member) => member.userId === currentUser._id)
    );

    // If a specific group ID is provided, only return details for that group
    if (args.groupId) {
      const selectedGroup = userGroups.find(
        (group) => group._id === args.groupId
      );

      if (!selectedGroup) {
        throw new Error("Group not found or you're not a member");
      }

      // Get all user details for this group's members
      const memberDetails = await Promise.all(
        selectedGroup.members.map(async (member) => {
          const user = await ctx.db.get(member.userId);
          if (!user) return null;

          return {
            id: user._id,
            name: user.name,
            email: user.email,
            imageUrl: user.imageUrl,
            role: member.role,
          };
        })
      );

      // Filter out any null values (in case a user was deleted)
      const validMembers = memberDetails.filter((member) => member !== null);

      // Return selected group with member details
      return {
        selectedGroup: {
          id: selectedGroup._id,
          name: selectedGroup.name,
          description: selectedGroup.description,
          createdBy: selectedGroup.createdBy,
          members: validMembers,
        },
        groups: userGroups.map((group) => ({
          id: group._id,
          name: group.name,
          description: group.description,
          memberCount: group.members.length,
        })),
      };
    } else {
      // Just return the list of groups without member details
      return {
        selectedGroup: null,
        groups: userGroups.map((group) => ({
          id: group._id,
          name: group.name,
          description: group.description,
          memberCount: group.members.length,
        })),
      };
    }
  },
});


// Get expenses for a specific group
export const getGroupExpenses = query({
  args: { groupId: v.id("groups") },
  handler: async (ctx, { groupId }) => {
    // Use centralized getCurrentUser function
    const currentUser = await ctx.runQuery(internal.users.getCurrentUser);

    // Check if group exists
    const group = await ctx.db.get(groupId);
    if (!group) throw new Error("Group not found!");

    // Check whether the user is part of this group
    if (!group.members.some((m) => m.userId === currentUser._id))
      throw new Error("You are not a member of this group");

    // All the expenses of that group
    const expenses = await ctx.db
      .query("expenses")
      .withIndex("by_group", (q) => q.eq("groupId", groupId))
      .collect();

    const settlements = await ctx.db
      .query("settlements")
      .filter((q) => q.eq(q.field("groupId"), groupId))
      .collect();

    /* ----------  member map ---------- */
    const memberDetails = await Promise.all(
      group.members.map(async (m) => {
        const u = await ctx.db.get(m.userId);
        return { id: u._id, name: u.name, imageUrl: u.imageUrl, role: m.role };
      })
    );
    const ids = memberDetails.map((m) => m.id);

    /* ----------  ledgers ---------- */
    // A ledger = a detailed log of financial transactions.
    // Balance Calculation Setup
    // Initialize 'totals' object to track overall balance for each user
    // Format: { userId1: balance1, userId2: balance2 , ...}
    // total net balance (old behaviour)
    const totals = Object.fromEntries(ids.map((id) => [id, 0])); // fromEntries is used to convert array into an object
    // Create a 2d ledger to track who owes whom
    // ledger[A][B] = how much A owes B
    // Example for 3 users (user1, user2, user3) -->
    // ledger = {
    //   "user1": { "user2": 0, "user3": 0 },
    //   "user2": { "user1": 0, "user3": 0 },
    //   "user3": { "user1": 0, "user2": 0 }
    // }
    // pair‑wise ledger  debtor -> creditor -> amount
    const ledger = {};
    ids.forEach((a) => {
      ledger[a] = {};
      ids.forEach((b) => {
        if (a !== b) ledger[a][b] = 0;
      });
    });

    /* ----------  apply expenses ---------- */
    // Example:
    //   Expense 1: user1 paid $60, split equally among all 3 users($20 each)
    //   After applying this expense:
    //      totals = { "user1": +40, "user2": -20, "user3": -20 }
    //      ledger = {
    //         "user1": { "user2": 0, "user3": 0 },
    //         "user2": { "user1": 20, "user3": 0 },
    //         "user3": { "user1": 20, "user2": 0 }
    //      }
    //    This means user2 owes user1 $20 and user3 owes user1 $20
    for (const exp of expenses) {
      const payer = exp.paidByUserId; // payer of that particular expense

      // splits array is from schema.js
      for (const split of exp.splits) {
        if (split.userId === payer || split.paid) continue; // skip payer & settled
        const debtor = split.userId;
        const amt = split.amount;

        totals[payer] += amt;
        totals[debtor] -= amt;

        ledger[debtor][payer] += amt; // debtor owes payer
      }
    }

    /* ----------  apply settlements ---------- */
    // Apply settlements to Balances
    // Continuing the above example:
    // Settlement: user2 paid $10 to user1
    // After applying this settlement:
    // totals = { "user1": +30, "user2": -10, "user3": -20}
    //      ledger = {
    //       "user1": { "user2": 0, "user3": 0 },
    //       "user2": { "user1": 10, "user3": 0 },
    //       "user3": { "user1": 20, "user2": 0 }
    //         }
    //    This means user2 now owes user1 $10 and user3 still owes user1 $20
    for (const s of settlements) {
      // Update totals: increase payer's balance, decrease receiver's balance
      totals[s.paidByUserId] += s.amount;
      totals[s.receivedByUserId] -= s.amount;

      // Update ledger: reduce what the payer owes to the receiver
      ledger[s.paidByUserId][s.receivedByUserId] -= s.amount; // they paid back
    }

    /* ----------  net the pair‑wise ledger ---------- */
    ids.forEach((a) => {
      ids.forEach((b) => {
        if (a >= b) return; // visit each unordered pair once
        const diff = ledger[a][b] - ledger[b][a];
        if (diff > 0) {
          // User A owes User B (net)
          ledger[a][b] = diff;
          ledger[b][a] = 0;
        } else if (diff < 0) {
          // User B owes User A (net)
          ledger[b][a] = -diff;
          ledger[a][b] = 0;
        } else {
          // They're even
          ledger[a][b] = ledger[b][a] = 0;
        }
      });
    });

    /* ----------  shape the response ---------- */
    // Create a comprehensive balance object for each member
    const balances = memberDetails.map((m) => ({
      ...m, // spread all of the existing details about the member
      totalBalance: totals[m.id], // member’s net balance in a precomputed object totals
      owes: Object.entries(ledger[m.id]) // who does this member owe money to
        .filter(([, v]) => v > 0) // keeps only positive amounts (debts).
        .map(([to, amount]) => ({ to, amount })),
      owedBy: ids
        .filter((other) => ledger[other][m.id] > 0) // checking each member (other) in the ids object to see if they owe money to the current member (m) (only positive amounts).
        .map((other) => ({ from: other, amount: ledger[other][m.id] })),
    }));

    // Quick lookup for user details of each member
    const userLookupMap = {};
    memberDetails.forEach((member) => {
      userLookupMap[member.id] = member;
    });

    return {
      // Group information
      group: {
        id: group._id,
        name: group.name,
        description: group.description,
      },
      members: memberDetails, // All group members with details
      expenses, // All expenses in this group
      settlements, // All settlements in this group
      balances, // Calculated balance info for each member
      userLookupMap, // Quick lookup for user details
    };
  },
});
