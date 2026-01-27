import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { collection, doc, getDocs, query, updateDoc, where, increment } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { AppUser, Question, Poll } from "@/lib/types";
import { ProfilePageClient } from "../../u/[username]/profile-client";

type Props = {
  params: {
    username: string;
  };
};

export function generateMetadata(props: Props): Metadata {
  const username = props.params.username.toLowerCase();
  const title = `${username} • Unsaid profile`;
  const description = `Send anonymous questions and polls to @${username} on Unsaid.`;
  return {
    title,
    description,
    openGraph: {
      title,
      description
    }
  };
}

export default async function PublicProfilePage(props: Props) {
  const username = props.params.username.toLowerCase();

  const userQuery = query(collection(db, "users"), where("username", "==", username));
  const userSnapshot = await getDocs(userQuery);

  if (userSnapshot.empty) {
    notFound();
  }

  const userDoc = userSnapshot.docs[0];
  const userData = userDoc.data() as AppUser;
  const userId = userData.uid;

  const questionsSnapshot = await getDocs(
    query(collection(db, "questions"), where("toUserId", "==", userId))
  );

  let totalQuestions = 0;
  const answeredQuestions: Question[] = [];

  questionsSnapshot.forEach(docSnap => {
    const data = docSnap.data() as Omit<Question, "id">;
    totalQuestions += 1;
    if (data.isAnswered && !data.isReported) {
      answeredQuestions.push({ id: docSnap.id, ...data });
    }
  });

  answeredQuestions.sort((a, b) => {
    const aDate = a.createdAt?.toMillis?.() ?? 0;
    const bDate = b.createdAt?.toMillis?.() ?? 0;
    return bDate - aDate;
  });

  const publishedPolls: Poll[] = [];

  const currentViews = (userData as any).profileViews ?? 0;
  const stats = {
    totalQuestions,
    totalAnswered: answeredQuestions.length,
    totalPolls: publishedPolls.length,
    totalViews: currentViews + 1
  };

  try {
    const userRef = doc(db, "users", userDoc.id);
    await updateDoc(userRef, { profileViews: increment(1) });
  } catch {
  }

  return (
    <ProfilePageClient
      username={username}
      user={userData}
      stats={stats}
      questions={answeredQuestions}
      polls={publishedPolls}
    />
  );
}
