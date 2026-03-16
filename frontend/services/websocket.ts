// services/websocket.ts
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

type WebSocketMessage = {
  action: string;
  [key: string]: any;
};

type MessageHandler = (data: any) => void;

class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private pingInterval: NodeJS.Timeout | null = null;
  private messageHandlers: Map<string, Set<MessageHandler>> = new Map();
  private currentConversationId: string | null = null;

  async connect(): Promise<void> {
    if (this.ws?.readyState === WebSocket.OPEN) return;

    try {
      const token = await SecureStore.getItemAsync('access_token');
      if (!token) throw new Error('No access token');

      const wsUrl = `${process.env.EXPO_PUBLIC_WS_URL}/ws/messaging?token=${token}`;
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.reconnectAttempts = 0;
        this.startPingInterval();
        
        // Rejoin conversation if was in one
        if (this.currentConversationId) {
          this.joinConversation(this.currentConversationId);
        }
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleMessage(data);
        } catch (error) {
          console.error('WebSocket message parse error:', error);
        }
      };

      this.ws.onclose = () => {
        console.log('WebSocket closed');
        this.stopPingInterval();
        this.attemptReconnect();
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    } catch (error) {
      console.error('WebSocket connection error:', error);
      this.attemptReconnect();
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);

    this.reconnectTimeout = setTimeout(() => {
      console.log(`Reconnecting attempt ${this.reconnectAttempts}...`);
      this.connect();
    }, delay);
  }

  private startPingInterval(): void {
    this.pingInterval = setInterval(() => {
      this.send({ action: 'ping' });
    }, 30000);
  }

  private stopPingInterval(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  private handleMessage(data: any): void {
    const { action, ...payload } = data;

    // Handle specific message types
    const handlers = this.messageHandlers.get(action);
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(payload);
        } catch (error) {
          console.error('Message handler error:', error);
        }
      });
    }

    // Also notify general message handlers
    const generalHandlers = this.messageHandlers.get('message');
    if (generalHandlers && action === 'new_message') {
      generalHandlers.forEach((handler) => handler(payload));
    }
  }

  onMessage(handler: MessageHandler): () => void {
    return this.subscribe('message', handler);
  }

  onTyping(handler: MessageHandler): () => void {
    return this.subscribe('typing', handler);
  }

  onUserJoined(handler: MessageHandler): () => void {
    return this.subscribe('user_joined', handler);
  }

  onUserLeft(handler: MessageHandler): () => void {
    return this.subscribe('user_left', handler);
  }

  private subscribe(event: string, handler: MessageHandler): () => void {
    if (!this.messageHandlers.has(event)) {
      this.messageHandlers.set(event, new Set());
    }
    this.messageHandlers.get(event)!.add(handler);

    return () => {
      this.messageHandlers.get(event)?.delete(handler);
    };
  }

  joinConversation(conversationId: string): void {
    this.currentConversationId = conversationId;
    this.send({
      action: 'join_conversation',
      conversation_id: conversationId,
    });
  }

  leaveConversation(conversationId: string): void {
    this.send({
      action: 'leave_conversation',
      conversation_id: conversationId,
    });
    if (this.currentConversationId === conversationId) {
      this.currentConversationId = null;
    }
  }

  sendMessage(conversationId: string, content: string, type: string = 'text'): void {
    this.send({
      action: 'send_message',
      conversation_id: conversationId,
      content,
      message_type: type,
    });
  }

  sendTyping(conversationId: string, isTyping: boolean): void {
    this.send({
      action: 'typing',
      conversation_id: conversationId,
      is_typing: isTyping,
    });
  }

  markAsRead(messageIds: string[]): void {
    this.send({
      action: 'mark_read',
      message_ids: messageIds,
    });
  }

  private send(data: WebSocketMessage): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  disconnect(): void {
    this.stopPingInterval();
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }
    this.ws?.close();
    this.ws = null;
    this.messageHandlers.clear();
  }
}

export const wsService = new WebSocketService();