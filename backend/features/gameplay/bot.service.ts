import { eq, and } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import db from '@/database';
import { playerBalances } from '@/database/schema/views.schema';
import { players } from '@/database/schema/auth.schema';
import { processBet } from '@/features/gameplay/bet-orchestration.service';
import { auth } from '@/lib/auth';
import { createBalanceForNewUser } from './balance-management.service';

interface BotConfig {
  betInterval: number; // in milliseconds
  minWager: number; // in cents
  maxWager: number; // in cents
  gameId: string;
}

const DEFAULT_CONFIG: BotConfig = {
  betInterval: 5000, // 5 seconds
  minWager: 100, // $1.00
  maxWager: 1000, // $10.00
  gameId: 'slot-demo-1',
};

class BotService {
  private playerId: string | null = null;
  private isRunning = false;
  private intervalId: NodeJS.Timeout | null = null;
  private config: BotConfig;

  constructor(config: Partial<BotConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  async initialize() {
    try {
      // Find or create a bot player
      const botEmail = 'bot@example.com';
      let player = await db.query.players.findFirst({
        where: eq(players.email, botEmail),
      });

      if (!player) {
        // Create a new bot player
        const newPlayer = await db
          .insert(players)
          .values({
            email: botEmail,
            name: 'automated-bot',
            isBot: true,
            // Add other required fields for your player schema
          })
          .returning();
        player = newPlayer[0];
        await createBalanceForNewUser(player.id);
      }

      this.playerId = player.id;

      // Log in the bot
      await auth.api.signInUsername({
        username: 'automated-bot',
        password: process.env.BOT_PASSWORD || 'secure-bot-password',
      });

      return true;
    } catch (error) {
      console.error('Failed to initialize bot:', error);
      return false;
    }
  }

  private async placeBet() {
    if (!this.playerId) {
      console.error('Bot not initialized');
      return;
    }

    try {
      const wagerAmount = Math.floor(
        Math.random() * (this.config.maxWager - this.config.minWager + 1) + this.config.minWager,
      );

      const betRequest = {
        userId: this.playerId,
        gameId: this.config.gameId,
        wagerAmount,
        sessionId: uuidv4(),
      };

      // Simulate game outcome (in a real scenario, this would come from the game engine)
      const gameOutcome = {
        winAmount: Math.random() > 0.5 ? wagerAmount * 0.8 : 0, // 50% chance to win 80% of wager
        gameData: {},
      };

      const result = await processBet(betRequest, gameOutcome);
      console.log(
        `Bet placed: $${(wagerAmount / 100).toFixed(2)}, Won: $${(result.winAmount / 100).toFixed(2)}`,
      );

      return result;
    } catch (error) {
      console.error('Error placing bet:', error);
      // Attempt to recover from common errors
      if (
        error.message.includes('session expired') ||
        error.message.includes('not authenticated')
      ) {
        console.log('Session expired, reinitializing bot...');
        await this.initialize();
      }
      return null;
    }
  }

  start() {
    if (this.isRunning) {
      console.log('Bot is already running');
      return;
    }

    this.isRunning = true;
    console.log('Starting automated betting bot...');

    // Initial bet
    this.placeBet().catch(console.error);

    // Set up interval for subsequent bets
    this.intervalId = setInterval(() => {
      if (this.isRunning) {
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
}

// Singleton instance
export const botService = new BotService();

export async function startManufacturedGameplay(config: Partial<BotConfig> = {}) {
  try {
    if (config) {
      botService.updateConfig(config);
    }

    const initialized = await botService.initialize();
    if (initialized) {
      botService.start();
    } else {
      console.error('Failed to initialize bot service');
    }
  } catch (error) {
    console.error('Error starting manufactured gameplay:', error);
  }
}

export function stopManufacturedGameplay() {
  botService.stop();
}
