import type {
  AppUser,
  Booking,
  JobPost,
  MentorApplication,
  Subject,
  SupportQuery,
} from "../models";
import { makeId, readJson, writeJson } from "../storage";

export const KEYS = {
  users: "oht_repo_users_v1",
  bookings: "oht_repo_bookings_v1",
  queries: "oht_repo_queries_v1",
  applications: "oht_repo_applications_v1",
  subjects: "oht_repo_subjects_v1",
  jobs: "oht_repo_jobs_v1",
  badges: "oht_repo_badges_v1",
  mentorBadges: "oht_repo_mentor_badges_v1",
} as const;

export async function ensureSeedData() {
  const users = await readJson<AppUser[]>(KEYS.users, []);
  if (users.length > 0) return;

  const now = Date.now();

  const seedUsers: AppUser[] = [
    {
      id: makeId("usr"),
      email: "admin@ourhometution.com",
      fullName: "Admin",
      role: "admin",
      createdAt: now - 1000 * 60 * 60 * 24 * 5,
      isActive: true,
    },
    {
      id: makeId("usr"),
      email: "mentor1@ourhometution.com",
      fullName: "Mentor One",
      role: "mentor",
      createdAt: now - 1000 * 60 * 60 * 24 * 10,
      isActive: true,
    },
    {
      id: makeId("usr"),
      email: "mentor2@ourhometution.com",
      fullName: "Mentor Two",
      role: "mentor",
      createdAt: now - 1000 * 60 * 60 * 24 * 2,
      isActive: false,
    },
    {
      id: makeId("usr"),
      email: "parent1@ourhometution.com",
      fullName: "Parent One",
      role: "parent",
      createdAt: now - 1000 * 60 * 60 * 24 * 30,
      isActive: true,
    },
  ];

  const seedSubjects: Subject[] = [
    {
      id: makeId("subj"),
      name: "Mathematics",
      topics: [
        { id: makeId("topic"), name: "Algebra" },
        { id: makeId("topic"), name: "Geometry" },
      ],
      isActive: true,
      createdAt: now - 1000 * 60 * 60 * 24 * 20,
      updatedAt: now - 1000 * 60 * 60 * 24 * 2,
    },
    {
      id: makeId("subj"),
      name: "English",
      topics: [
        { id: makeId("topic"), name: "Grammar" },
        { id: makeId("topic"), name: "Writing" },
      ],
      isActive: true,
      createdAt: now - 1000 * 60 * 60 * 24 * 20,
      updatedAt: now - 1000 * 60 * 60 * 24 * 1,
    },
  ];

  const seedBookings: Booking[] = [
    {
      id: makeId("book"),
      parentEmail: "parent1@ourhometution.com",
      parentName: "Parent One",
      mentorEmail: "mentor1@ourhometution.com",
      mentorName: "Mentor One",
      subject: "Mathematics",
      topic: "Algebra",
      mode: "offline",
      status: "active",
      scheduledAt: now + 1000 * 60 * 60 * 2,
      createdAt: now - 1000 * 60 * 60 * 3,
    },
    {
      id: makeId("book"),
      parentEmail: "parent1@ourhometution.com",
      parentName: "Parent One",
      subject: "English",
      topic: "Grammar",
      mode: "online",
      status: "pending",
      scheduledAt: now + 1000 * 60 * 60 * 24,
      createdAt: now - 1000 * 60 * 60 * 5,
    },
  ];

  const seedQueries: SupportQuery[] = [
    {
      id: makeId("qry"),
      fromEmail: "parent1@ourhometution.com",
      fromName: "Parent One",
      subject: "Booking / Live tracking",
      message: "My booking is not showing on live tracking. Please help.",
      status: "unsolved",
      createdAt: now - 1000 * 60 * 40,
    },
    {
      id: makeId("qry"),
      fromEmail: "mentor1@ourhometution.com",
      fromName: "Mentor One",
      subject: "Profile / Subjects",
      message: "How to update my subject preferences?",
      status: "solved",
      createdAt: now - 1000 * 60 * 60 * 24 * 2,
      solvedAt: now - 1000 * 60 * 60 * 24,
    },
  ];

  const seedApplications: MentorApplication[] = [
    {
      id: makeId("app"),
      mentorEmail: "mentor1@ourhometution.com",
      mentorName: "Mentor One",
      subject: "Mathematics",
      experienceYears: 2,
      resumeUri: "resume://mentor1",
      status: "submitted",
      createdAt: now - 1000 * 60 * 60 * 7,
    },
  ];

  const seedJobs: JobPost[] = [
    {
      id: makeId("job"),
      criteria: {
        degreeLevel: "B.Ed",
        experience: "2+ Years",
        classTier: "Class 10",
        subject: "Mathematics",
        language: "English",
      },
      summary:
        "Need a Mathematics tutor for Class 10. Degree: B.Ed. Experience: 2+ Years. Language: English.",
      status: "open",
      createdAt: now - 1000 * 60 * 60 * 12,
    },
  ];

  await writeJson(KEYS.users, seedUsers);
  await writeJson(KEYS.subjects, seedSubjects);
  await writeJson(KEYS.bookings, seedBookings);
  await writeJson(KEYS.queries, seedQueries);
  await writeJson(KEYS.applications, seedApplications);
  await writeJson(KEYS.jobs, seedJobs);
  await writeJson(KEYS.badges, []);
  await writeJson(KEYS.mentorBadges, []);
}

