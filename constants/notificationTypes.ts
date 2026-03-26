export type NotificationType =
  | "booking"
  | "booking_success_parent"
  | "admin_new_booking"
  | "mentor_assigned_parent"
  | "mentor_assignment"
  | "teacher_accepted"
  | "teacher_rejected"
  | "mentor_accepted_admin"
  | "booking_confirmed"
  | "live_tracking"
  | "attendance_code_parent"
  | "attendance_marked_admin"
  | "rate_mentor_reminder";

export type UserRole = "parent" | "teacher" | "admin";

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
  action?: "accept" | "reject" | null;
}

export type BookingFlowStatus =
  | "pending"
  | "assigned"
  | "accepted"
  | "rejected"
  | "confirmed"
  | "in_progress"
  | "completed";

export interface BookingRequest {
  id: string;
  parentId: string;
  parentName: string;
  childName: string;
  subject: string;
  grade: string;
  mode: "online" | "offline";
  date: string;
  time: string;
  hours: number;
  address?: string;
  contact: string;
  status: BookingFlowStatus;
  assignedTeacherId?: string;
  /** Mentor display name after assign */
  mentorName?: string;
  mentorEmail?: string;
  mentorRating?: number;
  price?: number;
  /** Parent sees this after mentor accepts */
  attendanceCode?: string;
  /** yyyy-mm-dd + time slot key for busy check */
  slotKey?: string;
  sessionStartedAt?: string;
  attendanceMarkedAt?: string;
  completedAt?: string;
  parentRating?: number;
  createdAt: string;
}

export interface TeacherAssignment {
  id: string;
  bookingId: string;
  teacherId: string;
  teacherName: string;
  assignedAt: string;
  status: "pending" | "accepted" | "rejected";
}

export const ADMIN_USER_ID = "admin-001";

export function makeSlotKey(date: string, time: string): string {
  return `${date}|${time}`;
}

export function generateAttendanceCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}
