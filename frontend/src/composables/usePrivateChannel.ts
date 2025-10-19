import { onUnmounted, Ref, ref, watch } from "vue";
import BroadcastClient, { EventCallback } from "./broadcast";

/**
 * Use private channel composable
 */
export function usePrivateChannel<T = any>(
    client: BroadcastClient | Ref<BroadcastClient>,
    channelName: string | Ref<string>,
    eventHandlers?: Record<string, EventCallback<T>>,
)
{
    const isSubscribed = ref(false);
    let channel: any = null;

    const getClient = () =>
    {
        return typeof client === 'object' && 'value' in client ? client.value : client;
    };

    const getChannelName = () =>
    {
        return typeof channelName === 'object' && 'value' in channelName ? channelName.value : channelName;
    };

    const subscribe = () =>
    {
        const broadcastClient = getClient();
        const name = getChannelName();

        channel = broadcastClient.private<T>(name);

        // Setup event handlers
        if (eventHandlers) {
            for (const [event, handler] of Object.entries(eventHandlers)) {
                channel.listen(event, handler);
            }
        }

        // Listen for subscription success
        channel.listen('subscription_succeeded', () =>
        {
            isSubscribed.value = true;
        });

        // Listen for subscription error
        channel.listen('subscription_error', () =>
        {
            isSubscribed.value = false;
        });
    };

    const unsubscribe = () =>
    {
        if (channel) {
            channel.unsubscribe();
            channel = null;
            isSubscribed.value = false;
        }
    };

    // Watch for channel name changes
    if (typeof channelName === 'object' && 'value' in channelName) {
        watch(channelName, () =>
        {
            unsubscribe();
            subscribe();
        });
    }

    // Initial subscription
    subscribe();

    // Cleanup on unmount
    onUnmounted(() =>
    {
        unsubscribe();
    });

    const whisper = (event: string, whisperData: T) =>
    {
        if (channel) {
            channel.whisper(event, whisperData);
        }
    };

    return {
        channel,
        isSubscribed,
        whisper,
        unsubscribe,
    };
}
