import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import { User, Booking, Subject, Payment, Notification, LocationTracking, Review } from '../types/backend';

export class BackendService {
  // Authentication
  static async login(email: string, password: string) {
    try {
      const response = await fetch('http://192.168.0.25:8081/api/auth/login', { // ✅ Fixed port to 8081
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Store tokens in AsyncStorage
        if (data.data?.tokens?.accessToken) {
          await AsyncStorage.setItem('accessToken', data.data.tokens.accessToken);
        }
        if (data.data?.tokens?.refreshToken) {
          await AsyncStorage.setItem('refreshToken', data.data.tokens.refreshToken);
        }
        // Store user data
        if (data.data?.user) {
          await AsyncStorage.setItem('user', JSON.stringify(data.data.user));
        }
        return { success: true, data: data.data };
      } else {
        return { success: false, error: data.message || 'Login failed' };
      }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error occurred' };
    }
  }

  static async register(email: string, password: string, userData: any) {
    console.log("🚀 Registration started for:", email);
    console.log("Username:", userData.username);
    console.log("Role:", userData.role);
    
    try {
      console.log("BackendService.register - Starting API call");
      const apiUrl = 'http://192.168.0.25:8081/api/auth/register'; // ✅ Fixed port to 8081
      console.log("API URL:", apiUrl);
      
      const requestBody = {
        username: userData.username,
        email,
        password,
        confirm_password: password, // Backend will validate this
        first_name: userData.first_name,
        last_name: userData.last_name,
        role: userData.role,
      };
      
      console.log("Request body:", JSON.stringify(requestBody, null, 2));

      console.log("About to make fetch request to:", apiUrl);
      console.log("Request method: POST");
      console.log("Request headers: { 'Content-Type': 'application/json' }");
      console.log("Request body length:", JSON.stringify(requestBody).length);
      console.log("Request body type:", typeof JSON.stringify(requestBody));
      
      console.log("=== FETCH START ===");
      console.log("Making fetch call now...");
      
      // Add timeout and better error handling
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      let response;
      try {
        response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
          signal: controller.signal,
        });
      } catch (fetchError: any) {
        console.log("=== FETCH ERROR DEBUG ===");
        console.log("Fetch error type:", typeof fetchError);
        console.log("Fetch error name:", fetchError?.name);
        console.log("Fetch error message:", fetchError?.message);
        console.log("Fetch error stack:", fetchError?.stack);
        console.log("=== END FETCH ERROR DEBUG ===");
        
        // Create custom error with more context
        const customError = new Error(`Network request failed: ${fetchError?.message || 'Unknown fetch error'}`);
        customError.name = 'NetworkError';
        (customError as any).originalError = fetchError;
        throw customError;
      }
      
      clearTimeout(timeoutId);
      console.log("=== FETCH COMPLETE ===");
      console.log("Fetch call finished, got response");

      console.log("Response status:", response.status);
      console.log("Response ok:", response.ok);
      console.log("Response headers:", response.headers);
      console.log("Response type:", response.type);
      console.log("Response url:", response.url);

      console.log("About to parse JSON response...");
      let data;
      try {
        data = await response.json();
      } catch (jsonError: any) {
        console.log("=== JSON ERROR DEBUG ===");
        console.log("JSON error type:", typeof jsonError);
        console.log("JSON error name:", jsonError?.name);
        console.log("JSON error message:", jsonError?.message);
        console.log("JSON error stack:", jsonError?.stack);
        console.log("Response status:", response.status);
        console.log("Response text:", await response.text());
        console.log("=== END JSON ERROR DEBUG ===");
        
        // Create custom error with more context
        const customError = new Error(`JSON parsing failed: ${jsonError?.message || 'Invalid JSON response'}`);
        customError.name = 'JSONError';
        (customError as any).originalError = jsonError;
        (customError as any).responseStatus = response.status;
        throw customError;
      }
      console.log("JSON parsing complete");
      console.log("Response data:", data);

      if (data.success) {
        // Store tokens in AsyncStorage
        if (data.data?.tokens?.accessToken) {
          await AsyncStorage.setItem('accessToken', data.data.tokens.accessToken);
        }
        if (data.data?.tokens?.refreshToken) {
          await AsyncStorage.setItem('refreshToken', data.data.tokens.refreshToken);
        }
        // Store user data
        if (data.data?.user) {
          await AsyncStorage.setItem('user', JSON.stringify(data.data.user));
        }
        return { success: true, data: data.data };
      } else {
        return { success: false, error: data.message || 'Registration failed' };
      }
      
    } catch (error: any) {
      console.error("❌ Registration failed:", error);
      
      // Check for specific error types
      if (error?.name === 'AbortError') {
        console.log("Request timed out after 10 seconds");
        return { success: false, error: 'Request timed out. Please check your network connection.' };
      }
      
      if (error?.message?.includes('Network request failed')) {
        console.log("Network connectivity issue detected");
        return { success: false, error: 'Network connection failed. Please check your internet connection and try again.' };
      }
      
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error occurred' };
    }
  }

  static async logout() {
    try {
      // Clear all AsyncStorage items
      await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error occurred' };
    }
  }

  static async getCurrentUser() {
    try {
      const userStr = await AsyncStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
      return null;
    }
  }

  // User Management
  static async getUserProfile(userId: string): Promise<User | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  }

  static async updateUserProfile(userId: string, updates: Partial<User>) {
    try {
      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error occurred' };
    }
  }

  // Subjects
  static async getSubjects(board?: string, classLevel?: number): Promise<Subject[]> {
    try {
      let query = supabase.from('subjects').select('*');

      if (board) {
        query = query.eq('board', board);
      }
      if (classLevel) {
        query = query.eq('class_level', classLevel);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching subjects:', error);
      return [];
    }
  }

  // Bookings
  static async createBooking(bookingData: Partial<Booking>) {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .insert(bookingData)
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error occurred' };
    }
  }

  static async getUserBookings(userId: string, role: 'parent' | 'tutor'): Promise<Booking[]> {
    try {
      const column = role === 'parent' ? 'parent_id' : 'tutor_id';
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq(column, userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching bookings:', error);
      return [];
    }
  }

  static async updateBookingStatus(bookingId: string, status: Booking['status']) {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', bookingId)
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error occurred' };
    }
  }

  // Tutors
  static async getAvailableTutors(filters?: {
    subject_id?: string;
    city?: string;
    board?: string;
  }): Promise<User[]> {
    try {
      let query = supabase
        .from('users')
        .select('*')
        .eq('role', 'tutor')
        .eq('is_available', true);

      if (filters?.city) {
        query = query.eq('city', filters.city);
      }
      if (filters?.board) {
        query = query.contains('boards', [filters.board]);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching tutors:', error);
      return [];
    }
  }

  // Notifications
  static async getUserNotifications(userId: string): Promise<Notification[]> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }
  }

  static async markNotificationAsRead(notificationId: string) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId)
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error occurred' };
    }
  }

  // Location Tracking
  static async updateLocation(bookingId: string, tutorId: string, latitude: number, longitude: number) {
    try {
      const { data, error } = await supabase
        .from('location_tracking')
        .insert({
          booking_id: bookingId,
          tutor_id: tutorId,
          latitude,
          longitude,
          timestamp: new Date().toISOString()
        });

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error occurred' };
    }
  }

  static async getLocationHistory(bookingId: string): Promise<LocationTracking[]> {
    try {
      const { data, error } = await supabase
        .from('location_tracking')
        .select('*')
        .eq('booking_id', bookingId)
        .order('timestamp', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching location history:', error);
      return [];
    }
  }

  // Reviews
  static async createReview(reviewData: Partial<Review>) {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .insert(reviewData)
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error occurred' };
    }
  }

  static async getTutorReviews(tutorId: string): Promise<Review[]> {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('tutor_id', tutorId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching reviews:', error);
      return [];
    }
  }

  // Real-time subscriptions
  static subscribeToBookingUpdates(bookingId: string, callback: (payload: any) => void) {
    return supabase
      .channel(`booking-${bookingId}`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'bookings', 
          filter: `id=eq.${bookingId}` 
        }, 
        callback
      )
      .subscribe();
  }

  static subscribeToNotifications(userId: string, callback: (payload: any) => void) {
    return supabase
      .channel(`notifications-${userId}`)
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'notifications', 
          filter: `user_id=eq.${userId}` 
        }, 
        callback
      )
      .subscribe();
  }

  static subscribeToLocationUpdates(bookingId: string, callback: (payload: any) => void) {
    return supabase
      .channel(`location-${bookingId}`)
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'location_tracking', 
          filter: `booking_id=eq.${bookingId}` 
        }, 
        callback
      )
      .subscribe();
  }

  static unsubscribe(channel: any) {
    supabase.removeChannel(channel);
  }
}

export default BackendService;
