import AsyncStorage from "@react-native-async-storage/async-storage";
import { upsertRepoUser } from "../data/repo/repo";

export type UserRole = "parent" | "admin" | "mentor";

export interface StoredUser {
  id: string;
  email: string;
  fullName: string;
  password: string; // dev-only (local demo). Replace with real auth backend later.
  role: UserRole;
  createdAt: number;
  phone?: string;
}

const USERS_KEY = "oht_users_v1";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

async function loadUsers(): Promise<StoredUser[]> {
  const raw = await AsyncStorage.getItem(USERS_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as StoredUser[]) : [];
  } catch {
    return [];
  }
}

async function saveUsers(users: StoredUser[]) {
  await AsyncStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export async function registerUser(input: {
  email: string;
  fullName: string;
  password: string;
  role: UserRole;
}) {
  const email = normalizeEmail(input.email);
  const fullName = input.fullName.trim();

  if (!email || !fullName || !input.password) {
    throw new Error("Missing required fields");
  }

  const users = await loadUsers();
  const existing = users.find((u) => normalizeEmail(u.email) === email);
  if (existing) {
    throw new Error("Account already exists. Please sign in.");
  }

  const user: StoredUser = {
    id: `usr_${Math.random().toString(16).slice(2)}_${Date.now()}`,
    email,
    fullName,
    password: input.password,
    role: input.role,
    createdAt: Date.now(),
  };

  await saveUsers([user, ...users]);

  // Keep repo users in sync so Admin → Mentors / booking assign lists see new accounts
  try {
    await upsertRepoUser({
      email: user.email,
      fullName: user.fullName,
      role: input.role,
      isActive: true,
    });
  } catch (e) {
    console.warn("upsertRepoUser failed (mentor may not show in admin until fixed):", e);
  }

  return user;
}

export async function loginUser(emailInput: string, password: string) {
  const email = normalizeEmail(emailInput);
  if (!email || !password) {
    throw new Error("Please enter email and password.");
  }

  const users = await loadUsers();
  const user = users.find((u) => normalizeEmail(u.email) === email);
  if (!user || user.password !== password) {
    throw new Error("Invalid email or password.");
  }

  return user;
}

/** Local demo: update profile fields for the logged-in account */
export async function updateStoredUser(
  currentEmail: string,
  patch: { email?: string; fullName?: string; phone?: string }
): Promise<StoredUser> {
  const users = await loadUsers();
  const n = normalizeEmail(currentEmail);
  let updated: StoredUser | null = null;
  const next = users.map((u) => {
    if (normalizeEmail(u.email) !== n) return u;
    const neu: StoredUser = {
      ...u,
      ...patch,
      email: patch.email ? normalizeEmail(patch.email) : u.email,
      fullName: patch.fullName !== undefined ? patch.fullName.trim() : u.fullName,
      phone: patch.phone !== undefined ? patch.phone : u.phone,
    };
    updated = neu;
    return neu;
  });
  if (!updated) throw new Error("User not found");
  await saveUsers(next);

  try {
    await upsertRepoUser({
      email: updated.email,
      fullName: updated.fullName,
      role: updated.role,
      isActive: true,
    });
  } catch (e) {
    console.warn("upsertRepoUser after profile update failed:", e);
  }

  return updated;
}

