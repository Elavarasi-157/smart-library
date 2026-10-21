import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api/client';
import { useAuth } from './AuthContext';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [crowdStatus, setCrowdStatus] = useState(null);

  useEffect(() => {
    fetchCrowdStatus();
    const crowdInterval = setInterval(fetchCrowdStatus, 30000); // 30s poll

    return () => clearInterval(crowdInterval);
  }, []);

  useEffect(() => {
    if (user) {
      fetchNotifications();
      const notifInterval = setInterval(fetchNotifications, 20000); // 20s poll
      return () => clearInterval(notifInterval);
    } else {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [user]);

  async function fetchCrowdStatus() {
    try {
      const res = await api.get('/crowd/status');
      if (res.success) {
        setCrowdStatus(res);
      }
    } catch (err) {
      console.warn('Failed to fetch crowd status:', err.message);
    }
  }

  async function fetchNotifications() {
    try {
      const res = await api.get('/notifications');
      if (res.success) {
        setNotifications(res.notifications || []);
        setUnreadCount(res.unread_count || 0);
      }
    } catch (err) {
      console.warn('Failed to fetch notifications:', err.message);
    }
  }

  async function markAsRead(id = 'all') {
    try {
      await api.put(`/notifications/${id}/read`);
      await fetchNotifications();
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  }

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      crowdStatus,
      fetchNotifications,
      fetchCrowdStatus,
      markAsRead
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
}
