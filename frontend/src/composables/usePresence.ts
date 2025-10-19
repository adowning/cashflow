import { onUnmounted, Ref, ref, watch } from "vue";
import BroadcastClient, { EventCallback } from "./broadcast";

/**
 * Use presence channel composable
 */
export function usePresence<T = any>(
    client: BroadcastClient | Ref<BroadcastClient>,
    channelName: string | Ref<string>,
    eventHandlers?: Record<string, EventCallback<T>>,
)
{
    const isSubscribed = ref(false);
    const members = ref<any[]>([]);
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

        channel = broadcastClient.join<T>(name);

        // Setup event handlers
        if (eventHandlers) {
            for (const [event, handler] of Object.entries(eventHandlers)) {
                channel.listen(event, handler);
            }
        }

        // Listen for initial members
        channel.here((initialMembers: any[]) =>
        {
            members.value = initialMembers;
            isSubscribed.value = true;
        });

        // Listen for new members
        channel.joining((member: any) =>
        {
            members.value = [...members.value, member];
        });

        // Listen for members leaving
        channel.leaving((member: any) =>
        {
            members.value = members.value.filter(m => m.id !== member.id);
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
            members.value = [];
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
        members,
        memberCount: ref(members.value.length),
        whisper,
        unsubscribe,
    };
}
