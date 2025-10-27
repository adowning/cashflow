# Service Refactor Explanation

This project has been refactored to centralize all balance and wagering logic into a single, unified system.

## The Core System

* **`wagering.manager.ts`:** This class is now the **single source of truth** for all balance operations. It directly manages the `playerBalances` table.
* **`schema/gameplay.schema.ts`:** The `playerBalances` table defined here is the **only** table that should be used for tracking real/bonus balances and wagering requirements.

## Refactored Services

* **`deposit.service.ts`:**
    * All legacy balance calls (`getUserBalances`, `creditToBalances`) have been **removed**.
    * It now calls `wageringManager.handleDeposit()` to credit the user's account and apply wagering rules correctly.
    * The `logTransaction` call has been fixed to use the correct `playerId`.

* **`withdrawal.service.ts`:**
    * All legacy wallet calls (`getUserWallets`, `wallets` table, `debitFromWallet`) have been **removed**.
    * It now calls `wageringManager.canUserWithdraw()` to check eligibility.
    * It uses `wageringManager.handleWithdraw()` to process the debit, which also correctly handles bonus forfeiture.
    * A new `wageringManager.handleRefund()` method is called for rejected/cancelled withdrawals to return funds to the player's real balance *without* adding new wagering requirements.

## Deprecated Service

* **`balance-management.service.ts`:**
    * This service is now **DEPRECATED**.
    * Its FIFO bonus logic (using the `playerBonuses` table) is fundamentally **incompatible** with the new, simpler, aggregate balance model used by `WageringManager` (which uses the `bonusBalance` and `bonusWRRemaining` fields from the `playerBalances` table).
    * All its functionality (`deductBetAmount`, `addWinnings`) is now handled by `wageringManager.handleBet()` and `wageringManager.handleWin()`.

## New Mock Services

To make the code runnable and demonstrate the connections, the following mock services (which were imported but not provided) have been created:

* `shared/transaction.service.ts`
* `shared/notifications.service.ts`
* `config/config.ts`
* `user/vip.service.ts`
