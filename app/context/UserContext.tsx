import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

const AVATAR_STORAGE_KEY = "parent_avatar";
const USER_STORAGE_KEY = "parent_user";

export const AVATAR_OPTIONS: { id: number; source: number }[] = [
  { id: 1, source: require("../../assets/avatar/teacher.png") },
  { id: 2, source: require("../../assets/avatar/school-boy.png") },
  { id: 3, source: require("../../assets/avatar/man-with-hat.png") },
  { id: 4, source: require("../../assets/avatar/man-with-hat (1).png") },
  { id: 5, source: require("../../assets/avatar/fashion-designer.png") },
];

type UserRole = "parent" | "admin" | "mentor" | null;

interface UserState {
  email: string | null;
  parentName: string;
  selectedAvatarId: number;
  role: UserRole;
}

interface UserContextType extends UserState {
  setUser: (email: string, parentName: string, role: UserRole) => Promise<void>;
  setAvatar: (avatarId: number) => Promise<void>;
  clearUser: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [email, setEmail] = useState<string | null>(null);
  const [parentName, setParentName] = useState<string>("Parent");
  const [selectedAvatarId, setSelectedAvatarId] = useState<number>(1);
  const [role, setRole] = useState<UserRole>(null);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(USER_STORAGE_KEY);
        if (raw) {
          const { email: e, parentName: n, role: storedRole } = JSON.parse(raw);
          setEmail(e);
          setParentName(n || "Parent");
          setRole(storedRole ?? "parent");
          const avatarRaw = await AsyncStorage.getItem(`${AVATAR_STORAGE_KEY}_${e}`);
          if (avatarRaw != null) {
            const num = Math.max(1, Math.min(Number(avatarRaw) || 1, AVATAR_OPTIONS.length));
            setSelectedAvatarId(num);
          } else {
            const randomId = Math.floor(Math.random() * AVATAR_OPTIONS.length) + 1;
            setSelectedAvatarId(randomId);
            await AsyncStorage.setItem(`${AVATAR_STORAGE_KEY}_${e}`, String(randomId));
          }
        }
      } catch (err) {
        console.log("UserContext load error:", err);
      }
    })();
  }, []);

  const setUser = useCallback(async (newEmail: string, newName: string, newRole: UserRole) => {
    setEmail(newEmail);
    setParentName(newName);
    setRole(newRole);
    await AsyncStorage.setItem(
      USER_STORAGE_KEY,
      JSON.stringify({ email: newEmail, parentName: newName, role: newRole })
    );
    try {
      const existing = await AsyncStorage.getItem(`${AVATAR_STORAGE_KEY}_${newEmail}`);
      if (existing != null) {
        const num = Math.max(1, Math.min(Number(existing) || 1, AVATAR_OPTIONS.length));
        setSelectedAvatarId(num);
      } else {
        const randomId = Math.floor(Math.random() * AVATAR_OPTIONS.length) + 1;
        setSelectedAvatarId(randomId);
        await AsyncStorage.setItem(`${AVATAR_STORAGE_KEY}_${newEmail}`, String(randomId));
      }
    } catch {
      setSelectedAvatarId(1);
    }
  }, []);

  const setAvatar = useCallback(async (avatarId: number) => {
    setSelectedAvatarId(avatarId);
    if (email) {
      try {
        await AsyncStorage.setItem(`${AVATAR_STORAGE_KEY}_${email}`, String(avatarId));
      } catch (err) {
        console.log("setAvatar save error:", err);
      }
    }
  }, [email]);

  const clearUser = useCallback(async () => {
    setEmail(null);
    setParentName("Parent");
    setSelectedAvatarId(1);
    setRole(null);
    await AsyncStorage.removeItem(USER_STORAGE_KEY);
  }, []);

  const value: UserContextType = {
    email,
    parentName,
    selectedAvatarId,
    role,
    setUser,
    setAvatar,
    clearUser,
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (ctx === undefined) {
    throw new Error("useUser must be used within UserProvider");
  }
  return ctx;
}
