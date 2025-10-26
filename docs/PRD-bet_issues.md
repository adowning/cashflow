<write_file>
<path>PRD-issues-resolution.md</path>
<content># Product Requirements Document: Bet Orchestration Service Issues Resolution

## Introduction

### Overview
This PRD addresses critical logic errors, bugs, inconsistencies, edge cases, unmet preconditions, incorrect assumptions, and potential runtime issues identified in the `backend/src/services/bet-orchestration.service.ts` file. The analysis cross-references related services including `balance-management.service.ts`, `bet-validation.service.ts`, `transaction-logging.service.ts`, `wallet.service.ts`, `vip.service.ts`, `wagering.service.ts`, `ggr.service.ts`, `jackpot.service.ts`, and `realtime-notifications.service.ts`, as well as TODO notes in `TODO-bets.md`.

### Scope
- **Target File**: `backend/src/services/bet-orchestration.service.ts`
- **Dependencies**: All imported services and database schemas
- **Impact**: Bet processing reliability, data integrity, security, and user experience
- **Goals**: Eliminate bugs, improve error handling, ensure data accuracy, enhance security, and maintain code quality

### Assumptions
- All fixes must maintain backward compatibility where possible
- Database schema changes require migration scripts
- Testing includes unit, integration, and end-to-end tests
- Performance benchmarks must meet 300ms target for bet processing

## Identified Issues

Issues are prioritized by severity: **Critical** (system crashes, data corruption, security), **High** (functional/reliability issues), **Medium** (edge cases/performance), **Low** (maintainability).

### Critical Issues

#### 1. Incorrect Transaction Statistics Calculation (Data Corruption Risk)
- **Location**: `getBetProcessingStats` (lines 374-427), SQL query (lines 378-385)
- **Description**: SQL assumes `'WIN'` transaction types and `status` field, but `transaction-logging.service.ts` only stores `'BET'`/`'BONUS'` types. `amount` represents `winAmount`, not wager amounts. Leads to zero `totalWon`, incorrect `totalWagered`, and invalid success rates.
- **Evidence**: Cross-reference `transaction-logging.service.ts` line 93 (`type: 'BET'`), line 85 (`amount: winAmount`). No `'WIN'` or `status` field in schema.
- **Impact**: Corrupted analytics, compliance violations, incorrect GGR reporting.

#### 2. Missing Session Expiry Validation (Security Vulnerability)
- **Location**: `validateUserSession` in `bet-validation.service.ts` (lines 128-133)
- **Description**: Session expiry check commented out, allowing bets with expired sessions.
- **Evidence**: `// gte(gameSessions.expiredTime, new Date())` commented. Cross-reference assumes `expiredTime` exists but isn't enforced.
- **Impact**: Unauthorized bets, potential fraud.

#### 3. Inconsistent Balance Type Handling for Mixed Deductions (Runtime Errors)
- **Location**: `processBet` (lines 157-161, 285-287)
- **Description**: `'mixed'` balance type not handled in winnings addition, defaults incorrectly.
- **Evidence**: `balance-management.service.ts` returns `'mixed'` (line 182), but `addWinnings` expects `'real'`/`'bonus'` (line 56). No proportional crediting logic.
- **Impact**: Incorrect balance crediting, user disputes.

#### 4. Incomplete Balance Tracking in Transaction Logging (Data Inaccuracy)
- **Location**: `logTransaction` call (lines 225-251)
- **Description**: `preBonusBalance`/`postBonusBalance` calculations incomplete, ignore conversions.
- **Evidence**: TODO-bets.md notes incompleteness. Cross-reference `balance-management.service.ts` `convertBonusToReal` (lines 295-310) not reflected.
- **Impact**: Inaccurate audit logs, compliance issues.

### High Severity Issues

#### 5. Inconsistent Error Handling Across Service Calls (Reliability Issues)
- **Location**: Various `.catch` blocks in `processBet` (lines 123-127, 138-142, 161-165, 191-194, 203-206, 218-222, 247-251, 267-270)
- **Description**: Error handling varies: some throw, others return defaults, some continue. No global rollback.
- **Evidence**: Jackpot returns zeros (line 126), balance throws (line 141). TODO-bets.md notes commented-out handling.
- **Impact**: Partial bet failures, inconsistent state.

#### 6. Incorrect Final Balance Calculation for Losses (Functional Bug)
- **Location**: `processBet` (lines 172-178)
- **Description**: `totalDeducted` calculation may miss conversions/caps.
- **Evidence**: Cross-reference `balance-management.service.ts` shows conversions (line 132), but calculation only sums direct deductions.
- **Impact**: Wrong displayed balance after losses.

#### 7. Potential Division by Zero in Wagering Progress (Runtime Error)
- **Location**: `wagering.service.ts` (lines 448-453)
- **Description**: Progress calculation assumes positive requirements, no validation for zero.
- **Evidence**: `goalAmount` set in bonuses, but no prevention of zero values.
- **Impact**: NaN in progress, UI errors.

#### 8. Health Check Logic Flaw in Wallet Service (False Positives)
- **Location**: `checkWalletService` (lines 469-488)
- **Description**: Test user assumption may allow false positives if service bugs exist.
- **Evidence**: Checks empty array correctly, but TODO-bets.md suggests potential issues.
- **Impact**: Missed service failures in health checks.

### Medium Severity Issues

#### 9. Hardcoded Performance Threshold (Suboptimal Monitoring)
- **Location**: `processBet` (lines 274-279)
- **Description**: 300ms threshold hardcoded, not configurable.
- **Evidence**: TODO-bets.md notes previous hardcoding. No config reference.
- **Impact**: Inflexible monitoring.

#### 10. Inconsistent Session Validation (Edge Case Handling)
- **Location**: `validateUserSession` vs. `validateGameSession` in `bet-validation.service.ts`
- **Description**: User session lacks status check, unlike game session.
- **Evidence**: `validateGameSession` checks `status = 'ACTIVE'` (line 170), user does not.
- **Impact**: Bets with inactive user sessions.

#### 11. Unmet Preconditions in Wallet Assumption (Edge Case)
- **Location**: `processBet` (lines 112-117)
- **Description**: Assumes `userWallets[0]` is active, no validation for multiple wallets.
- **Evidence**: `getUserWallets` returns all; no active concept in `wallet.service.ts`.
- **Impact**: Wrong wallet usage.

#### 12. Placeholder Code in VIP Calculation (Incomplete Logic)
- **Location**: `calculateXpForWagerAndWins` (lines 129-155)
- **Description**: Hardcoded multiplier, ignores VIP level.
- **Evidence**: `vipMultiplier = 1` (line 138), `currentVIP` param commented.
- **Impact**: Incorrect VIP points scaling.

### Low Severity Issues

#### 13. Commented-Out Code (Maintainability)
- **Location**: Various (e.g., `balance-management.service.ts` lines 324-329)
- **Description**: Dead code clutters codebase.
- **Evidence**: TODO-bets.md mentions commented error handling.
- **Impact**: Reduced readability.

#### 14. Hardcoded Values Without Justification (Configurability)
- **Location**: `validateGameLimits` in `bet-validation.service.ts` (lines 201-202)
- **Description**: Min/max bets hardcoded (100/100000 cents).
- **Evidence**: No config reference; `configuration.service.ts` has limits unused.
- **Impact**: Inflexible limits.

#### 15. Stub Implementations in Health Checks (Incomplete)
- **Location**: Health check functions (e.g., `checkVIPService`)
- **Description**: No real DB checks, placeholders.
- **Evidence**: `getVIPLevels` static, no error handling.
- **Impact**: Missed health issues.

## Proposed Solutions

### Critical Fixes

#### 1. Fix Transaction Statistics
- Update `transaction-logging.service.ts` to store `wagerAmount`, `status`, and add `'WIN'` type.
- Modify SQL in `getBetProcessingStats`:
  ```sql
  totalBets: sql`count(CASE WHEN type IN ('BET', 'BONUS') THEN 1 END)`,
  successfulBets: sql`count(CASE WHEN type IN ('BET', 'BONUS') AND status = 'COMPLETED' THEN 1 END)`,
  totalWagered: sql`coalesce(sum(CASE WHEN type IN ('BET', 'BONUS') THEN wagerAmount ELSE 0 END), 0)`,
  totalWon: sql`coalesce(sum(CASE WHEN type = 'WIN' THEN amount ELSE 0 END), 0)`,
  ```
- Add database migration for new fields.

#### 2. Enable Session Expiry
- Uncomment and fix: `gte(gameSessions.expiredTime, new Date())` in `validateUserSession`.
- Ensure session creation sets `expiredTime` properly.

#### 3. Handle Mixed Balance Types
- In `processBet`, for `'mixed'`:
  ```typescript
  if (balanceDeduction.balanceType === 'mixed') {
    const realRatio = balanceDeduction.deductedFrom.real / totalDeducted;
    const bonusRatio = balanceDeduction.deductedFrom.bonuses.reduce((sum, b) => sum + b.amount, 0) / totalDeducted;
    // Credit proportionally to real and bonus
  }
  ```

#### 4. Improve Balance Tracking
- Pass pre/post balances from `balanceDeduction` result to `logTransaction`.
- Query balances dynamically if needed.

### High Fixes

#### 5. Standardize Error Handling
- Wrap `processBet` in a database transaction.
- Define error handling policy: rollback on critical failures, log and continue on non-critical.

#### 6. Fix Balance Calculation
- Query actual balance after deduction instead of manual calculation.

#### 7. Prevent Division by Zero
- Add validation: `if (requiredWagering <= 0) throw new Error('Invalid wagering requirement');`

#### 8. Improve Health Check
- Use a known test user or mock data. Add balance value validation.

### Medium Fixes

#### 9. Configurable Threshold
- Add `performanceThresholdMs: number` to `configuration.service.ts`.

#### 10. Consistent Validation
- Add status check to `validateUserSession`: `eq(gameSessions.status, 'ACTIVE')`

#### 11. Wallet Validation
- Add active wallet selection logic or enforce single wallet per user.

#### 12. VIP Calculation
- Uncomment `currentVIP` param and implement level lookup.

### Low Fixes

#### 13. Clean Code
- Remove all commented-out code.

#### 14. Configurable Limits
- Use `configurationManager.getConfiguration().limits` in `validateGameLimits`.

#### 15. Complete Health Checks
- Add DB queries and try-catch in health functions.

## Impacted Components

- **Core Services**: `bet-orchestration.service.ts`, `balance-management.service.ts`, `transaction-logging.service.ts`, `bet-validation.service.ts`
- **Supporting Services**: `wallet.service.ts`, `vip.service.ts`, `wagering.service.ts`, `ggr.service.ts`, `jackpot.service.ts`, `realtime-notifications.service.ts`
- **Database**: Schema updates for transactions, sessions, balances
- **Configuration**: `configuration.service.ts` for new settings
- **Testing**: Unit tests for all services, integration tests for bet flow
- **Monitoring**: Health checks, performance metrics

## Test Cases

### Unit Tests
- `processBet` with various balance types (real, bonus, mixed)
- Error scenarios: insufficient balance, expired session, invalid game
- Edge cases: zero win, zero wager, multiple bonuses

### Integration Tests
- Full bet flow with database transactions
- Cross-service interactions (balance + wagering + VIP)
- Health check endpoints

### End-to-End Tests
- User bet placement via API
- Balance updates, notifications, transaction logs
- Performance under load (ensure <300ms)

### Example Test Case
```typescript
describe('processBet - Mixed Balance', () => {
  it('should credit winnings proportionally for mixed deductions', async () => {
    // Setup: user with real and bonus balance
    // Bet: mixed deduction
    // Win: credit proportionally
    // Assert: balances updated correctly
  });
});
```

## Implementation Priorities

1. **Critical** (Week 1): Fix transaction stats, session expiry, mixed balances, balance tracking
2. **High** (Week 2): Standardize error handling, fix balance calc, prevent division by zero, improve health checks
3. **Medium** (Week 3): Configurable threshold, consistent validation, wallet validation, complete VIP calc
4. **Low** (Week 4): Clean code, configurable limits, complete health checks

### Dependencies
- Database migrations must precede code changes
- Configuration updates require admin deployment
- Testing must cover all scenarios before release

### Rollback Plan
- Feature flags for new logic
- Database backup before migrations
- Gradual rollout with monitoring

This PRD ensures a robust, secure, and reliable bet orchestration system. Implementation should follow agile practices with regular reviews.</content>
</write_file>