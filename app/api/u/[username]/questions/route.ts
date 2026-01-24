import { NextRequest, NextResponse } from "next/server";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../../../../../lib/firebase";
import {
  checkAnonymousRateLimit,
  containsProfanity,
  passesPositiveOnlyFilter
} from "../../../../../lib/safety";

export async function POST(request: NextRequest, context: { params: { username: string } }) {
  try {
    const body = await request.json();
    const questionText = typeof body.questionText === "string" ? body.questionText.trim() : "";
    const toUserId = typeof body.toUserId === "string" ? body.toUserId : "";
    if (!questionText || !toUserId) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }
    if (containsProfanity(questionText)) {
      return NextResponse.json({ error: "Question rejected by safety filters" }, { status: 400 });
    }
    const respectsPositiveOnly = await passesPositiveOnlyFilter(toUserId, questionText);
    if (!respectsPositiveOnly) {
      return NextResponse.json(
        { error: "Question conflicts with positive-only mode" },
        { status: 400 }
      );
    }
    const forwarded = request.headers.get("x-forwarded-for") ?? "";
    const ip = forwarded.split(",")[0]?.trim() ?? "";
    const allowed = await checkAnonymousRateLimit(ip, toUserId);
    if (!allowed) {
      return NextResponse.json({ error: "Too many submissions. Try again later." }, { status: 429 });
    }
    await addDoc(collection(db, "questions"), {
      toUserId,
      questionText,
      answerText: null,
      isAnswered: false,
      isReported: false,
      createdAt: serverTimestamp(),
      reactionCounts: {
        heart: 0,
        laugh: 0,
        wow: 0
      }
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to submit question" }, { status: 500 });
  }
}
