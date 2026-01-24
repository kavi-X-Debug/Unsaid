import { NextRequest, NextResponse } from "next/server";
import { doc, runTransaction } from "firebase/firestore";
import { db } from "../../../../../lib/firebase";

export async function POST(request: NextRequest, context: { params: { id: string } }) {
  try {
    const body = await request.json();
    const optionIndex =
      typeof body.optionIndex === "number" && Number.isInteger(body.optionIndex)
        ? body.optionIndex
        : -1;
    if (optionIndex < 0) {
      return NextResponse.json({ error: "Invalid option index" }, { status: 400 });
    }
    const ref = doc(db, "polls", context.params.id);
    await runTransaction(db, async transaction => {
      const snap = await transaction.get(ref);
      if (!snap.exists()) {
        throw new Error("not_found");
      }
      const data = snap.data() as {
        isPublished?: boolean;
        isReported?: boolean;
        options?: { optionText: string; voteCount: number }[];
      };
      if (!data.isPublished || data.isReported) {
        throw new Error("not_open");
      }
      const options = data.options ?? [];
      if (optionIndex >= options.length) {
        throw new Error("invalid_option");
      }
      const updated = options.map((option, index) =>
        index === optionIndex
          ? { ...option, voteCount: (option.voteCount ?? 0) + 1 }
          : option
      );
      transaction.update(ref, { options: updated });
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "not_found") {
        return NextResponse.json({ error: "Poll not found" }, { status: 404 });
      }
      if (error.message === "not_open") {
        return NextResponse.json({ error: "Poll is not open for voting" }, { status: 400 });
      }
      if (error.message === "invalid_option") {
        return NextResponse.json({ error: "Invalid option" }, { status: 400 });
      }
    }
    return NextResponse.json({ error: "Failed to submit vote" }, { status: 500 });
  }
}

