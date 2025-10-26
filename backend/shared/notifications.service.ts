import { getVIPInfo } from '../features/user/vip.service';
import { getWageringProgress } from '../features/gameplay/wagering.manager';

/**
 * Realtime notification system for WebSocket updates
 * Prioritizes balance changes (<300ms critical) and handles other updates
 */

export interface NotificationPayload {
  type: 'balance' | 'vip' | 'wagering' | 'jackpot' | 'bonus' | 'error';
  priority: 'critical' | 'high' | 'normal';
  data: Record<string, any>;
  timestamp: Date;
  userId: string;
}

export interface BalanceNotification {
  realBalance: number;
  bonusBalance: number;
  totalBalance: number;
  changeAmount: number;
  changeType: 'bet' | 'win' | 'bonus' | 'adjustment';
}

export interface VIPNotification {
  level: number;
  levelName: string;
  totalPoints: number;
  pointsToNextLevel: number;
  progressToNextLevel: number;
  levelUp?: boolean;
  benefits?: string[];
}

export interface WageringNotification {
  overallProgress: number;
  completedBonuses: string[];
  newBonusProgress?: Record<string, number>;
  withdrawalEligible?: boolean;
}

export interface JackpotNotification {
  group: string;
  contribution: number;
  currentPool: number;
  win?: {
    amount: number;
    won: boolean;
  };
}

/**
 * Notification manager for prioritizing and queuing updates
 */
class NotificationManager {
  private notificationQueue: NotificationPayload[] = [];
  private processingQueue = false;
  private websocketConnections: Map<string, WebSocket> = new Map();

  /**
   * Register WebSocket connection for a user
   */
  registerConnection(userId: string, ws: WebSocket): void {
    this.websocketConnections.set(userId, ws);
  }

  /**
   * Unregister WebSocket connection
   */
  unregisterConnection(userId: string): void {
    this.websocketConnections.delete(userId);
  }

  /**
   * Send critical balance notification (<300ms requirement)
   */
  async sendBalanceNotification(userId: string, balanceData: BalanceNotification): Promise<void> {
    const notification: NotificationPayload = {
      type: 'balance',
      priority: 'critical',
      data: balanceData,
      timestamp: new Date(),
      userId,
    };

    // Send immediately for critical balance updates
    await this.sendNotificationImmediate(userId, notification);
  }

  /**
   * Send VIP update notification
   */
  async sendVIPNotification(userId: string, vipData: VIPNotification): Promise<void> {
    const notification: NotificationPayload = {
      type: 'vip',
      priority: 'normal',
      data: vipData,
      timestamp: new Date(),
      userId,
    };

    this.queueNotification(notification);
  }

  /**
   * Send wagering progress notification
   */
  async sendWageringNotification(
    userId: string,
    wageringData: WageringNotification,
  ): Promise<void> {
    const notification: NotificationPayload = {
      type: 'wagering',
      priority: 'normal',
      data: wageringData,
      timestamp: new Date(),
      userId,
    };

    this.queueNotification(notification);
  }

  /**
   * Send jackpot notification
   */
  async sendJackpotNotification(userId: string, jackpotData: JackpotNotification): Promise<void> {
    const notification: NotificationPayload = {
      type: 'jackpot',
      priority: 'high',
      data: jackpotData,
      timestamp: new Date(),
      userId,
    };

    this.queueNotification(notification);
  }

  /**
   * Send error notification
   */
  async sendErrorNotification(userId: string, error: string, code?: string): Promise<void> {
    const notification: NotificationPayload = {
      type: 'error',
      priority: 'high',
      data: {
        message: error,
        code,
      },
      timestamp: new Date(),
      userId,
    };

    this.queueNotification(notification);
  }

  /**
   * Send notification immediately (for critical updates)
   */
  private async sendNotificationImmediate(
    userId: string,
    notification: NotificationPayload,
  ): Promise<void> {
    const ws = this.websocketConnections.get(userId);
    if (ws && ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(JSON.stringify(notification));
      } catch (error) {
        console.error('Failed to send immediate notification:', error);
      }
    }
  }

  /**
   * Queue notification for batch processing
   */
  private queueNotification(notification: NotificationPayload): void {
    this.notificationQueue.push(notification);

    if (!this.processingQueue) {
      this.processNotificationQueue();
    }
  }

  /**
   * Process queued notifications in batches
   */
  private async processNotificationQueue(): Promise<void> {
    if (this.processingQueue || this.notificationQueue.length === 0) {
      return;
    }

    this.processingQueue = true;

    // Process notifications in priority order
    const sortedNotifications = this.notificationQueue.sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, normal: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    // Group notifications by user for batch sending
    const userNotifications = new Map<string, NotificationPayload[]>();

    for (const notification of sortedNotifications) {
      if (!userNotifications.has(notification.userId)) {
        userNotifications.set(notification.userId, []);
      }
      userNotifications.get(notification.userId)!.push(notification);
    }

    // Send batched notifications
    for (const [userId, notifications] of userNotifications) {
      await this.sendBatchedNotifications(userId, notifications);
    }

    // Clear processed notifications
    this.notificationQueue = [];
    this.processingQueue = false;
  }

  /**
   * Send batched notifications to a user
   */
  private async sendBatchedNotifications(
    userId: string,
    notifications: NotificationPayload[],
  ): Promise<void> {
    const ws = this.websocketConnections.get(userId);
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      return;
    }

    try {
      // Group notifications by type for cleaner client handling
      const groupedNotifications = {
        balance: notifications.filter((n) => n.type === 'balance'),
        vip: notifications.filter((n) => n.type === 'vip'),
        wagering: notifications.filter((n) => n.type === 'wagering'),
        jackpot: notifications.filter((n) => n.type === 'jackpot'),
        error: notifications.filter((n) => n.type === 'error'),
      };

      // Send as a single batch update
      const batchUpdate = {
        type: 'batch_update',
        timestamp: new Date(),
        updates: groupedNotifications,
      };

      ws.send(JSON.stringify(batchUpdate));
    } catch (error) {
      console.error('Failed to send batched notifications:', error);
    }
  }
}

// Global notification manager instance
export const notificationManager = new NotificationManager();

/**
 * Send balance update notification (critical priority)
 */
export async function notifyBalanceChange(
  userId: string,
  balanceNotification: BalanceNotification,
): Promise<void> {
  await notificationManager.sendBalanceNotification(userId, balanceNotification);
}

/**
 * Send VIP update notification
 */
export async function notifyVIPUpdate(userId: string): Promise<void> {
  try {
    const vipInfo = await getVIPInfo(userId);
    if (!vipInfo) return;

    const vipNotification: VIPNotification = {
      level: vipInfo.currentLevel,
      levelName: vipInfo.currentLevelName,
      totalPoints: vipInfo.totalPoints,
      pointsToNextLevel: vipInfo.pointsToNextLevel,
      progressToNextLevel: vipInfo.progressToNextLevel,
      levelUp: false, // Would be determined by comparing with previous state
      benefits: Object.entries(vipInfo.levelBenefits)
        .filter(([, enabled]) => enabled)
        .map(([benefit]) => benefit),
    };

    await notificationManager.sendVIPNotification(userId, vipNotification);
  } catch (error) {
    console.error('VIP notification failed:', error);
  }
}

/**
 * Send wagering progress notification
 */
export async function notifyWageringUpdate(userId: string): Promise<void> {
  try {
    const wageringProgress = await getWageringProgress(userId);

    const wageringNotification: WageringNotification = {
      overallProgress: wageringProgress.overallProgress,
      completedBonuses: wageringProgress.bonusRequirements
        .filter((req) => req.completed)
        .map((req) => req.id),
      newBonusProgress: Object.fromEntries(
        wageringProgress.bonusRequirements.map((req) => [req.id, req.progress]),
      ),
      withdrawalEligible: wageringProgress.bonusRequirements.every((req) => req.completed),
    };

    await notificationManager.sendWageringNotification(userId, wageringNotification);
  } catch (error) {
    console.error('Wagering notification failed:', error);
  }
}

/**
 * Send jackpot update notification
 */
export async function notifyJackpotUpdate(
  userId: string,
  jackpotNotification: JackpotNotification,
): Promise<void> {
  await notificationManager.sendJackpotNotification(userId, jackpotNotification);
}

/**
 * Send error notification
 */
export async function notifyError(userId: string, error: string, code?: string): Promise<void> {
  await notificationManager.sendErrorNotification(userId, error, code);
}

/**
 * Send comprehensive post-bet notification bundle
 */
export async function sendPostBetNotifications(
  userId: string,
  betData: {
    balanceChange: BalanceNotification;
    vipUpdate?: boolean;
    wageringUpdate?: boolean;
    jackpotContribution?: number;
  },
): Promise<void> {
  // Send critical balance update immediately
  await notifyBalanceChange(userId, betData.balanceChange);

  // Queue other updates for near real-time processing
  if (betData.vipUpdate) {
    setTimeout(() => notifyVIPUpdate(userId), 100); // 100ms delay for near real-time
  }

  if (betData.wageringUpdate) {
    setTimeout(() => notifyWageringUpdate(userId), 150); // 150ms delay
  }

  if (betData.jackpotContribution && betData.jackpotContribution > 0) {
    const jackpotNotification: JackpotNotification = {
      group: 'minor', // Would be determined by game configuration
      contribution: betData.jackpotContribution,
      currentPool: 0, // Would come from jackpot service
    };

    setTimeout(() => notifyJackpotUpdate(userId, jackpotNotification), 200);
  }
}

/**
 * Register WebSocket connection for notifications
 */
export function registerNotificationConnection(userId: string, ws: WebSocket): void {
  notificationManager.registerConnection(userId, ws);
}

/**
 * Unregister WebSocket connection
 */
export function unregisterNotificationConnection(userId: string): void {
  notificationManager.unregisterConnection(userId);
}

/**
 * WebSocket message handler for notification registration
 */
export function handleNotificationWebSocketMessage(
  userId: string,
  message: any,
  ws: WebSocket,
): void {
  if (message.type === 'register_notifications') {
    registerNotificationConnection(userId, ws);
  } else if (message.type === 'unregister_notifications') {
    unregisterNotificationConnection(userId);
  }
}
