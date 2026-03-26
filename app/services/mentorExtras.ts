import AsyncStorage from "@react-native-async-storage/async-storage";

const key = (email: string) => `oht_mentor_extra_v1_${email.trim().toLowerCase()}`;

export type MentorExtras = {
  phone?: string;
};

export async function getMentorExtras(email: string): Promise<MentorExtras> {
  try {
    const raw = await AsyncStorage.getItem(key(email));
    if (!raw) return {};
    return JSON.parse(raw) as MentorExtras;
  } catch {
    return {};
  }
}

export async function setMentorExtras(email: string, extras: MentorExtras): Promise<void> {
  await AsyncStorage.setItem(key(email), JSON.stringify(extras));
}
