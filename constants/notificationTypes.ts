export type NotificationType = 
  | 'booking' 
  | 'teacher_accepted' 
  | 'teacher_rejected' 
  | 'booking_confirmed' 
  | 'live_tracking';

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
  // Tutor assignment properties
  tutorAssigned?: boolean;
  tutorId?: string;
  tutorName?: string;
  tutorSubject?: string;
  paymentStatus?: 'pending' | 'paid' | 'failed' | 'refunded';
}

export interface TeacherAssignment {
  id: string;
  bookingId: string;
  teacherId: string;
  teacherName: string;
  assignedAt: string;
  status: 'pending' | 'accepted' | 'rejected';
}