/**
 * Push Notifications Service
 * Handles push notifications, in-app notifications, and real-time updates
 */

import React from 'react';
import { apiService } from './api';

export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  data?: Record<string, any>;
  actions?: NotificationAction[];
  tag?: string;
  requireInteraction?: boolean;
  silent?: boolean;
  vibrate?: number[];
}

export interface NotificationAction {
  action: string;
  title: string;
  icon?: string;
}

export interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface InAppNotification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actions?: Array<{
    label: string;
    action: () => void;
  }>;
  autoHide?: boolean;
  duration?: number;
}

class NotificationService {
  private vapidPublicKey: string;
  private subscription: PushSubscription | null = null;
  private inAppNotifications: InAppNotification[] = [];
  private listeners: Map<string, Function[]> = new Map();

  constructor() {
    this.vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY || '';
    this.initializeService();
  }

  private async initializeService(): Promise<void> {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      try {
        const registration = await navigator.serviceWorker.ready;
        const existingSubscription = await registration.pushManager.getSubscription();
        
        if (existingSubscription) {
          this.subscription = existingSubscription as any;
          console.log('[Notifications] Existing subscription found');
        }

        // Listen for push events
        navigator.serviceWorker.addEventListener('message', this.handleServiceWorkerMessage.bind(this));
      } catch (error) {
        console.error('[Notifications] Initialization failed:', error);
      }
    }
  }

  private handleServiceWorkerMessage(event: MessageEvent): void {
    if (event.data && event.data.type === 'PUSH_NOTIFICATION') {
      this.handlePushNotification(event.data.payload);
    }
  }

  private handlePushNotification(payload: NotificationPayload): void {
    // Handle push notification received
    this.emit('push-received', payload);
    
    // Add to in-app notifications if app is in focus
    if (document.hasFocus()) {
      this.addInAppNotification({
        id: `push_${Date.now()}`,
        type: 'info',
        title: payload.title,
        message: payload.body,
        timestamp: new Date(),
        read: false,
        autoHide: true,
        duration: 5000,
      });
    }
  }

  /**
   * Request notification permission
   */
  async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      throw new Error('This browser does not support notifications');
    }

    const permission = await Notification.requestPermission();
    console.log('[Notifications] Permission:', permission);
    return permission;
  }

  /**
   * Subscribe to push notifications
   */
  async subscribeToPush(): Promise<boolean> {
    try {
      const permission = await this.requestPermission();
      if (permission !== 'granted') {
        console.log('[Notifications] Permission denied');
        return false;
      }

      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        throw new Error('Push messaging is not supported');
      }

      const registration = await navigator.serviceWorker.ready;
      
      // Check if already subscribed
      const existingSubscription = await registration.pushManager.getSubscription();
      if (existingSubscription) {
        this.subscription = existingSubscription as any;
        await this.sendSubscriptionToServer(this.subscription);
        return true;
      }

      // Create new subscription
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(this.vapidPublicKey),
      });

      this.subscription = subscription as any;
      await this.sendSubscriptionToServer(this.subscription);
      
      console.log('[Notifications] Successfully subscribed to push notifications');
      return true;
    } catch (error) {
      console.error('[Notifications] Failed to subscribe:', error);
      return false;
    }
  }

  /**
   * Unsubscribe from push notifications
   */
  async unsubscribeFromPush(): Promise<boolean> {
    try {
      if (!this.subscription) {
        return true;
      }

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        await subscription.unsubscribe();
        await this.removeSubscriptionFromServer();
        this.subscription = null;
        console.log('[Notifications] Successfully unsubscribed from push notifications');
      }
      
      return true;
    } catch (error) {
      console.error('[Notifications] Failed to unsubscribe:', error);
      return false;
    }
  }

  /**
   * Send subscription to server
   */
  private async sendSubscriptionToServer(subscription: PushSubscription): Promise<void> {
    try {
      await apiService.post('/notifications/subscribe', {
        subscription: {
          endpoint: subscription.endpoint,
          keys: subscription.keys,
        },
      });
    } catch (error) {
      console.error('[Notifications] Failed to send subscription to server:', error);
    }
  }

  /**
   * Remove subscription from server
   */
  private async removeSubscriptionFromServer(): Promise<void> {
    try {
      if (this.subscription) {
        await apiService.post('/notifications/unsubscribe', {
          endpoint: this.subscription.endpoint,
        });
      }
    } catch (error) {
      console.error('[Notifications] Failed to remove subscription from server:', error);
    }
  }

  /**
   * Show local notification
   */
  async showNotification(payload: NotificationPayload): Promise<void> {
    if (!('Notification' in window)) {
      console.warn('[Notifications] Browser does not support notifications');
      return;
    }

    if (Notification.permission !== 'granted') {
      console.warn('[Notifications] Notification permission not granted');
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification(payload.title, {
        body: payload.body,
        icon: payload.icon || '/icons/icon-192x192.png',
        badge: payload.badge || '/icons/badge-72x72.png',
        image: payload.image,
        data: payload.data,
        actions: payload.actions,
        tag: payload.tag,
        requireInteraction: payload.requireInteraction,
        silent: payload.silent,
        vibrate: payload.vibrate || [200, 100, 200],
      });
    } catch (error) {
      console.error('[Notifications] Failed to show notification:', error);
    }
  }

  /**
   * Add in-app notification
   */
  addInAppNotification(notification: InAppNotification): void {
    this.inAppNotifications.unshift(notification);
    this.emit('notification-added', notification);

    // Auto-hide if specified
    if (notification.autoHide && notification.duration) {
      setTimeout(() => {
        this.removeInAppNotification(notification.id);
      }, notification.duration);
    }
  }

  /**
   * Remove in-app notification
   */
  removeInAppNotification(id: string): void {
    const index = this.inAppNotifications.findIndex(n => n.id === id);
    if (index > -1) {
      const notification = this.inAppNotifications.splice(index, 1)[0];
      this.emit('notification-removed', notification);
    }
  }

  /**
   * Mark notification as read
   */
  markAsRead(id: string): void {
    const notification = this.inAppNotifications.find(n => n.id === id);
    if (notification && !notification.read) {
      notification.read = true;
      this.emit('notification-read', notification);
    }
  }

  /**
   * Mark all notifications as read
   */
  markAllAsRead(): void {
    this.inAppNotifications.forEach(notification => {
      if (!notification.read) {
        notification.read = true;
      }
    });
    this.emit('all-notifications-read');
  }

  /**
   * Clear all notifications
   */
  clearAllNotifications(): void {
    this.inAppNotifications = [];
    this.emit('notifications-cleared');
  }

  /**
   * Get unread count
   */
  getUnreadCount(): number {
    return this.inAppNotifications.filter(n => !n.read).length;
  }

  /**
   * Get all notifications
   */
  getNotifications(): InAppNotification[] {
    return [...this.inAppNotifications];
  }

  /**
   * Send test notification
   */
  async sendTestNotification(): Promise<void> {
    await this.showNotification({
      title: 'GoBasket Test',
      body: 'This is a test notification from GoBasket!',
      icon: '/icons/icon-192x192.png',
      data: { type: 'test' },
    });
  }

  /**
   * Event listener management
   */
  on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  off(event: string, callback: Function): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  private emit(event: string, data?: any): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => callback(data));
    }
  }

  /**
   * Utility: Convert VAPID key
   */
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  /**
   * Check if notifications are supported
   */
  isSupported(): boolean {
    return 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;
  }

  /**
   * Get notification permission status
   */
  getPermissionStatus(): NotificationPermission {
    return Notification.permission;
  }

  /**
   * Check if subscribed to push notifications
   */
  isSubscribed(): boolean {
    return this.subscription !== null;
  }
}

// Create singleton instance
export const notificationService = new NotificationService();

// React hook for notifications
export const useNotifications = () => {
  const [notifications, setNotifications] = React.useState<InAppNotification[]>([]);
  const [unreadCount, setUnreadCount] = React.useState(0);

  React.useEffect(() => {
    const updateNotifications = () => {
      setNotifications(notificationService.getNotifications());
      setUnreadCount(notificationService.getUnreadCount());
    };

    // Initial load
    updateNotifications();

    // Listen for changes
    notificationService.on('notification-added', updateNotifications);
    notificationService.on('notification-removed', updateNotifications);
    notificationService.on('notification-read', updateNotifications);
    notificationService.on('all-notifications-read', updateNotifications);
    notificationService.on('notifications-cleared', updateNotifications);

    return () => {
      notificationService.off('notification-added', updateNotifications);
      notificationService.off('notification-removed', updateNotifications);
      notificationService.off('notification-read', updateNotifications);
      notificationService.off('all-notifications-read', updateNotifications);
      notificationService.off('notifications-cleared', updateNotifications);
    };
  }, []);

  return {
    notifications,
    unreadCount,
    subscribe: notificationService.subscribeToPush.bind(notificationService),
    unsubscribe: notificationService.unsubscribeFromPush.bind(notificationService),
    showNotification: notificationService.showNotification.bind(notificationService),
    addNotification: notificationService.addInAppNotification.bind(notificationService),
    removeNotification: notificationService.removeInAppNotification.bind(notificationService),
    markAsRead: notificationService.markAsRead.bind(notificationService),
    markAllAsRead: notificationService.markAllAsRead.bind(notificationService),
    clearAll: notificationService.clearAllNotifications.bind(notificationService),
    sendTest: notificationService.sendTestNotification.bind(notificationService),
    isSupported: notificationService.isSupported(),
    isSubscribed: notificationService.isSubscribed(),
    permission: notificationService.getPermissionStatus(),
  };
};

export default notificationService;
