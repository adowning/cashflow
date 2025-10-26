### Product Requirements Document (PRD): Refactoring Seed Files for Ideal Schema Migration

**Date**: October 25, 2025  
**Author**: Roo (Technical Assistant)  
**Purpose**: This PRD provides detailed instructions for AI (or developers) to refactor the seed files in `backend/src/seed/` to align with the new ideal schema. The refactoring ensures seeders support the consolidated wallet/balance/VIP structure, pre-computed aggregates, and efficient bonus tracking. Since this is a greenfield project, we can proceed without downtime, but focus on accuracy for seeding realistic data for testing services like bet-orchestration and balance-management.

**Assumptions**:

- Schema migration is complete (e.g., wallets include VIP fields, balances have aggregates, vipInfos is deprecated).
- Seeders run in sequence as defined in `seed.ts`.
- Use Drizzle ORM for database interactions.
- Focus on core seeders: users.ts, vip.ts, playerBonuses.ts, gameSpins.ts, and others that directly impact wallets/balances/VIP.

**Goals**:

- Update seeders to populate new schema fields (e.g., vipLevel in wallets).
- Ensure data consistency (e.g., sync balances aggregates with transactions).
- Maintain seeding performance and handle dependencies (e.g., users before wallets).

---

#### 1. **Schema Changes Impact on Seeders**

The new schema shifts VIP and balance data:

- **VIP Data**: Moved from vipInfos to wallets (vipLevel, vipXp, vipRankId). Seeders must update wallets instead of vipInfos.
- **Balances**: Enhanced with aggregates (totalRealBalance, bonuses JSON). Seeders should populate these during wallet creation.
- **PlayerBonuses**: Retained for detailed bonus tracking; seeders must ensure sync with balances.bonuses.
- **Other**: Transactions, games, and operators remain similar but may need minor adjustments for relations.

**Impact**: Seeders like users.ts and vip.ts require updates to avoid creating obsolete vipInfos. GameSpins.ts must use new balances for bet processing.

---

#### 2. **File-Specific Refactoring Instructions**

Refactor files in dependency order: operator.ts (first), users.ts (creates players/wallets), vip.ts (VIP data), playerBonuses.ts, gameSpins.ts (last, as it processes bets).

##### 2.1 **users.ts (Seeds Players, Wallets, Balances)**

- **What Has Changed**: Wallets now include VIP fields; balances require aggregates.
- **What Needs to Change**:
  - Add VIP fields (vipLevel, vipXp, vipRankId) to wallets during creation.
  - Populate balances with aggregates (e.g., totalBalance = amount + bonus).
  - Remove vipInfos creation; link vipRankId to vipRanks.
- **Detailed Steps**:
  1.  **Update Wallet Creation**: In the transaction (lines 73-166), add VIP fields to wallets insert (e.g., `vipLevel: 1, vipXp: 0, vipRankId: 'bronze-id'`).
  2.  **Enhance Balances Insert**: Populate new fields (e.g., `totalBalance: initialBalance, realBalance: initialBalance`).
  3.  **Remove VIP Info**: Delete lines creating vipInfos (lines 100-107); instead, set vipRankId.
  4.  **Hardcoded Users**: Update seedHardcodedUser and seedSystem to populate VIP in wallets.
- **Code Snippet Example**:
  ```typescript
  // In wallet insert: Add VIP fields
  await tx.insert(schema.wallets).values({
    id: walletId,
    playerId: newUser.id,
    balance: initialBalance,
    operatorId: operatorId,
    isActive: true,
    vipLevel: 1, // New
    vipXp: 0, // New
    vipRankId: 'bronze-rank-id', // New, link to vipRanks
  });
  // In balances insert: Add aggregates
  await tx.insert(schema.balances).values({
    id: nanoid(),
    playerId: newUser.id,
    currencyId: 'USD',
    walletId: walletId,
    amount: initialBalance,
    bonus: 0,
    realBalance: initialBalance, // New
    totalBalance: initialBalance, // New
    // Add other aggregates
    bonuses: [], // New JSON array
    updatedAt: new Date(),
  });
  ```
- **Testing**: Verify wallets have VIP data; check balances aggregates.

##### 2.2 **vip.ts (Seeds VIP Ranks and Levels)**

- **What Has Changed**: VIP data moves to wallets; vipRanks is the new table.
- **What Needs to Change**:
  - Populate vipRanks instead of vipLevels directly.
  - Remove vipInfos creation (lines 220-240); update players with vipRankId.
  - Adjust generateRandomVipInfo to return wallet VIP data.
- **Detailed Steps**:
  1.  **Update seedVipLevels**: Ensure vipRanks are inserted (lines 192-210); link to wallets via vipRankId.
  2.  **Remove VIP Info Seeding**: Delete vipInfos inserts; instead, update wallets with VIP data.
  3.  **Player Updates**: Set players.vipRankId (from vipRanks) instead of vipInfoId.
- **Code Snippet Example**:
  ```typescript
  // Instead of creating vipInfos: Update wallets
  await db
    .update(schema.wallets)
    .set({
      vipLevel: record.level,
      vipXp: record.xp,
      vipRankId: record.rankId, // From vipRanks
    })
    .where(eq(schema.wallets.playerId, record.playerId));
  ```
- **Testing**: Confirm VIP ranks link to wallets; no vipInfos created.

##### 2.3 **playerBonuses.ts (Seeds Player Bonuses)**

- **What Has Changed**: Sync with balances.bonuses JSON.
- **What Needs to Change**:
  - After inserting playerBonuses, update balances.bonuses with summaries.
  - Ensure status and amounts align with new schema.
- **Detailed Steps**:
  1.  **Update Inserts**: Keep detailed bonus data in playerBonuses.
  2.  **Sync Balances**: After inserts, aggregate into balances.bonuses (e.g., map active bonuses to JSON array).
  3.  **Status Handling**: Use new bonusStatusEnum values.
- **Code Snippet Example**:
  ```typescript
  // After playerBonuses insert: Sync to balances
  const activeBonuses = await db.query.playerBonuses.findMany({
    where: eq(playerBonuses.playerId, player.id),
  });
  const bonusesJson = activeBonuses.map((b) => ({ id: b.id, amount: b.amount /* other fields */ }));
  await db
    .update(schema.balances)
    .set({ bonuses: bonusesJson })
    .where(eq(schema.balances.walletId, walletId));
  ```
- **Testing**: Verify balances.bonuses reflects playerBonuses.

##### 2.4 **gameSpins.ts (Seeds Game Sessions and Processes Bets)**

- **What Has Changed**: Use new balances for bet processing.
- **What Needs to Change**:
  - Update wallet/balance queries to use aggregates.
  - Ensure processBet uses new fields (e.g., totalBalance).
- **Detailed Steps**:
  1.  **Update Wallet Checks**: Query balances for realBalance/bonusBalance (lines 82-99).
  2.  **Modify Bet Processing**: Pass new aggregates to processBet (e.g., update runningBalance).
  3.  **Balance Updates**: Ensure post-bet updates sync aggregates.
- **Code Snippet Example**:
  ```typescript
  // Update balance query: Use new fields
  const walletBalance = await db.query.balances.findFirst({
    where: eq(balances.walletId, existingWallet.id),
  });
  const totalBalance = walletBalance.totalBalance; // New aggregate
  ```
- **Testing**: Run bets; verify aggregates update correctly.

##### 2.5 **Other Seeders (e.g., bonuses.seed.ts, jackpots.ts, settings.seed.ts)**

- **bonuses.seed.ts**: Minor—ensure inserts match new bonuses table.
- **jackpots.ts**: Update games.jpgIds to link to jackpots.
- **settings.seed.ts**: Keep VIP levels; ensure they map to vipRanks.
- **reset.ts**: Add new tables to truncateQuery (e.g., vipRanks, balances).
- **seed.ts (Main Orchestrator)**: Update order if needed (e.g., users before playerBonuses).
- **better-auth.ts**: Ensure roles/users seed before players/wallets.

---

#### 3. **Overall Seeding Flow Updates**

- **Sequence**: operator -> settings/vipRanks -> users/wallets/balances -> playerBonuses -> games/jackpots -> gameSpins.
- **Dependencies**: Users must exist before wallets; balances must sync with playerBonuses.
- **Error Handling**: Add checks for new fields (e.g., ensure vipRankId exists).
- **Performance**: Use transactions for bulk inserts (e.g., in users.ts).

---

#### 4. **Testing and Validation**

- **Unit Tests**: Mock new schema in seeders; test individual functions.
- **Integration Tests**: Run full seed sequence; verify data in new tables.
- **Edge Cases**: Test missing VIP ranks or bonus syncing.
- **Tools**: Use Drizzle queries for validation; check logs for errors.

---

#### 5. **Deployment and Rollback**

- **Deployment**: Run seeders post-migration; monitor for data mismatches.
- **Rollback**: If issues, revert to old seeders or restore backups.

This PRD ensures seeders align with the new schema for accurate testing. If you need code diffs or Mermaid diagrams, let me know!
