### Product Requirements Document (PRD): Refactoring Services for Ideal Schema Migration

**Date**: October 25, 2025  
**Author**: Roo (Technical Assistant)  
**Purpose**: This PRD provides detailed instructions for AI (or developers) to refactor affected services in the backend (e.g., bet-orchestration, balance-management, VIP-service) to align with the new ideal schema. Since this is a greenfield project with no active users, we can proceed aggressively without downtime concerns. The refactoring ensures services support centralized wallet/balance/VIP data, pre-computed aggregates, and efficient bonus/wagering tracking.

**Assumptions**:

- Schema migration is complete (new tables like players, wallets, balances with aggregates, playerBonuses, transactions, vipRanks are in place; old tables like vipInfos are dropped or migrated).
- No active users—breaking changes are acceptable, but aim for minimal regressions.
- Use Drizzle ORM for database interactions.
- Focus on core services: bet-orchestration.service.ts, balance-management.service.ts, and VIP-service (inferred from schema and usage, e.g., vip.service.ts).

**Goals**:

- Update services to query new schema structures (e.g., wallets for VIP data, balances for aggregates).
- Ensure compatibility with bonus FIFO logic, mixed balance betting, and VIP progression.
- Maintain performance (e.g., sub-300ms bet processing in bet-orchestration).

---

#### 1. **Schema Changes Summary**

The new schema consolidates data for efficiency:

- **Players**: Core user entity (replaces/aligns with existing users/players).
- **Wallets**: Now includes VIP fields (vipLevel, vipXp, vipRankId) and links to balances.
- **Balances**: Enhanced with aggregates (totalRealBalance, totalBonusBalance, bonuses JSON) for quick access.
- **PlayerBonuses**: Retained for detailed FIFO wagering (syncs with balances.bonuses).
- **Transactions**: Expanded for bet/win logging with balance snapshots.
- **VIPRanks**: New table for VIP tiers (migrated from vipRanks/vipLevels).
- **Key Shifts**:
  - VIP data moved from vipInfos to wallets.
  - Aggregates (e.g., totalBalance) pre-computed in balances.
  - Bonus summaries in balances.bonuses (JSON) for fast queries.
  - Relations: Wallets -> balances, players -> wallets/playerBonuses.

**Impact**: Services must update queries (e.g., from vipInfos to wallets) and handle new aggregates.

---

#### 2. **Service Refactoring Instructions**

Refactor services in this order: balance-management (core logic), bet-orchestration (depends on balances), VIP-service (simple updates). Provide code examples for clarity.

##### 2.1 **Balance-Management Service (balance-management.service.ts)**

- **What Has Changed**: Balances now include aggregates (e.g., totalRealBalance) and bonuses JSON. PlayerBonuses handles detailed wagering.
- **What Needs to Change**:
  - Update queries to use balances for aggregates instead of computing at runtime.
  - Sync bonuses JSON in balances with playerBonuses after wagering updates.
  - Adjust deductBetAmount and addWinnings for new fields (e.g., update totalRealLosses).
- **Detailed Steps**:
  1.  **Update getDetailedBalance**: Query balances for aggregates and bonuses JSON; fallback to playerBonuses for details.
      - Example: Change `db.query.balances.findFirst({ where: eq(balances.id, walletId) })` to include new fields.
  2.  **Modify deductBetAmount**: After deductions, update aggregates (e.g., `totalRealLosses += deductedReal`).
      - Use transactions for atomicity: `await tx.update(balances).set({ totalRealLosses: sql`${balances.totalRealLosses} + ${deductedAmount}` })`.
  3.  **Enhance addWinnings**: Update balances.totalBonusBalance and sync bonuses JSON.
  4.  **Sync PlayerBonuses**: After FIFO updates, aggregate active bonuses into balances.bonuses.
- **Code Snippet Example**:
  ```typescript
  // In deductBetAmount: Update aggregates
  await tx
    .update(balances)
    .set({
      totalRealLosses: sql`${balances.totalRealLosses} + ${totalRealDeducted}`,
      updatedAt: new Date(),
    })
    .where(eq(balances.id, walletId));
  ```
- **Testing**: Verify FIFO logic with mixed balances; ensure bonuses JSON updates correctly.

##### 2.2 **Bet-Orchestration Service (bet-orchestration.service.ts)**

- **What Has Changed**: Wallets now hold VIP data; balances have pre-computed aggregates. Transactions require balance snapshots.
- **What Needs to Change**:
  - Query wallets for VIP updates instead of vipInfos.
  - Use balances for realBalance/bonusBalance (not separate tables).
  - Update transaction logging with new fields (e.g., balanceBefore/balanceAfter from balances).
- **Detailed Steps**:
  1.  **Update getUserWallets**: Change to query wallets -> balances (e.g., `db.query.wallets.findMany({ where: eq(wallets.playerId, userId), with: { balances: true } })`).
  2.  **Modify processBet**: Access balances.totalBalance directly. Update VIP via wallets.vipXp (e.g., call VIP-service to update wallets).
  3.  **Enhance Transaction Logging**: Use balances fields for pre/post balances (e.g., `preRealBalance: balances.realBalance`).
  4.  **Adjust Notifications**: Update balanceChange to use new aggregates (e.g., `realBalance: balances.realBalance`).
- **Code Snippet Example**:
  ```typescript
  // In processBet: Fetch wallet with balances
  const userWallet = await db.query.wallets.findFirst({
    where: eq(wallets.playerId, betRequest.userId),
    with: { balances: true },
  });
  const runningBalance = userWallet.balances.totalBalance; // Use aggregate
  ```
- **Testing**: Simulate bets; verify sub-300ms processing and accurate VIP updates.

##### 2.3 **VIP-Service (vip.service.ts, Inferred from Usage)**

- **What Has Changed**: VIP data (level, XP) in wallets; vipRanks for tiers.
- **What Needs to Change**:
  - Update functions like addXpToUser to modify wallets.vipXp and wallets.vipLevel.
  - Query vipRanks for level progression.
- **Detailed Steps**:
  1.  **Refactor addXpToUser**: Update wallets instead of vipInfos (e.g., `await db.update(wallets).set({ vipXp: sql`${wallets.vipXp} + ${xpAmount}` }).where(eq(wallets.playerId, userId))`).
  2.  **Update getVIPLevels**: Query vipRanks (e.g., `db.query.vipRanks.findMany({ orderBy: [asc(vipRanks.minXp)] })`).
  3.  **Handle Level-Ups**: Check if vipXp >= vipRank.minXp and update vipLevel/vipRankId.
- **Code Snippet Example**:
  ```typescript
  // In addXpToUser: Update wallet VIP
  const wallet = await db.query.wallets.findFirst({ where: eq(wallets.playerId, userId) });
  const newXp = wallet.vipXp + xpAmount;
  await db.update(wallets).set({ vipXp: newXp }).where(eq(wallets.id, wallet.id));
  ```
- **Testing**: Test XP gains and level-ups; ensure integration with bet-orchestration.

##### 2.4 **Other Affected Services (e.g., Wallet.Service.ts)**

- **What Has Changed**: Wallets now centralize data; balances handle aggregates.
- **What Needs to Change**:
  - Update getUserWallets to include balances and VIP fields.
  - Adjust creditToWallet to update balances aggregates.
- **Steps**: Modify queries to use new relations (e.g., `with: { balances: true }`). Update balance additions to sync totalBalance.

---

#### 3. **Testing and Validation**

- **Unit Tests**: Update mocks for new schema (e.g., balances with aggregates). Test edge cases like bonus expiry and mixed balances.
- **Integration Tests**: Run full bet flows in staging; verify VIP progression and transaction logs.
- **Performance**: Use `EXPLAIN ANALYZE` on key queries (e.g., wallet balance retrieval). Ensure <300ms for bet processing.
- **Edge Cases**: Test data migration scenarios (e.g., orphaned records) and bonus FIFO with aggregates.
- **Tools**: Use Drizzle's query builder for validation; monitor with your app's logging.

---

#### 4. **Deployment and Rollback**

- **Deployment**: Push schema changes first, then services. Use feature flags for gradual rollout (e.g., enable new balances logic).
- **Rollback**: If issues, revert services to old queries and restore backups. Keep old schema readable during transition.
- **Monitoring**: Watch for errors in bet processing or balance discrepancies post-deployment.

This PRD ensures AI has clear, actionable instructions for refactoring. If you need code diffs, Mermaid diagrams for data flows, or expansions (e.g., for other services), let me know!
