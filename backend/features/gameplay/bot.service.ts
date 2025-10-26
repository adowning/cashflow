import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import db from '@/database';
import { players } from '@/database/schema/core.schema';
import { processBet } from '@/features/gameplay/bet-orchestration.service';
import { auth } from '@/lib/auth';
import { users } from '@/database/schema/auth.schema';

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
  private sessionToken: string | null = null;
  private isRunning = false;
  private intervalId: NodeJS.Timeout | null = null;
  private config: BotConfig;

  constructor(config: Partial<BotConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  async initialize() {
    try {
      const botUsername = 'automated-bot';
      const botPassword = process.env.BOT_PASSWORD || 'secure-bot-password';
      const botEmail = 'bot@example.com';

      // Check if bot user exists
      let user = await db.query.users.findFirst({
        where: eq(users.username, botUsername),
      });

      if (!user) {
        // Create bot user through auth system
        console.log('Creating bot user...');
        const signUpResult = await auth.api.signUpEmail({
          body: {
            username: botUsername,
            password: botPassword,
            email: botEmail,
            name: 'Automated Bot',
          },
        });

        if (!signUpResult.user) {
          throw new Error('Failed to create bot user');
        }

        user = signUpResult.user;
        console.log('Bot user created successfully');
      }

      // Ensure player record exists (should be created by auth hook, but double-check)
      let player = await db.query.players.findFirst({
        where: eq(players.id, user.id),
      });

      if (!player) {
        throw new Error('Player record not found for bot user');
      }

      this.playerId = player.id;

      // Sign in to get session
      const signInResult = await auth.api.signInUsername({
        body: {
          username: botUsername,
          password: botPassword,
        },
      });

      if (!signInResult.token) {
        throw new Error('Failed to sign in bot user');
      }

      this.sessionToken = signInResult.token;
      console.log('Bot authenticated successfully');

      return true;
    } catch (error) {
      console.error('Failed to initialize bot:', error);
      return false;
    }
  }

  private async placeBet() {
    if (!this.playerId || !this.sessionToken) {
      console.error('Bot not initialized or authenticated');
      return null;
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
        operatorId: 'default', // Add operator for bet processing
      };

      // Simulate game outcome (in a real scenario, this would come from the game engine)
      const gameOutcome = {
        winAmount: Math.random() > 0.5 ? wagerAmount * 0.8 : 0, // 50% chance to win 80% of wager
        gameData: {},
      };

      const result = await processBet(betRequest, gameOutcome);

      if (result.success) {
        console.log(
          `✅ Bet placed: $${(wagerAmount / 100).toFixed(2)}, Won: $${(result.winAmount / 100).toFixed(2)}`,
        );
      } else {
        console.error(`❌ Bet failed: ${result.error}`);
      }

      return result;
    } catch (error) {
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
    this.sessionToken = null; // Clear session on stop
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
