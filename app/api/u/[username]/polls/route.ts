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
    const toUserId = typeof body.toUserId === "string" ? body.toUserId : "";
    const anonymousId =
      typeof body.anonymousId === "string" && body.anonymousId.length > 0
        ? body.anonymousId
        : null;
    const pollType = body.pollType === "multiple_choice" ? "multiple_choice" : "yes_no";
    const questionText = typeof body.questionText === "string" ? body.questionText.trim() : "";
    const options = Array.isArray(body.options) ? body.options : [];
    if (!toUserId || !questionText) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }
    if (containsProfanity(questionText)) {
      return NextResponse.json({ error: "Poll rejected by safety filters" }, { status: 400 });
    }
    const respectsPositiveOnly = await passesPositiveOnlyFilter(toUserId, questionText);
    if (!respectsPositiveOnly) {
      return NextResponse.json(
        { error: "Poll conflicts with positive-only mode" },
        { status: 400 }
      );
    }
    const forwarded = request.headers.get("x-forwarded-for") ?? "";
    const ip = forwarded.split(",")[0]?.trim() ?? "";
    const allowed = await checkAnonymousRateLimit(ip, toUserId);
    if (!allowed) {
      return NextResponse.json({ error: "Too many submissions. Try again later." }, { status: 429 });
    }
    const normalizedOptions =
      pollType === "yes_no"
        ? [
            { optionText: "Yes", voteCount: 0 },
            { optionText: "No", voteCount: 0 }
          ]
        : options
            .map((rawOption: unknown) =>
              typeof rawOption === "string" ? rawOption.trim() : ""
            )
            .filter((option: string) => option.length > 0)
            .slice(0, 4)
            .map((option: string) => ({ optionText: option, voteCount: 0 }));
    if (normalizedOptions.length < 2) {
      return NextResponse.json({ error: "Not enough options" }, { status: 400 });
    }
    await addDoc(collection(db, "polls"), {
      toUserId,
      anonymousId,
      pollType,
      questionText,
      options: normalizedOptions,
      isPublished: false,
      isReported: false,
      createdAt: serverTimestamp()
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to submit poll" }, { status: 500 });
  }
}
