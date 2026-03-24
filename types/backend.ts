export interface User {
  id: string;
  email: string;
  password?: string;
  role: 'parent' | 'tutor' | 'admin';
  first_name: string;
  last_name: string;
  phone?: string;
  avatar_url?: string;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
  
  // Parent specific fields
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  
  // Tutor specific fields
  qualification?: string;
  experience_years?: number;
  subjects?: string[];
  boards?: string[];
  hourly_rate?: number;
  is_available?: boolean;
  rating?: number;
  total_students?: number;
  about?: string;
}

export interface Subject {
  id: string;
  name: string;
  board: 'CBSE' | 'STATE' | 'ICSE' | 'IB';
  class_level: number;
  description?: string;
  created_at: string;
}

export interface Booking {
  id: string;
  parent_id: string;
  tutor_id: string;
  subject_id: string;
  class_mode: 'online' | 'offline';
  lesson_type: 'single' | 'group';
  scheduled_date: string;
  duration_minutes: number;
  price: number;
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  location?: {
    address: string;
    latitude: number;
    longitude: number;
  };
  notes?: string;
  payment_status: 'pending' | 'paid' | 'refunded';
  payment_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  booking_id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  payment_method: 'razorpay' | 'paypal' | 'cash';
  transaction_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'booking' | 'payment' | 'system' | 'location';
  is_read: boolean;
  data?: any;
  created_at: string;
}

export interface LocationTracking {
  id: string;
  booking_id: string;
  tutor_id: string;
  latitude: number;
  longitude: number;
  timestamp: string;
  accuracy?: number;
}

export interface Review {
  id: string;
  booking_id: string;
  parent_id: string;
  tutor_id: string;
  rating: number;
  comment?: string;
  created_at: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface BookingRequest {
  tutor_id: string;
  subject_id: string;
  class_mode: 'online' | 'offline';
  lesson_type: 'single' | 'group';
  scheduled_date: string;
  duration_minutes: number;
  location?: {
    address: string;
    latitude: number;
    longitude: number;
  };
  notes?: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone?: string;
  role: 'parent' | 'tutor';
}

export interface LoginRequest {
  email: string;
  password: string;
}
