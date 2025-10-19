/**
 * Client-side Broadcasting SDK
 *
 * A TypeScript/JavaScript client library for connecting to the broadcasting server
 */

import { User } from "better-auth/*"

// import { any } from "d3"

// import { any } from "d3"

export interface BroadcastClientConfig
{
  broadcaster: 'bun' | 'reverb' | 'pusher' | 'ably'
  host?: string
  port?: number
  token: string
  scheme?: 'ws' | 'wss'
  key?: string
  cluster?: string
  encrypted?: boolean
  auth?: {
    headers?: Record<string, string>
    endpoint?: string
  }
  autoConnect?: boolean
  reconnect?: boolean
  autoReconnect?: boolean // Alias for reconnect
  reconnectDelay?: number
  reconnectInterval?: number // Alias for reconnectDelay
  maxReconnectAttempts?: number
  // New features
  encryption?: {
    enabled?: boolean
    keys?: Record<string, string> // channel -> key
  }
  acknowledgments?: {
    enabled?: boolean
    timeout?: number
  }
  batch?: {
    enabled?: boolean
    maxBatchSize?: number
  }
  heartbeat?: {
    enabled?: boolean
    interval?: number // Send heartbeat interval in ms
  }
  offlineQueue?: {
    enabled?: boolean
    maxSize?: number
  }
}

export type EventCallback<T = any> = (data: T) => void;

export interface ChannelCallbacks
{
  subscription_succeeded?: (data: any) => void
  subscription_error?: (error: any) => void
  [event: string]: EventCallback | undefined
}

export interface PresenceChannelCallbacks extends ChannelCallbacks
{
  here?: (members: any[]) => void
  joining?: (member: any) => void
  leaving?: (member: any) => void
  error?: (error: any) => void
}

export interface PendingAcknowledgment
{
  messageId: string
  resolve: (value: boolean) => void
  reject: (reason: Error) => void
  timeout: any
}

/**
 * Connector class for managing WebSocket connection events
 */
export class Connector
{
  private eventCallbacks: Map<string, Set<EventCallback>> = new Map();

  on(event: string, callback: EventCallback): void
  {
    if (!this.eventCallbacks.has(event)) {
      this.eventCallbacks.set(event, new Set());
    }
    this.eventCallbacks.get(event)!.add(callback);
  }

  off(event: string, callback?: EventCallback): void
  {
    if (!callback) {
      this.eventCallbacks.delete(event);
    }
    else {
      this.eventCallbacks.get(event)?.delete(callback);
    }
  }

  emit(event: string, data?: any): void
  {
    const callbacks = this.eventCallbacks.get(event);
    if (callbacks) {
      for (const callback of callbacks) {
        callback(data);
      }
    }
  }
}

export class BroadcastClient
{
  private ws: WebSocket | null = null;
  private config: Required<BroadcastClientConfig>;
  private channels: Map<string, ChannelInstance> = new Map();
  private _socketId: string | null = null;
  private reconnectAttempts = 0;
  private reconnectany: any | null = null;
  private messageQueue: Array<{ message: string, ack?: boolean, messageId?: string }> = [];
  private heartbeatany: any | null = null;
  private pendingAcks: Map<string, PendingAcknowledgment> = new Map();
  private encryptionKeys: Map<string, string> = new Map();
  public connector: Connector = new Connector();
  public token: string
  public user: User

  constructor(config: BroadcastClientConfig)
  {
    this.token = config.token
    this.config = {
      token: config.token,
      broadcaster: config.broadcaster || 'bun',
      host: config.host || 'localhost',
      port: config.port || 6001,
      scheme: config.scheme || 'ws',
      key: config.key || '',
      cluster: config.cluster || '',
      encrypted: config.encrypted ?? false,
      auth: config.auth || {},
      autoConnect: config.autoConnect ?? true,
      reconnect: (config.reconnect ?? config.autoReconnect) ?? true,
      autoReconnect: (config.autoReconnect ?? config.reconnect) ?? true,
      reconnectDelay: (config.reconnectDelay ?? config.reconnectInterval) || 1000,
      reconnectInterval: (config.reconnectInterval ?? config.reconnectDelay) || 1000,
      maxReconnectAttempts: config.maxReconnectAttempts || 10,
      encryption: {
        enabled: config.encryption?.enabled ?? false,
        keys: config.encryption?.keys || {},
      },
      acknowledgments: {
        enabled: config.acknowledgments?.enabled ?? false,
        timeout: config.acknowledgments?.timeout || 5000,
      },
      batch: {
        enabled: config.batch?.enabled ?? true,
        maxBatchSize: config.batch?.maxBatchSize || 50,
      },
      heartbeat: {
        enabled: config.heartbeat?.enabled ?? false,
        interval: config.heartbeat?.interval || 30000,
      },
      offlineQueue: {
        enabled: config.offlineQueue?.enabled ?? true,
        maxSize: config.offlineQueue?.maxSize || 100,
      },
    };

    // Set encryption keys
    if (this.config.encryption.enabled && this.config.encryption.keys) {
      for (const [channel, key] of Object.entries(this.config.encryption.keys)) {
        this.encryptionKeys.set(channel, key);
      }
    }

    if (this.config.autoConnect) {
      this.connect();
    }
  }

  /**
   * Connect to the WebSocket server
   */
  connect(): void
  {
    if (this.ws?.readyState === WebSocket.OPEN) {
      return;
    }

    const url = `${this.config.scheme}://${this.config.host}:${this.config.port}/ws?token=${this.token}`;
    this.ws = new WebSocket(url);

    this.ws.onopen = () =>
    {
      this.reconnectAttempts = 0;

      // Emit connect event
      this.connector.emit('connect');

      // Start heartbeat if enabled
      if (this.config.heartbeat.enabled) {
        this.startHeartbeat();
      }

      // Flush message queue
      while (this.messageQueue.length > 0) {
        const item = this.messageQueue.shift();
        if (item) {
          this.ws?.send(item.message);

          // Re-register acknowledgment if needed
          if (item.ack && item.messageId) {
            this.waitForAck(item.messageId);
          }
        }
      }
    };

    this.ws.onmessage = (event) =>
    {
      this.handleMessage(event.data);
    };

    this.ws.onclose = () =>
    {
      this._socketId = null;
      this.stopHeartbeat();

      // Emit disconnect event
      this.connector.emit('disconnect');

      if (this.config.reconnect && this.reconnectAttempts < this.config.maxReconnectAttempts) {
        this.reconnectAttempts++;
        const delay = Math.min(this.config.reconnectDelay * 2 ** (this.reconnectAttempts - 1), 30000);
        this.reconnectany = setTimeout(() => this.connect(), delay);
      }
    };

    this.ws.onerror = (error) =>
    {
      // Emit error event
      this.connector.emit('error', error);
      console.error('WebSocket error:', error);
    };
  }

  /**
   * Disconnect from the WebSocket server
   */
  disconnect(): void
  {
    if (this.reconnectany) {
      clearTimeout(this.reconnectany);
      this.reconnectany = null;
    }

    this.stopHeartbeat();

    // Clear pending acknowledgments
    for (const pending of this.pendingAcks.values()) {
      clearTimeout(pending.timeout);
      pending.reject(new Error('Connection closed'));
    }
    this.pendingAcks.clear();

    // Unsubscribe from all channels
    for (const channel of this.channels.values()) {
      channel.unsubscribe();
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.channels.clear();
    this._socketId = null;
  }

  /**
   * Check if connected to the server
   */
  isConnected(): boolean
  {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  /**
   * Get the socket ID
   */
  socketId(): string | null
  {
    return this._socketId;
  }

  /**
   * Listen on a public channel
   */
  channel<T = any>(channelName: string): PublicChannel<T>
  {
    if (!this.channels.has(channelName)) {
      const channel = new PublicChannel<T>(this, channelName);
      this.channels.set(channelName, channel as any);
      channel.subscribe();
    }

    return this.channels.get(channelName) as unknown as PublicChannel<T>;
  }

  /**
   * Listen on a private channel
   */
  private<T = any>(channelName: string): PrivateChannel<T>
  {
    const fullName = channelName.startsWith('private-') ? channelName : `private-${channelName}`;

    if (!this.channels.has(fullName)) {
      const channel = new PrivateChannel<T>(this, fullName);
      this.channels.set(fullName, channel as any);
      channel.subscribe();
    }

    return this.channels.get(fullName) as unknown as PrivateChannel<T>;
  }

  /**
   * Join a presence channel
   */
  join<T = any>(channelName: string): PresenceChannel<T>
  {
    const fullName = channelName.startsWith('presence-') ? channelName : `presence-${channelName}`;

    if (!this.channels.has(fullName)) {
      const channel = new PresenceChannel<T>(this, fullName);
      this.channels.set(fullName, channel as any);
      channel.subscribe();
    }

    return this.channels.get(fullName) as unknown as PresenceChannel<T>;
  }

  /**
   * Leave a channel
   */
  leave(channelName: string): void
  {
    const channel = this.channels.get(channelName);
    if (channel) {
      channel.unsubscribe();
      this.channels.delete(channelName);
    }
  }

  /**
   * Leave all channels
   */
  leaveAll(): void
  {
    for (const channel of this.channels.values()) {
      channel.unsubscribe();
    }
    this.channels.clear();
  }

  /**
   * Batch subscribe to multiple channels
   */
  async batchSubscribe(
    channelNames: string[],
    channelData?: Record<string, unknown>,
  ): Promise<{ succeeded: string[], failed: Record<string, string> }>
  {
    if (!this.config.batch?.enabled) {
      throw new Error('Batch operations are disabled');
    }

    if (channelNames.length > (this.config.batch?.maxBatchSize ?? 50)) {
      throw new Error(`Batch size exceeds maximum: ${channelNames.length} > ${this.config.batch.maxBatchSize}`);
    }

    return new Promise((resolve, reject) =>
    {
      const messageId = crypto.randomUUID();

      this.send({
        event: 'batch_subscribe',
        channels: channelNames,
        channelData,
        messageId,
      });

      // Wait for response
      const timeout = setTimeout(() =>
      {
        reject(new Error('Batch subscribe timeout'));
      }, 10000);

      const handler = (data: any) =>
      {
        if (data?.messageId === messageId) {
          clearTimeout(timeout);
          resolve(data);
        }
      };

      // Temporarily listen for result
      this.listen('batch_subscribe_result', handler);
    });
  }

  /**
   * Batch unsubscribe from multiple channels
   */
  async batchUnsubscribe(
    channelNames: string[],
  ): Promise<{ succeeded: string[], failed: Record<string, string> }>
  {
    if (!this.config.batch?.enabled) {
      throw new Error('Batch operations are disabled');
    }

    if (channelNames.length > (this.config.batch?.maxBatchSize ?? 50)) {
      throw new Error(`Batch size exceeds maximum: ${channelNames.length} > ${this.config.batch.maxBatchSize}`);
    }

    return new Promise((resolve, reject) =>
    {
      const messageId = crypto.randomUUID();

      this.send({
        event: 'batch_unsubscribe',
        channels: channelNames,
        messageId,
      });

      // Wait for response
      const timeout = setTimeout(() =>
      {
        reject(new Error('Batch unsubscribe timeout'));
      }, 10000);

      const handler = (data: any) =>
      {
        if (data?.messageId === messageId) {
          clearTimeout(timeout);
          resolve(data);
        }
      };

      // Temporarily listen for result
      this.listen('batch_unsubscribe_result', handler);
    });
  }

  /**
   * Get the socket ID (deprecated, use socketId() instead)
   */
  getSocketId(): string | null
  {
    return this._socketId;
  }

  /**
   * Set encryption key for a channel
   */
  setEncryptionKey(channel: string, key: string): void
  {
    this.encryptionKeys.set(channel, key);
  }
  /**
   * Set encryption key for a channel
   */
  public setToken(token: string,): void
  {
    this.token = token //.set(channel, key);
  }
  public setUser(user: User,): void
  {
    this.user = user //.set(channel, key);
  }
  /**
   * Get encryption key for a channel
   */
  getEncryptionKey(channel: string): string | undefined
  {
    return this.encryptionKeys.get(channel);
  }

  /**
   * Send a message with optional acknowledgment
   */
  async sendWithAck(message: object, requireAck = false): Promise<boolean>
  {
    if (!requireAck || !this.config.acknowledgments.enabled) {
      this.send(message);
      return Promise.resolve(true);
    }

    const messageId = crypto.randomUUID();
    const messageWithId = { ...message, messageId, ack: true };

    return new Promise((resolve, reject) =>
    {
      this.send(messageWithId);

      // Wait for acknowledgment
      this.waitForAck(messageId).then(resolve).catch(reject);
    });
  }

  /**
   * Wait for message acknowledgment
   */
  private waitForAck(messageId: string): Promise<boolean>
  {
    return new Promise((resolve, reject) =>
    {
      const timeout = setTimeout(() =>
      {
        this.pendingAcks.delete(messageId);
        reject(new Error(`Acknowledgment timeout for message ${messageId}`));
      }, this.config.acknowledgments.timeout);

      this.pendingAcks.set(messageId, {
        messageId,
        resolve,
        reject,
        timeout,
      });
    });
  }

  /**
   * Handle acknowledgment from server
   */
  private handleAck(messageId: string): void
  {
    const pending = this.pendingAcks.get(messageId);
    if (pending) {
      clearTimeout(pending.timeout);
      pending.resolve(true);
      this.pendingAcks.delete(messageId);
    }
  }

  /**
   * Start heartbeat timer
   */
  private startHeartbeat(): void
  {
    if (this.heartbeatany) {
      return;
    }

    this.heartbeatany = setInterval(() =>
    {
      this.send({
        event: 'heartbeat',
        timestamp: Date.now(),
      });
    }, this.config.heartbeat.interval);
  }

  /**
   * Stop heartbeat timer
   */
  private stopHeartbeat(): void
  {
    if (this.heartbeatany) {
      clearInterval(this.heartbeatany);
      this.heartbeatany = null;
    }
  }

  /**
   * Listen for global events
   */
  private globalCallbacks: Map<string, Set<EventCallback>> = new Map();

  listen(event: string, callback: EventCallback): void
  {
    if (!this.globalCallbacks.has(event)) {
      this.globalCallbacks.set(event, new Set());
    }
    this.globalCallbacks.get(event)!.add(callback);
  }

  /**
   * Stop listening for global events
   */
  stopListening(event: string, callback?: EventCallback): void
  {
    if (!callback) {
      this.globalCallbacks.delete(event);
    }
    else {
      this.globalCallbacks.get(event)?.delete(callback);
    }
  }

  /**
   * Send a message to the server
   */
  send(message: object): void
  {
    const data = JSON.stringify(message);

    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(data);
    }
    else if (this.config.offlineQueue?.enabled) {
      // Queue message for later
      if (this.messageQueue.length < (this.config.offlineQueue.maxSize ?? 100)) {
        this.messageQueue.push({ message: data });
      }
      else {
        console.warn('Message queue is full, dropping message');
      }
    }
  }

  /**
   * Handle incoming messages from server
   */
  private handleMessage(data: string): void
  {
    try {
      const message = JSON.parse(data);

      // Handle connection established
      if (message.event === 'connection_established') {
        this._socketId = message.data.socket_id;
        return;
      }

      // Handle acknowledgment
      if (message.event === 'ack' && message.messageId) {
        this.handleAck(message.messageId);
        return;
      }

      // Handle global events (batch results, etc.)
      const globalCallbacks = this.globalCallbacks.get(message.event);
      if (globalCallbacks) {
        for (const callback of globalCallbacks) {
          callback(message.data);
        }
      }

      // Route message to appropriate channel
      if (message.channel) {
        const channel = this.channels.get(message.channel);
        if (channel) {
          channel.handleEvent(message.event, message.data);
        }
      }
    }
    catch (error) {
      console.error('Error parsing message:', error);
    }
  }
}

/**
 * Base channel class
 */
export abstract class ChannelInstance<T = any>
{
  protected client: BroadcastClient;
  protected name: string;
  protected callbacks: Map<string, Set<EventCallback<T>>> = new Map();
  public isSubscribed = false;

  constructor(client: BroadcastClient, name: string)
  {
    this.client = client;
    this.name = name;
  }

  /**
   * Subscribe to the channel
   */
  subscribe(): void
  {
    if (this.isSubscribed) {
      return;
    }

    this.client.send({
      event: 'subscribe',
      channel: this.name,
    });

    // Don't set isSubscribed = true here, wait for subscription_succeeded
  }

  /**
   * Unsubscribe from the channel
   */
  unsubscribe(): void
  {
    if (!this.isSubscribed) {
      return;
    }

    this.client.send({
      event: 'unsubscribe',
      channel: this.name,
    });

    this.isSubscribed = false;
    this.callbacks.clear();
  }

  /**
   * Listen for an event
   */
  listen(event: string, callback: EventCallback<T>): this
  {
    if (!this.callbacks.has(event)) {
      this.callbacks.set(event, new Set());
    }

    this.callbacks.get(event)!.add(callback);
    return this;
  }

  /**
   * Stop listening for an event
   */
  stopListening(event: string, callback?: EventCallback<T>): this
  {
    if (!callback) {
      this.callbacks.delete(event);
    }
    else {
      const callbacks = this.callbacks.get(event);
      if (callbacks) {
        callbacks.delete(callback);
      }
    }

    return this;
  }

  /**
   * Handle an event from the server
   */
  handleEvent(event: string, data: any): void
  {
    // Handle subscription success
    if (event === 'subscription_succeeded') {
      this.isSubscribed = true;
    }
    // Handle subscription error
    else if (event === 'subscription_error') {
      this.isSubscribed = false;
    }

    const callbacks = this.callbacks.get(event);
    if (callbacks) {
      for (const callback of callbacks) {
        callback(data);
      }
    }
  }

  /**
   * Get the channel name
   */
  getName(): string
  {
    return this.name;
  }
}

/**
 * Public channel
 */
export class PublicChannel<T = any> extends ChannelInstance<T>
{
  /**
   * Listen for subscription success
   */
  subscribed(callback: () => void): this
  {
    return this.listen('subscription_succeeded', callback as any);
  }

  /**
   * Listen for subscription error
   */
  error(callback: (error: any) => void): this
  {
    return this.listen('subscription_error', callback as any);
  }
}

/**
 * Private channel
 */
export class PrivateChannel<T = any> extends PublicChannel<T>
{
  /**
   * Send a client event (whisper)
   */
  whisper(event: string, data: any): this
  {
    this.client.send({
      event: `client-${event}`,
      channel: this.name,
      data,
    });

    return this;
  }

  /**
   * Listen for whispered events
   */
  listenForWhisper(event: string, callback: EventCallback<T>): this
  {
    return this.listen(`client-${event}`, callback);
  }
}

/**
 * Presence channel
 */
export class PresenceChannel<T = any> extends PrivateChannel<T>
{
  private members: Map<string, any> = new Map();
  private presenceHeartbeatany: any | null = null;

  /**
   * Subscribe to the channel and start presence heartbeat
   */
  override subscribe(): void
  {
    super.subscribe();
    this.startPresenceHeartbeat();
  }

  /**
   * Unsubscribe from the channel and stop presence heartbeat
   */
  override unsubscribe(): void
  {
    this.stopPresenceHeartbeat();
    super.unsubscribe();
  }

  /**
   * Start presence heartbeat
   */
  private startPresenceHeartbeat(): void
  {
    // Send heartbeat every 30 seconds to stay active
    this.presenceHeartbeatany = setInterval(() =>
    {
      this.client.send({
        event: 'presence_heartbeat',
        channel: this.name,
        timestamp: Date.now(),
      });
    }, 30000);
  }

  /**
   * Stop presence heartbeat
   */
  private stopPresenceHeartbeat(): void
  {
    if (this.presenceHeartbeatany) {
      clearInterval(this.presenceHeartbeatany);
      this.presenceHeartbeatany = null;
    }
  }

  /**
   * Handle subscription success with presence data
   */
  override handleEvent(event: string, data: any): void
  {
    if (event === 'subscription_succeeded' && data?.presence) {
      // Store initial members
      for (const [id, member] of Object.entries(data.presence.hash)) {
        this.members.set(id, member);
      }

      // Call here callbacks
      const callbacks = this.callbacks.get('here');
      if (callbacks) {
        const membersList = Array.from(this.members.values());
        for (const callback of callbacks) {
          callback(membersList as any);
        }
      }
    }
    else if (event === 'member_added') {
      this.members.set(data.id, data);

      const callbacks = this.callbacks.get('joining');
      if (callbacks) {
        for (const callback of callbacks) {
          callback(data);
        }
      }
    }
    else if (event === 'member_removed') {
      this.members.delete(data.id);

      const callbacks = this.callbacks.get('leaving');
      if (callbacks) {
        for (const callback of callbacks) {
          callback(data);
        }
      }
    }

    super.handleEvent(event, data);
  }

  /**
   * Listen for initial members
   */
  here(callback: (members: any[]) => void): this
  {
    return this.listen('here', callback as any);
  }

  /**
   * Listen for new members joining
   */
  joining(callback: (member: any) => void): this
  {
    return this.listen('joining', callback as any);
  }

  /**
   * Listen for members leaving
   */
  leaving(callback: (member: any) => void): this
  {
    return this.listen('leaving', callback as any);
  }

  /**
   * Get all current members
   */
  getMembers(): any[]
  {
    return Array.from(this.members.values());
  }

  /**
   * Get a specific member
   */
  getMember(id: string): any | null
  {
    return this.members.get(id) || null;
  }
}

// Aliases for backward compatibility (undocumented)
export type EchoConfig = BroadcastClientConfig;
export const Echo: typeof BroadcastClient = BroadcastClient;

export default BroadcastClient;
