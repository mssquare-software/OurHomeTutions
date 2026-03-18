import AsyncStorage from "@react-native-async-storage/async-storage";
import type { UserRole } from "./authService";

export type EmailType = "welcome" | "login" | "hrDecision" | "zoomLink";

export interface OutboxEmail {
  id: string;
  type: EmailType;
  to: string;
  subject: string;
  body: string;
  createdAt: number;
  meta?: Record<string, any>;
}

const OUTBOX_KEY = "oht_outbox_v1";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

async function loadOutbox(): Promise<OutboxEmail[]> {
  const raw = await AsyncStorage.getItem(OUTBOX_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as OutboxEmail[]) : [];
  } catch {
    return [];
  }
}

async function saveOutbox(items: OutboxEmail[]) {
  await AsyncStorage.setItem(OUTBOX_KEY, JSON.stringify(items));
}

async function enqueue(email: Omit<OutboxEmail, "id" | "createdAt">) {
  const outbox = await loadOutbox();
  const item: OutboxEmail = {
    ...email,
    id: `mail_${Math.random().toString(16).slice(2)}_${Date.now()}`,
    createdAt: Date.now(),
  };
  await saveOutbox([item, ...outbox]);
  return item;
}

function roleLabel(role: UserRole) {
  if (role === "admin") return "Admin";
  if (role === "mentor") return "Mentor";
  return "Parent";
}

function buildWelcomeBody(fullName: string) {
  return `Hi, ${fullName}\n\nThanks to Register at our App ourHomeTution\npls signin to enjoy our Services\n\nCEO Santosh`;
}

export async function sendWelcomeEmail(input: {
  fullName: string;
  email: string;
  role: UserRole;
}) {
  const to = normalizeEmail(input.email);
  const subject = `Welcome to OurHomeTution (${roleLabel(input.role)})`;
  const body = buildWelcomeBody(input.fullName.trim());
  return enqueue({ type: "welcome", to, subject, body, meta: { role: input.role } });
}

export async function sendLoginEmail(input: {
  fullName: string;
  email: string;
  role: UserRole;
}) {
  const to = normalizeEmail(input.email);
  const subject = `Sign in success (${roleLabel(input.role)})`;
  const body = `Hi, ${input.fullName.trim()}\n\nYou signed in to ourHomeTution.\n\nCEO Santosh`;
  return enqueue({ type: "login", to, subject, body, meta: { role: input.role } });
}

export async function sendHRDecisionEmail(input: {
  fullName: string;
  email: string;
  decision: "accepted" | "rejected";
  jobTitle?: string;
}) {
  const to = normalizeEmail(input.email);
  const subject = `HR Decision: ${input.decision.toUpperCase()}`;
  const body = `Hi, ${input.fullName.trim()}\n\nYour job request has been ${input.decision}.${
    input.jobTitle ? `\nJob: ${input.jobTitle}` : ""
  }\n\nCEO Santosh`;
  return enqueue({ type: "hrDecision", to, subject, body, meta: input });
}

export async function sendZoomLinkEmail(input: {
  parentName: string;
  parentEmail: string;
  zoomLink: string;
  bookingId: string;
}) {
  const to = normalizeEmail(input.parentEmail);
  const subject = "Online Session Zoom Link";
  const body = `Hi, ${input.parentName}\n\nYour online session is ready.\nZoom Link: ${input.zoomLink}\nBooking ID: ${input.bookingId}\n\nCEO Santosh`;
  return enqueue({ type: "zoomLink", to, subject, body, meta: input });
}

export async function getOutbox() {
  return loadOutbox();
}

export async function clearOutbox() {
  await AsyncStorage.removeItem(OUTBOX_KEY);
}

