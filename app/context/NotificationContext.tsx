import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useEffect, useState } from 'react';

export type NotificationType = 'booking' | 'teacher_accepted' | 'teacher_rejected' | 'booking_confirmed' | 'live_tracking';
export type UserRole = 'parent' | 'teacher' | 'admin';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  description: string;
  userId: string;
  senderId: string;
  role: UserRole;
  bookingId: string;
  teacherId?: string;
  parentId?: string;
  childName?: string;
  subject?: string;
  date?: string;
  time?: string;
  createdAt: string;
  read: boolean;
  action?: 'accept' | 'reject' | null;
}

export interface BookingRequest {
  id: string;
  parentId: string;
  parentName: string;
  childName: string;
  subject: string;
  grade: string;
  mode: 'online' | 'offline';
  date: string;
  time: string;
  hours: number;
  address?: string;
  contact: string;
  status: 'pending' | 'assigned' | 'accepted' | 'rejected' | 'confirmed';
  assignedTeacherId?: string;
  createdAt: string;
}

interface NotificationContextType {
  notifications: Notification[];
  bookings: BookingRequest[];
  unreadCount: number;
  addNotification: (notification: Notification) => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  acceptBooking: (bookingId: string, teacherId: string) => Promise<void>;
  rejectBooking: (bookingId: string, teacherId: string) => Promise<void>;
  createBooking: (booking: BookingRequest) => Promise<void>;
  assignTeacher: (bookingId: string, teacherId: string) => Promise<void>;
  getBookingById: (bookingId: string) => BookingRequest | undefined;
}

export const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [bookings, setBookings] = useState<BookingRequest[]>([]);

  // Load from AsyncStorage on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const [savedNotifications, savedBookings] = await Promise.all([
          AsyncStorage.getItem('notifications'),
          AsyncStorage.getItem('bookings'),
        ]);

        if (savedNotifications) {
          setNotifications(JSON.parse(savedNotifications));
        }
        if (savedBookings) {
          setBookings(JSON.parse(savedBookings));
        }
      } catch (error) {
        console.log('Error loading data:', error);
      }
    };

    loadData();
  }, []);

  const saveNotifications = useCallback(async (data: Notification[]) => {
    try {
      await AsyncStorage.setItem('notifications', JSON.stringify(data));
    } catch (error) {
      console.log('Error saving notifications:', error);
    }
  }, []);

  const saveBookings = useCallback(async (data: BookingRequest[]) => {
    try {
      await AsyncStorage.setItem('bookings', JSON.stringify(data));
    } catch (error) {
      console.log('Error saving bookings:', error);
    }
  }, []);

  const addNotification = useCallback(
    async (notification: Notification) => {
      const updated = [notification, ...notifications];
      setNotifications(updated);
      await saveNotifications(updated);
      console.log('📬 Notification added:', notification.type);
    },
    [notifications, saveNotifications]
  );

  const markAsRead = useCallback(
    async (notificationId: string) => {
      const updated = notifications.map((n) =>
        n.id === notificationId ? { ...n, read: true } : n
      );
      setNotifications(updated);
      await saveNotifications(updated);
    },
    [notifications, saveNotifications]
  );

  const deleteNotification = useCallback(
    async (notificationId: string) => {
      const updated = notifications.filter((n) => n.id !== notificationId);
      setNotifications(updated);
      await saveNotifications(updated);
    },
    [notifications, saveNotifications]
  );

  const createBooking = useCallback(
    async (booking: BookingRequest) => {
      const updated = [...bookings, booking];
      setBookings(updated);
      await saveBookings(updated);

      const adminNotification: Notification = {
        id: Math.random().toString(36).substr(2, 9),
        type: 'booking',
        title: 'New Booking Request',
        description: `${booking.parentName} requested a tutor for ${booking.childName} in ${booking.subject}`,
        userId: 'admin-001',
        senderId: booking.parentId,
        role: 'admin',
        bookingId: booking.id,
        parentId: booking.parentId,
        childName: booking.childName,
        subject: booking.subject,
        date: booking.date,
        time: booking.time,
        createdAt: new Date().toISOString(),
        read: false,
      };

      await addNotification(adminNotification);
      console.log('✅ Booking created:', booking.id);
    },
    [bookings, saveBookings, addNotification]
  );

  const assignTeacher = useCallback(
    async (bookingId: string, teacherId: string) => {
      const updatedBookings = bookings.map((b) =>
        b.id === bookingId
          ? { ...b, status: 'assigned' as const, assignedTeacherId: teacherId }
          : b
      );
      setBookings(updatedBookings);
      await saveBookings(updatedBookings);

      const booking = bookings.find((b) => b.id === bookingId);
      if (booking) {
        const teacherNotification: Notification = {
          id: Math.random().toString(36).substr(2, 9),
          type: 'booking',
          title: 'New Booking Assignment',
          description: `You have been assigned to teach ${booking.childName} in ${booking.subject}`,
          userId: teacherId,
          senderId: 'admin-001',
          role: 'teacher',
          bookingId: bookingId,
          parentId: booking.parentId,
          childName: booking.childName,
          subject: booking.subject,
          date: booking.date,
          time: booking.time,
          createdAt: new Date().toISOString(),
          read: false,
        };

        await addNotification(teacherNotification);
        console.log('✅ Teacher assigned:', teacherId);
      }
    },
    [bookings, saveBookings, addNotification]
  );

  const acceptBooking = useCallback(
    async (bookingId: string, teacherId: string) => {
      const updatedBookings = bookings.map((b) =>
        b.id === bookingId ? { ...b, status: 'accepted' as const } : b
      );
      setBookings(updatedBookings);
      await saveBookings(updatedBookings);

      const booking = bookings.find((b) => b.id === bookingId);
      if (booking) {
        const parentNotification: Notification = {
          id: Math.random().toString(36).substr(2, 9),
          type: 'teacher_accepted',
          title: '✅ Teacher Accepted!',
          description: `Your assigned teacher has accepted the booking for ${booking.childName}`,
          userId: booking.parentId,
          senderId: teacherId,
          role: 'parent',
          bookingId: bookingId,
          teacherId: teacherId,
          childName: booking.childName,
          subject: booking.subject,
          date: booking.date,
          time: booking.time,
          createdAt: new Date().toISOString(),
          read: false,
        };

        await addNotification(parentNotification);
        console.log('✅ Teacher accepted booking:', bookingId);
      }
    },
    [bookings, saveBookings, addNotification]
  );

  const rejectBooking = useCallback(
    async (bookingId: string, teacherId: string) => {
      const updatedBookings = bookings.map((b) =>
        b.id === bookingId
          ? { ...b, status: 'pending' as const, assignedTeacherId: undefined }
          : b
      );
      setBookings(updatedBookings);
      await saveBookings(updatedBookings);

      const adminNotification: Notification = {
        id: Math.random().toString(36).substr(2, 9),
        type: 'teacher_rejected',
        title: '❌ Teacher Rejected',
        description: `Teacher ${teacherId} rejected the booking. Please reassign.`,
        userId: 'admin-001',
        senderId: teacherId,
        role: 'admin',
        bookingId: bookingId,
        teacherId: teacherId,
        createdAt: new Date().toISOString(),
        read: false,
      };

      await addNotification(adminNotification);
      console.log('❌ Teacher rejected booking:', bookingId);
    },
    [bookings, saveBookings, addNotification]
  );

  const getBookingById = useCallback(
    (bookingId: string) => {
      return bookings.find((b) => b.id === bookingId);
    },
    [bookings]
  );

  const unreadCount = notifications.filter((n) => !n.read).length;

  const value: NotificationContextType = {
    notifications,
    bookings,
    unreadCount,
    addNotification,
    markAsRead,
    deleteNotification,
    acceptBooking,
    rejectBooking,
    createBooking,
    assignTeacher,
    getBookingById,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};