/**
 * React Hooks for Broadcasting Client
 *
 * React hooks for easy integration with the broadcasting system
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BroadcastClient } from './index';
/**
 * Use broadcast client
 */
export function useBroadcast(options) {
    const clientRef = useRef(null);
    const [isConnected, setIsConnected] = useState(false);
    const [socketId, setSocketId] = useState(null);
    // Create client instance
    if (!clientRef.current) {
        clientRef.current = new BroadcastClient(options);
        // Setup connection listeners
        clientRef.current.connector.on('connect', () => {
            setIsConnected(true);
            setSocketId(clientRef.current.socketId());
        });
        clientRef.current.connector.on('disconnect', () => {
            setIsConnected(false);
            setSocketId(null);
        });
    }
    useEffect(() => {
        return () => {
            clientRef.current?.disconnect();
        };
    }, []);
    const connect = useCallback(() => {
        clientRef.current?.connect();
    }, []);
    const disconnect = useCallback(() => {
        clientRef.current?.disconnect();
    }, []);
    return {
        client: clientRef.current,
        isConnected,
        socketId,
        connect,
        disconnect,
    };
}
/**
 * Use channel subscription
 */
export function useChannel(client, channelName, eventHandlers) {
    const [isSubscribed, setIsSubscribed] = useState(false);
    // eslint-disable-next-line unused-imports/no-unused-vars
    const [data, setData] = useState(null);
    const channelRef = useRef(null);
    useEffect(() => {
        if (!client) {
            return;
        }
        // Subscribe to channel
        const channel = client.channel(channelName);
        channelRef.current = channel;
        // Setup event handlers
        if (eventHandlers) {
            for (const [event, handler] of Object.entries(eventHandlers)) {
                channel.listen(event, handler);
            }
        }
        // Listen for subscription success
        channel.listen('subscription_succeeded', () => {
            setIsSubscribed(true);
        });
        // Listen for subscription error
        channel.listen('subscription_error', () => {
            setIsSubscribed(false);
        });
        return () => {
            channel.unsubscribe();
            channelRef.current = null;
        };
    }, [client, channelName]);
    const send = useCallback((event, data) => {
        if (channelRef.current) {
            channelRef.current.trigger(event, data);
        }
    }, []);
    return {
        channel: channelRef.current,
        isSubscribed,
        data,
        send,
    };
}
/**
 * Use private channel
 */
export function usePrivateChannel(client, channelName, eventHandlers) {
    const [isSubscribed, setIsSubscribed] = useState(false);
    const channelRef = useRef(null);
    useEffect(() => {
        if (!client) {
            return;
        }
        // Subscribe to private channel
        const channel = client.private(channelName);
        channelRef.current = channel;
        // Setup event handlers
        if (eventHandlers) {
            for (const [event, handler] of Object.entries(eventHandlers)) {
                channel.listen(event, handler);
            }
        }
        // Listen for subscription success
        channel.listen('subscription_succeeded', () => {
            setIsSubscribed(true);
        });
        // Listen for subscription error
        channel.listen('subscription_error', () => {
            setIsSubscribed(false);
        });
        return () => {
            channel.unsubscribe();
            channelRef.current = null;
        };
    }, [client, channelName]);
    const whisper = useCallback((event, data) => {
        if (channelRef.current) {
            channelRef.current.whisper(event, data);
        }
    }, []);
    return {
        channel: channelRef.current,
        isSubscribed,
        whisper,
    };
}
/**
 * Use presence channel
 */
export function usePresence(client, channelName, eventHandlers) {
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [members, setMembers] = useState([]);
    const channelRef = useRef(null);
    useEffect(() => {
        if (!client) {
            return;
        }
        // Subscribe to presence channel
        const channel = client.join(channelName);
        channelRef.current = channel;
        // Setup event handlers
        if (eventHandlers) {
            for (const [event, handler] of Object.entries(eventHandlers)) {
                channel.listen(event, handler);
            }
        }
        // Listen for initial members
        channel.here((initialMembers) => {
            setMembers(initialMembers);
            setIsSubscribed(true);
        });
        // Listen for new members
        channel.joining((member) => {
            setMembers(prev => [...prev, member]);
        });
        // Listen for members leaving
        channel.leaving((member) => {
            setMembers(prev => prev.filter(m => m.id !== member.id));
        });
        // Listen for subscription error
        channel.listen('subscription_error', () => {
            setIsSubscribed(false);
        });
        return () => {
            channel.unsubscribe();
            channelRef.current = null;
        };
    }, [client, channelName]);
    const whisper = useCallback((event, data) => {
        if (channelRef.current) {
            channelRef.current.whisper(event, data);
        }
    }, []);
    return {
        channel: channelRef.current,
        isSubscribed,
        members,
        memberCount: members.length,
        whisper,
    };
}
const BroadcastContext = React.createContext({
    client: null,
    isConnected: false,
    socketId: null,
});
export function BroadcastProvider({ children, config }) {
    const { client, isConnected, socketId } = useBroadcast(config);
    const value = useMemo(() => ({
        client,
        isConnected,
        socketId,
    }), [client, isConnected, socketId]);
    return React.createElement(BroadcastContext.Provider, { value }, children);
}
/**
 * Use broadcast context
 */
export function useBroadcastContext() {
    const context = React.useContext(BroadcastContext);
    if (!context.client) {
        throw new Error('useBroadcastContext must be used within a BroadcastProvider');
    }
    return context;
}
