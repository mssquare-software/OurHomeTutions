import type {
  AppUser,
  Booking,
  JobPost,
  MentorAdminRequest,
  MentorApplication,
  Subject,
  SubjectTopic,
  SupportQuery,
} from "../models";
import { makeId, readJson, writeJson } from "../storage";
import { ensureSeedData, KEYS } from "./seed";

async function boot() {
  await ensureSeedData();
}

// Users
export async function listUsers(): Promise<AppUser[]> {
  await boot();
  return readJson<AppUser[]>(KEYS.users, []);
}

/**
 * Add or update a user in the local repo (same store Admin → Mentors / Assign uses).
 * Call this when someone registers via auth so new mentors appear in admin lists.
 */
export async function upsertRepoUser(input: {
  email: string;
  fullName: string;
  role: AppUser["role"];
  isActive?: boolean;
}): Promise<AppUser> {
  await boot();
  const items = await readJson<AppUser[]>(KEYS.users, []);
  const email = input.email.trim().toLowerCase();
  const fullName = input.fullName.trim();
  const idx = items.findIndex((u) => u.email.trim().toLowerCase() === email);

  const nextUser: AppUser =
    idx >= 0
      ? {
          ...items[idx],
          fullName,
          role: input.role,
          isActive: input.isActive ?? items[idx].isActive ?? true,
        }
      : {
          id: makeId("usr"),
          email,
          fullName,
          role: input.role,
          createdAt: Date.now(),
          isActive: input.isActive ?? true,
        };

  const next =
    idx >= 0 ? items.map((u, i) => (i === idx ? nextUser : u)) : [nextUser, ...items];
  await writeJson(KEYS.users, next);
  return nextUser;
}

// Queries
export async function listQueries(): Promise<SupportQuery[]> {
  await boot();
  return readJson<SupportQuery[]>(KEYS.queries, []);
}

export async function createQuery(input: {
  fromEmail: string;
  fromName: string;
  subject: string;
  message: string;
  attachments?: SupportQuery["attachments"];
}) {
  await boot();
  const items = await readJson<SupportQuery[]>(KEYS.queries, []);
  const next: SupportQuery[] = [
    {
      id: makeId("qry"),
      fromEmail: input.fromEmail.trim().toLowerCase(),
      fromName: input.fromName.trim() || "Parent",
      subject: input.subject.trim(),
      message: input.message.trim(),
      attachments: input.attachments ?? [],
      status: "unsolved",
      createdAt: Date.now(),
    },
    ...items,
  ];
  await writeJson(KEYS.queries, next);
}

export async function updateQueryStatus(id: string, status: SupportQuery["status"]) {
  await boot();
  const items = await readJson<SupportQuery[]>(KEYS.queries, []);
  const next = items.map((q) =>
    q.id === id
      ? {
          ...q,
          status,
          solvedAt: status === "solved" ? Date.now() : undefined,
        }
      : q
  );
  await writeJson(KEYS.queries, next);
}

// Bookings
export async function listBookings(): Promise<Booking[]> {
  await boot();
  return readJson<Booking[]>(KEYS.bookings, []);
}

export async function assignMentorToBooking(input: {
  bookingId: string;
  mentorEmail: string;
  mentorName: string;
}) {
  await boot();
  const items = await readJson<Booking[]>(KEYS.bookings, []);
  const next = items.map((b) =>
    b.id === input.bookingId
      ? { ...b, mentorEmail: input.mentorEmail, mentorName: input.mentorName, status: "active" }
      : b
  );
  await writeJson(KEYS.bookings, next);
}

export async function setBookingZoomLink(input: { bookingId: string; zoomLink: string }) {
  await boot();
  const items = await readJson<Booking[]>(KEYS.bookings, []);
  const next = items.map((b) => (b.id === input.bookingId ? { ...b, zoomLink: input.zoomLink } : b));
  await writeJson(KEYS.bookings, next);
}

// Applications
export async function listApplications(): Promise<MentorApplication[]> {
  await boot();
  return readJson<MentorApplication[]>(KEYS.applications, []);
}

export async function updateApplicationStatus(input: {
  applicationId: string;
  status: MentorApplication["status"];
}) {
  await boot();
  const items = await readJson<MentorApplication[]>(KEYS.applications, []);
  const next = items.map((a) =>
    a.id === input.applicationId ? { ...a, status: input.status, decidedAt: Date.now() } : a
  );
  await writeJson(KEYS.applications, next);
}

export async function createMentorApplication(
  input: Omit<MentorApplication, "id" | "createdAt" | "status" | "decidedAt">
) {
  await boot();
  const items = await readJson<MentorApplication[]>(KEYS.applications, []);
  const next: MentorApplication = {
    ...input,
    id: makeId("app"),
    status: "submitted",
    createdAt: Date.now(),
  };
  await writeJson(KEYS.applications, [next, ...items]);
  return next;
}

export async function listApplicationsByMentorEmail(
  mentorEmail: string
): Promise<MentorApplication[]> {
  await boot();
  const items = await readJson<MentorApplication[]>(KEYS.applications, []);
  const e = mentorEmail.trim().toLowerCase();
  return items.filter((a) => a.mentorEmail.trim().toLowerCase() === e);
}

// Admin → Mentor requests (parent match)
export async function listMentorRequestsForEmail(
  mentorEmail: string
): Promise<MentorAdminRequest[]> {
  await boot();
  const items = await readJson<MentorAdminRequest[]>(KEYS.mentorRequests, []);
  const e = mentorEmail.trim().toLowerCase();
  return items
    .filter((r) => r.mentorEmail.trim().toLowerCase() === e)
    .sort((a, b) => b.createdAt - a.createdAt);
}

export async function listAllMentorRequests(): Promise<MentorAdminRequest[]> {
  await boot();
  const items = await readJson<MentorAdminRequest[]>(KEYS.mentorRequests, []);
  return [...items].sort((a, b) => b.createdAt - a.createdAt);
}

export async function createMentorAdminRequest(
  input: Omit<MentorAdminRequest, "id" | "createdAt" | "status" | "decidedAt">
) {
  await boot();
  const items = await readJson<MentorAdminRequest[]>(KEYS.mentorRequests, []);
  const next: MentorAdminRequest = {
    ...input,
    id: makeId("mreq"),
    status: "pending",
    createdAt: Date.now(),
  };
  await writeJson(KEYS.mentorRequests, [next, ...items]);
  return next;
}

export async function updateMentorRequestStatus(input: {
  id: string;
  status: MentorAdminRequest["status"];
}) {
  await boot();
  const items = await readJson<MentorAdminRequest[]>(KEYS.mentorRequests, []);
  const next = items.map((r) =>
    r.id === input.id
      ? { ...r, status: input.status, decidedAt: input.status === "pending" ? undefined : Date.now() }
      : r
  );
  await writeJson(KEYS.mentorRequests, next);
}

// Subjects
export async function listSubjects(): Promise<Subject[]> {
  await boot();
  return readJson<Subject[]>(KEYS.subjects, []);
}

export async function addSubject(name: string) {
  await boot();
  const items = await readJson<Subject[]>(KEYS.subjects, []);
  const now = Date.now();
  const next: Subject[] = [
    {
      id: makeId("subj"),
      name: name.trim(),
      topics: [],
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
    ...items,
  ];
  await writeJson(KEYS.subjects, next);
}

export async function removeSubject(subjectId: string) {
  await boot();
  const items = await readJson<Subject[]>(KEYS.subjects, []);
  await writeJson(
    KEYS.subjects,
    items.filter((s) => s.id !== subjectId)
  );
}

export async function addTopicToSubject(subjectId: string, topicName: string) {
  await boot();
  const items = await readJson<Subject[]>(KEYS.subjects, []);
  const next = items.map((s) => {
    if (s.id !== subjectId) return s;
    const existing = s.topics ?? [];
    const trimmed = topicName.trim();
    if (!trimmed) return s;
    const already = existing.some((t) => t.name.toLowerCase() === trimmed.toLowerCase());
    if (already) return s;
    const topic: SubjectTopic = { id: makeId("topic"), name: trimmed };
    return {
      ...s,
      topics: [...existing, topic],
      updatedAt: Date.now(),
    };
  });
  await writeJson(KEYS.subjects, next);
}

export async function removeTopicFromSubject(subjectId: string, topicId: string) {
  await boot();
  const items = await readJson<Subject[]>(KEYS.subjects, []);
  const next = items.map((s) =>
    s.id === subjectId
      ? {
          ...s,
          topics: (s.topics ?? []).filter((t) => t.id !== topicId),
          updatedAt: Date.now(),
        }
      : s
  );
  await writeJson(KEYS.subjects, next);
}

// Jobs
export async function listJobs(): Promise<JobPost[]> {
  await boot();
  return readJson<JobPost[]>(KEYS.jobs, []);
}

export async function addJob(job: Omit<JobPost, "id" | "createdAt">) {
  await boot();
  const items = await readJson<JobPost[]>(KEYS.jobs, []);
  const next: JobPost[] = [{ ...job, id: makeId("job"), createdAt: Date.now() }, ...items];
  await writeJson(KEYS.jobs, next);
}

