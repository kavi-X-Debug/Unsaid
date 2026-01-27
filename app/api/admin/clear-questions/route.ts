import { NextRequest, NextResponse } from "next/server";
import { collection, deleteDoc, getDocs, doc } from "firebase/firestore";
import { db } from "../../../../lib/firebase";

export async function POST(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get("secret");
  const expected = process.env.MIGRATION_SECRET;
  if (!secret || !expected || secret !== expected) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const snapshot = await getDocs(collection(db, "questions"));
  let deleted = 0;
  for (const questionDoc of snapshot.docs) {
    await deleteDoc(doc(db, "questions", questionDoc.id));
    deleted += 1;
  }
  return NextResponse.json({
    ok: true,
    deleted
  });
}

