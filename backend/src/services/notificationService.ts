import { DatabaseService } from './databaseService';
import { supabase } from '../config/supabase';

export class NotificationService {
  // Create a new notification
  static async createNotification(notificationData: {
    user_id: string;
    title: string;
    message: string;
    type: 'booking' | 'payment' | 'system' | 'location';
    data?: any;
    is_read?: boolean;
  }) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert({
          ...notificationData,
          is_read: notificationData.is_read || false,
          created_at: new Date()
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating notification:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('NotificationService error:', error);
      return null;
    }
  }

  // Get notifications for a user
  static async getUserNotifications(userId: string, limit = 50) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching user notifications:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error getting user notifications:', error);
      return [];
    }
  }

  // Mark notification as read
  static async markAsRead(notificationId: string) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .update({ is_read: true, updated_at: new Date() })
        .eq('id', notificationId)
        .select()
        .single();

      if (error) {
        console.error('Error marking notification as read:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return null;
    }
  }

  // Mark all notifications as read for a user
  static async markAllAsRead(userId: string) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .update({ is_read: true, updated_at: new Date() })
        .eq('user_id', userId);

      if (error) {
        console.error('Error marking all notifications as read:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      return null;
    }
  }

  // Delete notification
  static async deleteNotification(notificationId: string) {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) {
        console.error('Error deleting notification:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error deleting notification:', error);
      return false;
    }
  }

  // Get unread notification count for a user
  static async getUnreadCount(userId: string) {
    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) {
        console.error('Error getting unread count:', error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  }

  // Send booking notification to admin
  static async notifyAdmin(bookingData: any, parentName: string) {
    try {
      // Get admin users
      const { data: admins } = await supabase
        .from('users')
        .select('id')
        .eq('role', 'admin');

      if (admins && admins.length > 0) {
        for (const admin of admins) {
          await this.createNotification({
            user_id: admin.id,
            title: 'New Booking Request',
            message: `New booking request from ${parentName} for ${bookingData.subjects?.join(', ')} - Class ${bookingData.class_level}`,
            type: 'booking',
            data: {
              bookingId: bookingData.id,
              parentId: bookingData.parent_id,
              subjects: bookingData.subjects,
              classLevel: bookingData.class_level
            }
          });
        }
      }
    } catch (error) {
      console.error('Error notifying admin:', error);
    }
  }

  // Send booking notification to relevant tutors
  static async notifyTutors(bookingData: any) {
    try {
      // Get tutors who teach the requested subjects
      const tutors = await DatabaseService.getTutorsBySubject(bookingData.subjects || []);

      for (const tutor of tutors) {
        await this.createNotification({
          user_id: tutor.id,
          title: 'New Booking Opportunity',
          message: `New booking request for ${bookingData.subjects?.join(', ')} - ${bookingData.class_level} ${bookingData.board}`,
          type: 'booking',
          data: {
            bookingId: bookingData.id,
            subjects: bookingData.subjects,
            classLevel: bookingData.class_level,
            board: bookingData.board,
            date: bookingData.scheduled_date,
            mode: bookingData.class_mode
          }
        });
      }
    } catch (error) {
      console.error('Error notifying tutors:', error);
    }
  }

  // Send payment confirmation to parent
  static async notifyPaymentConfirmation(paymentData: any, parentName: string) {
    try {
      // Get parent ID from payment booking
      const booking = await DatabaseService.getBookingById(paymentData.booking_id);
      if (booking) {
        await this.createNotification({
          user_id: booking.parent_id,
          title: 'Payment Confirmed',
          message: `Your payment of ₹${paymentData.amount} has been confirmed for your booking`,
          type: 'payment',
          data: {
            paymentId: paymentData.id,
            bookingId: paymentData.booking_id,
            amount: paymentData.amount,
            status: paymentData.status
          }
        });
      }
    } catch (error) {
      console.error('Error notifying payment confirmation:', error);
    }
  }

  // Send booking status update to parent
  static async notifyBookingStatusUpdate(bookingData: any, status: string) {
    try {
      await this.createNotification({
        user_id: bookingData.parent_id,
        title: 'Booking Status Updated',
        message: `Your booking has been ${status}`,
        type: 'booking',
        data: {
          bookingId: bookingData.id,
          status: status,
          subjects: bookingData.subjects,
          date: bookingData.scheduled_date
        }
      });
    } catch (error) {
      console.error('Error notifying booking status update:', error);
    }
  }
}
