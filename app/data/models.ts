export type UserRole = "parent" | "admin" | "mentor";

export type EntityId = string;

export interface AppUser {
  id: EntityId;
  email: string;
  fullName: string;
  role: UserRole;
  createdAt: number;
  isActive?: boolean;
}

export type BookingMode = "online" | "offline";
export type BookingStatus = "pending" | "active" | "completed" | "cancelled";

export interface Booking {
  id: EntityId;
  parentEmail: string;
  parentName: string;
  mentorEmail?: string;
  mentorName?: string;
  subject: string;
  topic?: string;
  mode: BookingMode;
  status: BookingStatus;
  scheduledAt?: number;
  createdAt: number;
  zoomLink?: string;
}

export type QueryStatus = "unsolved" | "solved";

export type QueryAttachmentType = "image" | "pdf" | "file";

export interface QueryAttachment {
  id: EntityId;
  type: QueryAttachmentType;
  name: string;
  uri: string;
  mimeType?: string;
  sizeBytes?: number;
}

export interface SupportQuery {
  id: EntityId;
  fromEmail: string;
  fromName: string;
  subject: string;
  message: string;
  attachments?: QueryAttachment[];
  status: QueryStatus;
  createdAt: number;
  solvedAt?: number;
}

export type ApplicationStatus = "submitted" | "accepted" | "rejected";

export interface MentorApplication {
  id: EntityId;
  mentorEmail: string;
  mentorName: string;
  subject: string;
  experienceYears?: number;
  resumeUri?: string;
  status: ApplicationStatus;
  createdAt: number;
  decidedAt?: number;
}

export interface SubjectTopic {
  id: EntityId;
  name: string;
}

export interface Subject {
  id: EntityId;
  name: string;
  topics: SubjectTopic[];
  isActive?: boolean;
  updatedAt: number;
  createdAt: number;
}

export interface Badge {
  id: EntityId;
  name: string;
  description?: string;
  daysRequired?: number;
  createdAt: number;
}

export interface MentorBadge {
  id: EntityId;
  mentorEmail: string;
  badgeId: EntityId;
  awardedAt: number;
}

export type JobLanguage = "English" | "Telugu" | "Hindi";
export type JobStatus = "open" | "closed";

export interface JobPostCriteria {
  degreeLevel: string;
  experience: string;
  classTier: string;
  subject: string;
  language: JobLanguage;
}

export interface JobPost {
  id: EntityId;
  criteria: JobPostCriteria;
  summary: string;
  status: JobStatus;
  createdAt: number;
}

