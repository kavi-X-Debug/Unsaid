import type { Metadata } from "next";
import { ProfilePageClient } from "./profile-client";
import { db } from "@/lib/firebase";
import type { AppUser, Question, Poll } from "@/lib/types";
import { collection, getDocs, query, where } from "firebase/firestore";

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

export default async function UserProfilePage(props: Props) {
  const username = props.params.username.toLowerCase();

  const userQuery = query(
    collection(db, "users"),
    where("username", "==", username)
  );
  const userSnapshot = await getDocs(userQuery);

  if (userSnapshot.empty) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center space-y-3">
          <h1 className="text-2xl font-semibold">Profile not found</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            We could not find a public profile for @{username}.
          </p>
        </div>
      </main>
    );
  }

  const userData = userSnapshot.docs[0].data() as AppUser;
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

  const pollsSnapshot = await getDocs(
    query(collection(db, "polls"), where("toUserId", "==", userId))
  );

  const publishedPolls: Poll[] = [];

  pollsSnapshot.forEach(docSnap => {
    const data = docSnap.data() as Omit<Poll, "id">;
    if (data.isPublished && !data.isReported) {
      publishedPolls.push({ id: docSnap.id, ...data });
    }
  });

  publishedPolls.sort((a, b) => {
    const aDate = a.createdAt?.toMillis?.() ?? 0;
    const bDate = b.createdAt?.toMillis?.() ?? 0;
    return bDate - aDate;
  });

  const stats = {
    totalQuestions,
    totalAnswered: answeredQuestions.length
  };

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
