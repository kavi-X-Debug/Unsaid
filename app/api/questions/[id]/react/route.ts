import { NextRequest, NextResponse } from "next/server";
import { doc, getDoc, increment, updateDoc } from "firebase/firestore";
import { db } from "../../../../../lib/firebase";

const allowedReactions = ["heart", "laugh", "wow"] as const;

type ReactionType = (typeof allowedReactions)[number];

export async function POST(request: NextRequest, context: { params: { id: string } }) {
  try {
    const body = await request.json();
    const reactionType = body.reactionType as ReactionType | undefined;
    if (!reactionType || !allowedReactions.includes(reactionType)) {
      return NextResponse.json({ error: "Invalid reaction" }, { status: 400 });
    }
    const ref = doc(db, "questions", context.params.id);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 });
    }
    const data = snap.data() as { isAnswered?: boolean; isReported?: boolean };
    if (!data.isAnswered || data.isReported) {
      return NextResponse.json(
        { error: "Reactions allowed only on visible answers" },
        { status: 400 }
      );
    }
    await updateDoc(ref, {
      [`reactionCounts.${reactionType}`]: increment(1)
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to add reaction" }, { status: 500 });
  }
}

