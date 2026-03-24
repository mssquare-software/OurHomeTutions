import { supabase } from '../config/supabase';
import { User, Booking, Subject, Payment, Notification, LocationTracking, Review } from '../types';

export class DatabaseService {
  // User operations
  static async createUser(userData: Partial<User>): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .insert(userData)
      .select()
      .single();

    if (error) {
      console.error('Error creating user:', error);
      return null;
    }
    return data;
  }

  static async getUserByEmail(email: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error) {
      console.error('Error fetching user by email:', error);
      return null;
    }
    return data;
  }

  static async getUserByUsername(username: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .single();

    if (error) {
      console.error('Error fetching user by username:', error);
      return null;
    }
    return data;
  }

  static async getUserById(id: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching user by ID:', error);
      return null;
    }
    return data;
  }

  static async updateUser(id: string, userData: Partial<User>): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .update(userData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating user:', error);
      return null;
    }
    return data;
  }

  // Subject operations
  static async getSubjects(board?: string, classLevel?: number): Promise<Subject[]> {
    let query = supabase.from('subjects').select('*');

    if (board) {
      query = query.eq('board', board);
    }
    if (classLevel) {
      query = query.eq('class_level', classLevel);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching subjects:', error);
      return [];
    }
    return data || [];
  }

  static async createSubject(subjectData: Partial<Subject>): Promise<Subject | null> {
    const { data, error } = await supabase
      .from('subjects')
      .insert(subjectData)
      .select()
      .single();

    if (error) {
      console.error('Error creating subject:', error);
      return null;
    }
    return data;
  }

  // Booking operations
  static async createBooking(bookingData: any): Promise<any | null> {
    const { data, error } = await supabase
      .from('bookings')
      .insert(bookingData)
      .select()
      .single();

    if (error) {
      console.error('Error creating booking:', error);
      return null;
    }
    return data;
  }

  static async getBookingsByParent(parentId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('parent_id', parentId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching parent bookings:', error);
      return [];
    }
    return data || [];
  }

  static async getBookingById(bookingId: string): Promise<any | null> {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single();

    if (error) {
      console.error('Error fetching booking by ID:', error);
      return null;
    }
    return data;
  }

  static async getAllBookings(): Promise<any[]> {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching all bookings:', error);
      return [];
    }
    return data || [];
  }

  static async updateBookingStatus(bookingId: string, status: string, updatedBy: string): Promise<any | null> {
    const { data, error } = await supabase
      .from('bookings')
      .update({ 
        status, 
        updated_at: new Date(),
        updated_by: updatedBy
      })
      .eq('id', bookingId)
      .select()
      .single();

    if (error) {
      console.error('Error updating booking status:', error);
      return null;
    }
    return data;
  }

  // Notification operations
  static async createNotification(notificationData: Partial<Notification>): Promise<Notification | null> {
    const { data, error } = await supabase
      .from('notifications')
      .insert(notificationData)
      .select()
      .single();

    if (error) {
      console.error('Error creating notification:', error);
      return null;
    }
    return data;
  }

  static async getUserNotifications(userId: string): Promise<Notification[]> {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }
    return data || [];
  }

  static async markNotificationAsRead(id: string): Promise<Notification | null> {
    const { data, error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error marking notification as read:', error);
      return null;
    }
    return data;
  }

  // Location tracking operations
  static async createLocationTracking(locationData: Partial<LocationTracking>): Promise<LocationTracking | null> {
    const { data, error } = await supabase
      .from('location_tracking')
      .insert(locationData)
      .select()
      .single();

    if (error) {
      console.error('Error creating location tracking:', error);
      return null;
    }
    return data;
  }

  static async getBookingLocationHistory(bookingId: string): Promise<LocationTracking[]> {
    const { data, error } = await supabase
      .from('location_tracking')
      .select('*')
      .eq('booking_id', bookingId)
      .order('timestamp', { ascending: true });

    if (error) {
      console.error('Error fetching location history:', error);
      return [];
    }
    return data || [];
  }

  // Review operations
  static async createReview(reviewData: Partial<Review>): Promise<Review | null> {
    const { data, error } = await supabase
      .from('reviews')
      .insert(reviewData)
      .select()
      .single();

    if (error) {
      console.error('Error creating review:', error);
      return null;
    }
    return data;
  }

  static async getTutorReviews(tutorId: string): Promise<Review[]> {
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('tutor_id', tutorId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching tutor reviews:', error);
      return [];
    }
    return data || [];
  }

  // Tutor operations
  static async getAvailableTutors(filters?: {
    subject_id?: string;
    city?: string;
    board?: string;
  }): Promise<User[]> {
    let query = supabase
      .from('users')
      .select('*')
      .eq('role', 'tutor')
      .eq('is_available', true);

    if (filters?.city) {
      query = query.eq('city', filters.city);
    }
    if (filters?.board && filters.subject_id) {
      query = query.contains('boards', [filters.board]);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching tutors:', error);
      return [];
    }
    return data || [];
  }

  // Payment operations
  static async createPayment(paymentData: any): Promise<any | null> {
    const { data, error } = await supabase
      .from('payments')
      .insert(paymentData)
      .select()
      .single();

    if (error) {
      console.error('Error creating payment:', error);
      return null;
    }
    return data;
  }

  static async updatePaymentStatus(paymentId: string, status: string, transactionId?: string): Promise<any | null> {
    const updateData: any = { 
      status, 
      updated_at: new Date()
    };

    if (transactionId) {
      updateData.transaction_id = transactionId;
    }

    const { data, error } = await supabase
      .from('payments')
      .update(updateData)
      .eq('id', paymentId)
      .select()
      .single();

    if (error) {
      console.error('Error updating payment status:', error);
      return null;
    }
    return data;
  }

  // Helper method to get tutors by subjects
  static async getTutorsBySubject(subjects: string[]): Promise<any[]> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'tutor')
      .contains('subjects', subjects);

    if (error) {
      console.error('Error fetching tutors by subjects:', error);
      return [];
    }
    return data || [];
  }
}

export default DatabaseService;
