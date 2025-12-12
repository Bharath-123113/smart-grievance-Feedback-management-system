// src/services/websocketService.js
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';

class WebSocketService {
    constructor() {
        this.client = null;
        this.subscriptions = new Map();
        this.messageHandlers = new Map();
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.isConnected = false;
    }

    connect(grievanceId, onMessageCallback) {
        if (this.client && this.client.connected) {
            console.log('WebSocket already connected');
            return;
        }

        this.client = new Client({
            webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
            reconnectDelay: 5000,
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000,
            
            onConnect: () => {
                console.log('✅ WebSocket Connected');
                this.isConnected = true;
                this.reconnectAttempts = 0;
                
                // Call the original callback if provided
                if (onMessageCallback) {
                    this.subscribeToGrievance(grievanceId, onMessageCallback);
                }
                
                this.messageHandlers.forEach(handler => {
                    if (handler.onConnect) handler.onConnect();
                });
            },
            
            onStompError: (frame) => {
                console.error('❌ WebSocket STOMP error:', frame.headers['message']);
                console.error('Details:', frame.body);
            },
            
            onDisconnect: () => {
                console.log('🔌 WebSocket Disconnected');
                this.isConnected = false;
                this.subscriptions.forEach(sub => sub.unsubscribe());
                this.subscriptions.clear();
                
                this.messageHandlers.forEach(handler => {
                    if (handler.onDisconnect) handler.onDisconnect();
                });
            },
            
            onWebSocketClose: () => {
                console.log('🚫 WebSocket Closed');
                this.isConnected = false;
                this.reconnectAttempts++;
                
                if (this.reconnectAttempts <= this.maxReconnectAttempts) {
                    console.log(`🔄 Reconnecting... Attempt ${this.reconnectAttempts}`);
                    setTimeout(() => this.connect(grievanceId, onMessageCallback), 3000);
                }
            }
        });

        this.client.activate();
    }

    // Updated subscribeToGrievance method with enhanced functionality
    subscribeToGrievance(grievanceId, onMessageCallback, onStatusUpdateCallback, onErrorCallback) {
        // Validate inputs
        if (!grievanceId) {
            console.error('❌ Grievance ID is required');
            if (onErrorCallback) onErrorCallback('Grievance ID is required');
            return null;
        }

        // Check WebSocket connection
        if (!this.client || !this.client.connected) {
            console.error('❌ WebSocket not connected');
            if (onErrorCallback) onErrorCallback('WebSocket not connected. Please connect first.');
            return null;
        }

        const topic = `/topic/grievance/${grievanceId}`;
        const subscriptionKey = `grievance-${grievanceId}`;

        // Unsubscribe if already subscribed to avoid duplicates
        if (this.subscriptions.has(subscriptionKey)) {
            console.log(`🔄 Already subscribed to grievance ${grievanceId}, refreshing subscription...`);
            this.unsubscribeFromGrievance(grievanceId);
        }

        // Create the subscription with enhanced message handling
        const subscription = this.client.subscribe(
            topic,
            (message) => {
                try {
                    const data = JSON.parse(message.body);
                    
                    // Handle NEW_REMARK messages
                    if (data.type === 'NEW_REMARK' && data.remark) {
                        console.log('📨 New remark:', data.remark);
                        if (onMessageCallback) onMessageCallback(data.remark);
                        
                        // Also notify message handlers
                        this.messageHandlers.forEach(handler => {
                            if (handler.onNewRemark) {
                                handler.onNewRemark(data.remark, grievanceId);
                            }
                        });
                    }
                    // Handle STATUS_UPDATE messages
                    else if (data.type === 'STATUS_UPDATE') {
                        console.log('🔄 Status update:', data);
                        if (onStatusUpdateCallback) onStatusUpdateCallback(data);
                        
                        // Also notify message handlers
                        this.messageHandlers.forEach(handler => {
                            if (handler.onStatusUpdate) {
                                handler.onStatusUpdate(data, grievanceId);
                            }
                        });
                    }
                    // Handle TYPING_INDICATOR messages
                    else if (data.type === 'TYPING_INDICATOR') {
                        console.log('⌨️ Typing indicator:', data);
                        this.messageHandlers.forEach(handler => {
                            if (handler.onTypingIndicator) {
                                handler.onTypingIndicator(data, grievanceId);
                            }
                        });
                    }
                    // Handle other message types
                    else {
                        console.log('📥 Received message:', data);
                        this.messageHandlers.forEach(handler => {
                            if (handler.onMessage) {
                                handler.onMessage(data, grievanceId);
                            }
                        });
                    }
                } catch (error) {
                    console.error('Error parsing WebSocket message:', error);
                    if (onErrorCallback) onErrorCallback(error.message);
                }
            }
        );

        // Store the subscription
        this.subscriptions.set(subscriptionKey, subscription);
        console.log(`✅ Subscribed to grievance ${grievanceId} on topic ${topic}`);
        
        return subscriptionKey;
    }

    unsubscribeFromGrievance(grievanceId) {
        const key = `grievance-${grievanceId}`;
        const subscription = this.subscriptions.get(key);
        if (subscription) {
            subscription.unsubscribe();
            this.subscriptions.delete(key);
            console.log(`✅ Unsubscribed from grievance ${grievanceId}`);
            return true;
        }
        return false;
    }

    disconnect() {
        if (this.client) {
            this.subscriptions.forEach(sub => sub.unsubscribe());
            this.subscriptions.clear();
            this.client.deactivate();
            this.client = null;
            this.isConnected = false;
            console.log('✅ WebSocket Disconnected');
            
            // Notify all handlers
            this.messageHandlers.forEach(handler => {
                if (handler.onDisconnect) handler.onDisconnect();
            });
        }
    }

    sendTypingIndicator(grievanceId, userId, isTyping) {
        if (!this.client || !this.client.connected) {
            console.warn('Cannot send typing indicator: WebSocket not connected');
            return false;
        }
        
        try {
            this.client.publish({
                destination: `/app/grievance/${grievanceId}/typing`,
                body: JSON.stringify({
                    type: 'TYPING_INDICATOR',
                    grievanceId,
                    userId,
                    isTyping,
                    timestamp: new Date().toISOString()
                })
            });
            console.log(`⌨️ Sent typing indicator: ${isTyping ? 'typing' : 'stopped'}`);
            return true;
        } catch (error) {
            console.error('Error sending typing indicator:', error);
            return false;
        }
    }

    // Send a remark via WebSocket
    sendRemark(grievanceId, remark, userId) {
        if (!this.client || !this.client.connected) {
            console.warn('Cannot send remark: WebSocket not connected');
            return false;
        }
        
        try {
            this.client.publish({
                destination: `/app/grievance/${grievanceId}/remark`,
                body: JSON.stringify({
                    type: 'NEW_REMARK',
                    grievanceId,
                    remark,
                    userId,
                    timestamp: new Date().toISOString()
                })
            });
            console.log('📤 Sent remark via WebSocket');
            return true;
        } catch (error) {
            console.error('Error sending remark:', error);
            return false;
        }
    }

    // Send a status update via WebSocket
    sendStatusUpdate(grievanceId, status, note, userId) {
        if (!this.client || !this.client.connected) {
            console.warn('Cannot send status update: WebSocket not connected');
            return false;
        }
        
        try {
            this.client.publish({
                destination: `/app/grievance/${grievanceId}/status`,
                body: JSON.stringify({
                    type: 'STATUS_UPDATE',
                    grievanceId,
                    status,
                    note,
                    userId,
                    timestamp: new Date().toISOString()
                })
            });
            console.log(`🔄 Sent status update: ${status}`);
            return true;
        } catch (error) {
            console.error('Error sending status update:', error);
            return false;
        }
    }

    // Check connection status
    isConnected() {
        return this.isConnected && this.client && this.client.connected;
    }

    // Get current subscription count
    getSubscriptionCount() {
        return this.subscriptions.size;
    }

    // Check if subscribed to a specific grievance
    isSubscribedToGrievance(grievanceId) {
        return this.subscriptions.has(`grievance-${grievanceId}`);
    }

    addMessageHandler(handlerId, handler) {
        this.messageHandlers.set(handlerId, handler);
        console.log(`➕ Added message handler: ${handlerId}`);
    }

    removeMessageHandler(handlerId) {
        const removed = this.messageHandlers.delete(handlerId);
        if (removed) {
            console.log(`➖ Removed message handler: ${handlerId}`);
        }
        return removed;
    }

    // Get all active subscriptions
    getActiveSubscriptions() {
        return Array.from(this.subscriptions.keys());
    }
}

const webSocketService = new WebSocketService();
export default webSocketService;