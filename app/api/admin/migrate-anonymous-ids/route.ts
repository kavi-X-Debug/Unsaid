import { NextRequest, NextResponse } from "next/server";
import { collection, getDocs, updateDoc, doc } from "firebase/firestore";
import { db } from "../../../../lib/firebase";

export async function POST(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get("secret");
  const expected = process.env.MIGRATION_SECRET;
  if (!secret || !expected || secret !== expected) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  let updatedQuestions = 0;
  let updatedPolls = 0;
  const questionsSnapshot = await getDocs(collection(db, "questions"));
  const legacyAnonymousIds = new Map<string, string>();
  for (const questionDoc of questionsSnapshot.docs) {
    const data = questionDoc.data() as { toUserId?: string; anonymousId?: string | null };
    if (data.anonymousId) {
      continue;
    }
    const toUserId = data.toUserId;
    if (!toUserId) {
      continue;
    }
    let anonymousId = legacyAnonymousIds.get(toUserId);
    if (!anonymousId) {
      anonymousId = `legacy-${toUserId}`;
      legacyAnonymousIds.set(toUserId, anonymousId);
    }
    await updateDoc(doc(db, "questions", questionDoc.id), {
      anonymousId
    });
    updatedQuestions += 1;
  }
  const pollsSnapshot = await getDocs(collection(db, "polls"));
  for (const pollDoc of pollsSnapshot.docs) {
    const data = pollDoc.data() as { toUserId?: string; anonymousId?: string | null };
    if (data.anonymousId) {
      continue;
    }
    const toUserId = data.toUserId;
    if (!toUserId) {
      continue;
    }
    let anonymousId = legacyAnonymousIds.get(toUserId);
    if (!anonymousId) {
      anonymousId = `legacy-${toUserId}`;
      legacyAnonymousIds.set(toUserId, anonymousId);
    }
    await updateDoc(doc(db, "polls", pollDoc.id), {
      anonymousId
    });
    updatedPolls += 1;
  }
  return NextResponse.json({
    ok: true,
    updatedQuestions,
    updatedPolls
  });
}

