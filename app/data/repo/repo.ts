import type {
  AppUser,
  Booking,
  JobPost,
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

