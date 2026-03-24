export interface User {
  id: string;
  email: string;
  password: string;
  username: string;
  role: 'parent' | 'tutor' | 'admin';
  first_name: string;
  last_name: string;
  phone?: string;
  avatar_url?: string;
  is_verified: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Parent extends User {
  role: 'parent';
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
}

export interface Tutor extends User {
  role: 'tutor';
  qualification?: string;
  experience_years?: number;
  subjects: string[];
  boards: string[];
  hourly_rate?: number;
  is_available: boolean;
  rating?: number;
  total_students?: number;
  about?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
}

export interface Subject {
  id: string;
  name: string;
  board: 'CBSE' | 'STATE' | 'ICSE' | 'IB';
  class_level: number;
  description?: string;
  created_at: Date;
}

export interface Booking {
  id: string;
  parent_id: string;
  tutor_id: string;
  subject_id: string;
  class_mode: 'online' | 'offline';
  lesson_type: 'single' | 'group';
  scheduled_date: Date;
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
  created_at: Date;
  updated_at: Date;
}

export interface Payment {
  id: string;
  booking_id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  payment_method: 'razorpay' | 'paypal' | 'cash';
  transaction_id?: string;
  created_at: Date;
  updated_at: Date;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'booking' | 'payment' | 'system' | 'location';
  is_read: boolean;
  data?: any;
  created_at: Date;
}

export interface LocationTracking {
  id: string;
  booking_id: string;
  tutor_id: string;
  latitude: number;
  longitude: number;
  timestamp: Date;
  accuracy?: number;
}

export interface Review {
  id: string;
  booking_id: string;
  parent_id: string;
  tutor_id: string;
  rating: number;
  comment?: string;
  created_at: Date;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  confirm_password: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  role: 'parent' | 'tutor';
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

export interface JwtPayload {
  userId: string;
  email: string;
  role: 'parent' | 'tutor' | 'admin';
  iat: number;
  exp: number;
}
