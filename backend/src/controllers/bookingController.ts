import { Request, Response } from 'express';
import { DatabaseService } from '../services/databaseService';
import { NotificationService } from '../services/notificationService';
import { Booking, Payment, Notification } from '../types';

export class BookingController {
  // Create new booking
  static async createBooking(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req.user as any)?.id;
      if (!userId) {
        res.status(401).json({ success: false, message: 'User not authenticated' });
        return;
      }

      const {
        classLevel,
        board,
        subjects,
        topics,
        hours,
        mode,
        date,
        time,
        lessonType,
        participants,
        address,
        contact,
        paymentMethod,
        amount
      } = req.body;

      // Validate required fields
      if (!classLevel || !board || !subjects || !hours || !mode || !date || !time || !contact) {
        res.status(400).json({ success: false, message: 'Missing required fields' });
        return;
      }

      // Validate contact (10-digit mobile)
      if (!/^[6-9]\d{9}$/.test(contact)) {
        res.status(400).json({ success: false, message: 'Invalid contact number. Must be 10 digits starting with 6, 7, 8, or 9.' });
        return;
      }

      // Validate participants for group/single
      if (lessonType === 'single' && participants.length !== 1) {
        res.status(400).json({ success: false, message: 'Single session allows only 1 participant' });
        return;
      }
      if (lessonType === 'group' && participants.length > 5) {
        res.status(400).json({ success: false, message: 'Group session allows maximum 5 participants' });
        return;
      }

      // Validate address for offline mode
      if (mode === 'offline' && !address) {
        res.status(400).json({ success: false, message: 'Address is required for offline sessions' });
        return;
      }

      // Create booking
      const bookingData = {
        parent_id: userId,
        class_level: classLevel,
        board: board.toLowerCase(),
        subjects: subjects,
        topics: topics,
        duration_minutes: hours * 60,
        class_mode: mode,
        lesson_type: lessonType,
        scheduled_date: new Date(`${date} ${time}`),
        participants: participants,
        location: mode === 'offline' ? { address: address } : null,
        contact: contact,
        status: 'pending',
        payment_status: 'pending',
        price: amount || 0,
        created_at: new Date(),
        updated_at: new Date()
      };

      const booking = await DatabaseService.createBooking(bookingData);

      if (!booking) {
        res.status(500).json({ success: false, message: 'Failed to create booking' });
        return;
      }

      // Create payment record
      const paymentData = {
        booking_id: booking.id,
        amount: amount || 0,
        currency: 'INR',
        status: 'pending',
        payment_method: paymentMethod || 'cash',
        created_at: new Date(),
        updated_at: new Date()
      };

      const payment = await DatabaseService.createPayment(paymentData);

      // Send notifications to admin and mentor
      await this.sendBookingNotifications(booking, userId);

      res.status(201).json({
        success: true,
        message: 'Booking created successfully',
        data: {
          booking,
          payment
        }
      });

    } catch (error) {
      console.error('Create booking error:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }

  // Get user's bookings
  static async getMyBookings(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req.user as any)?.id;
      if (!userId) {
        res.status(401).json({ success: false, message: 'User not authenticated' });
        return;
      }

      const bookings = await DatabaseService.getBookingsByParent(userId);
      
      res.json({
        success: true,
        data: bookings
      });

    } catch (error) {
      console.error('Get my bookings error:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }

  // Get booking details
  static async getBookingDetails(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = (req.user as any)?.id;

      if (!userId) {
        res.status(401).json({ success: false, message: 'User not authenticated' });
        return;
      }

      const booking = await DatabaseService.getBookingById(id);

      if (!booking) {
        res.status(404).json({ success: false, message: 'Booking not found' });
        return;
      }

      // Check if user owns this booking or is admin/tutor
      if (booking.parent_id !== userId && (req.user as any)?.role !== 'admin' && (req.user as any)?.role !== 'tutor') {
        res.status(403).json({ success: false, message: 'Access denied' });
        return;
      }

      res.json({
        success: true,
        data: booking
      });

    } catch (error) {
      console.error('Get booking details error:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }

  // Update booking status
  static async updateBookingStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const userId = (req.user as any)?.id;

      if (!userId) {
        res.status(401).json({ success: false, message: 'User not authenticated' });
        return;
      }

      const validStatuses = ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'];
      if (!validStatuses.includes(status)) {
        res.status(400).json({ success: false, message: 'Invalid status' });
        return;
      }

      const booking = await DatabaseService.getBookingById(id);
      if (!booking) {
        res.status(404).json({ success: false, message: 'Booking not found' });
        return;
      }

      // Check permissions - only admin, tutor, or booking owner can update
      if (booking.parent_id !== userId && (req.user as any)?.role !== 'admin' && (req.user as any)?.role !== 'tutor') {
        res.status(403).json({ success: false, message: 'Access denied' });
        return;
      }

      const updatedBooking = await DatabaseService.updateBookingStatus(id, status, userId);

      // Send status update notifications
      await this.sendStatusUpdateNotification(updatedBooking, status);

      res.json({
        success: true,
        message: 'Booking status updated successfully',
        data: updatedBooking
      });

    } catch (error) {
      console.error('Update booking status error:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }

  // Update payment status
  static async updatePaymentStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { status, transactionId } = req.body;
      const userId = (req.user as any)?.id;

      if (!userId) {
        res.status(401).json({ success: false, message: 'User not authenticated' });
        return;
      }

      const validStatuses = ['pending', 'completed', 'failed', 'refunded'];
      if (!validStatuses.includes(status)) {
        res.status(400).json({ success: false, message: 'Invalid payment status' });
        return;
      }

      const updatedPayment = await DatabaseService.updatePaymentStatus(id, status, transactionId);

      if (!updatedPayment) {
        res.status(404).json({ success: false, message: 'Payment not found' });
        return;
      }

      // If payment is completed, update booking status
      if (status === 'completed') {
        await DatabaseService.updateBookingStatus(updatedPayment.booking_id, 'confirmed', userId);
        
        // Send payment confirmation notifications
        await this.sendPaymentConfirmationNotification(updatedPayment);
      }

      res.json({
        success: true,
        message: 'Payment status updated successfully',
        data: updatedPayment
      });

    } catch (error) {
      console.error('Update payment status error:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }

  // Get all bookings (admin only)
  static async getAllBookings(req: Request, res: Response): Promise<void> {
    try {
      if ((req.user as any)?.role !== 'admin') {
        res.status(403).json({ success: false, message: 'Admin access required' });
        return;
      }

      const bookings = await DatabaseService.getAllBookings();
      
      res.json({
        success: true,
        data: bookings
      });

    } catch (error) {
      console.error('Get all bookings error:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }

  // Helper methods for notifications
  private static async sendBookingNotifications(booking: any, userId: string) {
    try {
      // Get parent details
      const parent = await DatabaseService.getUserById(userId);
      
      // Send notification to admin
      await NotificationService.createNotification({
        user_id: 'admin', // You might want to get actual admin user ID
        title: 'New Booking Request',
        message: `New booking request from ${parent?.username} for ${booking.subjects.join(', ')}`,
        type: 'booking',
        data: { bookingId: booking.id },
        is_read: false
      });

      // Send notification to relevant tutors (you might want to implement tutor matching logic)
      const tutors = await DatabaseService.getTutorsBySubject(booking.subjects);
      for (const tutor of tutors) {
        await NotificationService.createNotification({
          user_id: tutor.id,
          title: 'New Booking Opportunity',
          message: `New booking request for ${booking.subjects.join(', ')} - ${booking.class_level} ${booking.board}`,
          type: 'booking',
          data: { bookingId: booking.id },
          is_read: false
        });
      }

    } catch (error) {
      console.error('Error sending booking notifications:', error);
    }
  }

  private static async sendStatusUpdateNotification(booking: any, status: string) {
    try {
      // Notify parent about status change
      await NotificationService.createNotification({
        user_id: booking.parent_id,
        title: 'Booking Status Updated',
        message: `Your booking has been ${status}`,
        type: 'booking',
        data: { bookingId: booking.id, status },
        is_read: false
      });

    } catch (error) {
      console.error('Error sending status update notification:', error);
    }
  }

  private static async sendPaymentConfirmationNotification(payment: any) {
    try {
      // Notify parent about payment confirmation
      await NotificationService.createNotification({
        user_id: payment.parent_id, // You'll need to get this from the booking
        title: 'Payment Confirmed',
        message: `Your payment of ₹${payment.amount} has been confirmed`,
        type: 'payment',
        data: { paymentId: payment.id },
        is_read: false
      });

    } catch (error) {
      console.error('Error sending payment confirmation notification:', error);
    }
  }
}
