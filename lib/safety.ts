import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "./firebase";

const bannedWords = ["badword1", "badword2"];
const negativeWords = ["hate", "kill", "stupid", "ugly", "dumb"];

export function containsProfanity(text: string) {
  const lower = text.toLowerCase();
  return bannedWords.some(word => lower.includes(word));
}

function violatesPositiveOnly(text: string) {
  const lower = text.toLowerCase();
  return negativeWords.some(word => lower.includes(word));
}

const WINDOW_MS = 60 * 60 * 1000;
const MAX_PER_WINDOW = 20;

export async function checkAnonymousRateLimit(ip: string, toUserId: string) {
  if (!ip) {
    return true;
  }
  const key = `${ip}_${toUserId}`;
  const ref = doc(db, "rateLimits", key);
  const snap = await getDoc(ref);
  const now = Date.now();
  if (!snap.exists()) {
    await setDoc(ref, {
      count: 1,
      windowStart: serverTimestamp()
    });
    return true;
  }
  const data = snap.data() as { count?: number; windowStart?: { toMillis?: () => number } };
  const count = data.count ?? 0;
  const startMillis = data.windowStart?.toMillis ? data.windowStart.toMillis() : now;
  if (now - startMillis > WINDOW_MS) {
    await setDoc(ref, {
      count: 1,
      windowStart: serverTimestamp()
    });
    return true;
  }
  if (count >= MAX_PER_WINDOW) {
    return false;
  }
  await setDoc(ref, {
    count: count + 1,
    windowStart: data.windowStart ?? serverTimestamp()
  });
  return true;
}

export async function passesPositiveOnlyFilter(toUserId: string, text: string) {
  const ref = doc(db, "users", toUserId);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    return true;
  }
  const data = snap.data() as { settings?: { positiveOnlyMode?: boolean } };
  if (!data.settings?.positiveOnlyMode) {
    return true;
  }
  return !violatesPositiveOnly(text);
}
