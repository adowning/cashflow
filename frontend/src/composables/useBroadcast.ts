/**
 * Vue Composables for Broadcasting Client
 *
 * Vue 3 composables for easy integration with the broadcasting system
 */

import { onUnmounted, ref } from 'vue';
import { BroadcastClient } from './broadcast';

export interface UseBroadcastOptions
{
    broadcaster: 'bun' | 'reverb' | 'pusher' | 'ably'
    host?: string
    port?: number
    scheme?: 'ws' | 'wss'
    token: string
    key?: string
    cluster?: string
    auth?: {
        headers?: Record<string, string>
        endpoint?: string
    }
    autoConnect?: boolean
}

/**
 * Use broadcast client composable
 */
export function useBroadcast(options: UseBroadcastOptions)
{
    const client = new BroadcastClient(options);
    const isConnected = ref(false);
    const socketId = ref<string | null>(null);

    // Setup connection listeners
    client.connector.on('connect', () =>
    {
        isConnected.value = true;
        socketId.value = client.socketId();
    });

    client.connector.on('disconnect', () =>
    {
        isConnected.value = false;
        socketId.value = null;
    });

    // Cleanup on unmount
    onUnmounted(() =>
    {
        client.disconnect();
    });

    const connect = () =>
    {
        client.connect();
    };

    const disconnect = () =>
    {
        client.disconnect();
    };

    return {
        client,
        isConnected,
        socketId,
        connect,
        disconnect,
    };
}
