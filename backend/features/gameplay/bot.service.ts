import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import db from '@/database';
import { players, gameSessions } from '@/database/schema';
import { processBet, type BetRequest } from '@/features/gameplay/bet-orchestration.service';
import { auth } from '@/lib/auth';
import { users } from '@/database/schema/auth.schema';
import { nanoid } from '@/lib/utils/nanoid';
//@ts-ignore
import { randNumber } from '@ngneat/falso';
import { getOrCreateBalance } from './balance-management.service';
import {
  initiateDeposit,
  PaymentMethod,
  processDepositConfirmation,
} from '../payments/deposit.service';
import { createId } from '@paralleldrive/cuid2';

interface BotConfig {
  betInterval: number; // in milliseconds
  minWager: number; // in cents
  maxWager: number; // in cents
  gameName: string | null;
}

const DEFAULT_CONFIG: BotConfig = {
  betInterval: 5000, // 5 seconds
  minWager: 100, // $1.00
  maxWager: 1000, // $10.00
  gameName: null,
};

class BotService {
  private playerId: string | null = null;
  private sessionToken: string | null = null;
  private isRunning = false;
  private intervalId: NodeJS.Timeout | null = null;
  private config: BotConfig;
  private gameName: string | null = null;
  private gameId: string | null = null;

  constructor(config: Partial<BotConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  async initialize() {
    try {
      const botUsername = 'AutomatedBot';
      const botPassword = process.env.BOT_PASSWORD || 'secure-bot-password';
      const botEmail = 'bot@example.com';
      let allGames = await db.query.games.findMany();

      // Fix: Use allGames.length instead of hardcoded 100 to prevent index out of bounds
      if (allGames.length === 0) {
        throw new Error('No games available for bot initialization');
      }
      const game = allGames[Math.floor(Math.random() * allGames.length)];
      console.log(game);
      this.gameName = game.name;
      this.gameId = game.id;

      // Fix: Single user check by username or email
      let user = await db.query.users.findFirst({
        where: eq(users.username, botUsername),
      });

      if (!user) {
        user = await db.query.users.findFirst({
          where: eq(users.email, botEmail),
        });
      }

      console.log(`[BOT DEBUG] Checking for bot user: ${botUsername}, found: ${!!user}`);

      if (!user) {
        // Create bot user through auth system
        console.log('Creating bot user...');
        const signUpResult = await auth.api.signUpEmail({
          body: {
            username: botUsername,
            password: botPassword,
            email: botEmail,
            name: 'AutomatedBot',
          },
        });
        if (!signUpResult.user) {
          throw new Error('Failed to create bot user');
        }
        // Query the user from the database to get the full record
        user = await db.query.users.findFirst({
          where: eq(users.id, signUpResult.user.id),
        });
        console.log('Bot user created successfully');
      }

      // Ensure user is defined (TypeScript safety)
      if (!user) {
        throw new Error('Failed to find or create bot user');
      }

      // Ensure player record exists, create if missing
      let player = await db.query.players.findFirst({
        where: eq(players.id, user.id),
      });
      if (!user.id) throw new Error('no user id');
      if (!player) {
        // Create player record if it doesn't exist
        console.log('Creating player record for bot user...');
        await db.insert(players).values({
          id: user.id,
          playername: botUsername,
          // email: botEmail,
          status: 'ACTIVE',
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        player = await db.query.players.findFirst({
          where: eq(players.id, user.id),
        });
        if (!player) {
          throw new Error('Failed to create player record for bot user');
        }
        console.log('Player record created successfully');
      }

      this.playerId = player.id;
      console.log('this game id -', this.gameId);
      const sessionData: typeof gameSessions.$inferInsert = {
        id: createId(),
        playerId: this.playerId,
        authSessionId: this.playerId as string,
        status: 'ACTIVE',
        gameName: this.gameName,
        gameId: this.gameId,
        createdAt: new Date(),
        expiredTime: new Date(new Date().getTime() + randNumber({ min: 60000, max: 3600000 })),
      };

      // Check for existing session before creating new one
      const existingSession = await db.query.gameSessions.findFirst({
        where: eq(gameSessions.playerId, this.playerId),
      });

      if (!existingSession) {
        await db.insert(gameSessions).values(sessionData);
      } else {
        this.gameId = existingSession.gameId;
        this.gameName = existingSession.gameName;
      }

      // Fix: Single sign-in call
      const signInResult = await auth.api.signInUsername({
        body: { username: botUsername, password: botPassword },
      });
      if (!signInResult || !signInResult.token) {
        throw new Error('Failed to sign in bot user');
      }

      this.sessionToken = signInResult.token;
      console.log('[BOT SUCCESS] Bot authenticated successfully, session token obtained');

      return true;
    } catch (error) {
      console.error('Failed to initialize bot:', error);
      return false;
    }
  }

  private async makeDeposit(amount: number): Promise<any> {
    if (!this.playerId || !this.sessionToken || !this.gameName) {
      console.error('Bot not initialized or authenticated');
      return null;
    }
    let playerBalance = await getOrCreateBalance(this.playerId);

    console.log('[BOT DEBUG] deposit initiated');
    const { success, depositId, error } = await initiateDeposit({
      userId: this.playerId,
      amount: amount,
      bonusAmount: 0,
      paymentMethod: PaymentMethod.CASHAPP,
    });
    console.log('depositId: ', depositId);
    if (!success) throw new Error(error);
    if (!depositId) throw new Error('Deposit not initiated');

    const result = await processDepositConfirmation({
      transactionId: depositId,
      amount: amount,
      senderInfo: 'bot',
      timestamp: new Date(),
      playerId: this.playerId,
    });
    if (!result.success) throw new Error('Deposit confirmation failed');

    console.log('[BOT DEBUG] deposit confirmed');
    playerBalance = await getOrCreateBalance(this.playerId);
    console.log('[BOT DEBUG] playerBalance after deposit: ', playerBalance);

    if (
      !playerBalance ||
      playerBalance.realBalance + playerBalance.bonusBalance < this.config.maxWager
    ) {
      throw new Error('Insufficient balance after deposit');
    }

    return playerBalance;
  }

  private async placeBet() {
    if (!this.playerId || !this.sessionToken || !this.gameId) {
      console.error('Bot not initialized or authenticated');
      return null;
    }

    let playerBalance = await getOrCreateBalance(this.playerId);
    console.log(
      '[BOT DEBUG] playerBalance original totalBalance: ',
      playerBalance.realBalance + playerBalance.bonusBalance,
    );

    if (!playerBalance) throw new Error('No balance found');

    // Deposit if balance is low
    if (playerBalance.realBalance + playerBalance.bonusBalance < this.config.maxWager) {
      console.log('[BOT DEBUG] deposit initiated');
      playerBalance = await this.makeDeposit(50000);
    }

    let max = Math.min(
      playerBalance.realBalance + playerBalance.bonusBalance,
      this.config.maxWager,
    );
    try {
      const wagerAmount = Math.floor(
        Math.random() * (max - this.config.minWager + 1) + this.config.minWager,
      );
      const betRequest: BetRequest = {
        userId: this.playerId,
        gameId: this.gameId,
        wagerAmount: 500,
        sessionId: uuidv4(),
        operatorId: 'default',
      };

      // Simulate game outcome
      const gameOutcome = {
        winAmount: Math.random() > 0.5 ? wagerAmount * 0.8 : 0,
        gameData: {},
      };

      const result = await processBet(betRequest, gameOutcome);

      if (result.success) {
        console.log(
          `[BOT BET SUCCESS] Bet processed: wager $${(wagerAmount / 100).toFixed(2)}, win $${(result.winAmount / 100).toFixed(2)}, session: ${betRequest.sessionId}`,
        );
      } else {
        console.error(
          `[BOT BET ERROR] Bet failed: ${result.error}, wager: $${(wagerAmount / 100).toFixed(2)}, session: ${betRequest.sessionId}`,
        );
        if (result.error?.startsWith('Insufficient balance.')) {
          await this.makeDeposit(50000);
        }
      }

      return result;
    } catch (error: any) {
      console.error('Error placing bet:', error);

      // Attempt to recover from authentication errors
      if (
        error.message?.includes('session expired') ||
        error.message?.includes('not authenticated') ||
        error.message?.includes('unauthorized')
      ) {
        console.log('Session expired, reinitializing bot...');
        await this.initialize();
      }

      return null;
    }
  }

  async start() {
    if (this.isRunning) {
      console.log('Bot is already running');
      return;
    }

    // Ensure bot is initialized before starting
    if (!this.playerId) {
      console.log('Initializing bot before starting...');
      const initialized = await this.initialize();
      if (!initialized) {
        console.error('Failed to initialize bot, cannot start');
        return;
      }
    }

    this.isRunning = true;
    console.log('[BOT START] Starting automated betting bot with 5-second intervals...');
    // Initial bet
    this.placeBet().catch(console.error);

    // Set up interval for subsequent bets
    console.log(`[BOT INTERVAL] Setting up betting interval: ${this.config.betInterval}ms`);
    this.intervalId = setInterval(() => {
      if (this.isRunning) {
        const timestamp = new Date().toISOString();
        console.log(`[BOT INTERVAL] ${timestamp} - Placing scheduled bet...`);
        this.placeBet().catch(console.error);
      }
    }, this.config.betInterval);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    this.sessionToken = null;
    console.log('Stopped automated betting bot');
  }

  updateConfig(newConfig: Partial<BotConfig>) {
    this.config = { ...this.config, ...newConfig };

    // Restart the interval if running with new timing
    if (this.isRunning && newConfig.betInterval) {
      this.stop();
      this.start();
    }
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      playerId: this.playerId,
      sessionToken: this.sessionToken ? 'active' : 'none',
      config: this.config,
    };
  }
}

// Singleton instance
export const botService = new BotService();

export async function startManufacturedGameplay(config: Partial<BotConfig> = {}) {
  try {
    if (config) {
      botService.updateConfig(config);
    }

    await botService.start();
  } catch (error) {
    console.error('Error starting manufactured gameplay:', error);
  }
}

export function stopManufacturedGameplay() {
  botService.stop();
}
