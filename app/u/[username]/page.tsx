import type { Metadata } from "next";
import { ProfilePageClient } from "./profile-client";
import { db } from "@/lib/firebase";
import type { AppUser, Question, Poll } from "@/lib/types";
import { collection, doc, getDocs, query, updateDoc, where, increment } from "firebase/firestore";

type Props = {
  params: {
    username: string;
  };
};

export function generateMetadata(props: Props): Metadata {
  const username = props.params.username.toLowerCase();
  const displayUsername = props.params.username;
  const baseUrl = "https://unsaid.app";
  const url = `${baseUrl}/u/${username}`;
  const title = `Send Anonymous Messages to ${displayUsername} | Unsaid`;
  const description = `Send anonymous messages, react to messages, and vote in polls on ${displayUsername}'s Unsaid profile.`;
  return {
    title,
    description,
    alternates: {
      canonical: url
    },
    openGraph: {
      title,
      description,
      url,
      siteName: "Unsaid",
      images: [
        {
          url: `${baseUrl}/favicon.png`,
          width: 512,
          height: 512,
          alt: "Unsaid"
        }
      ],
      type: "website"
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`${baseUrl}/favicon.png`]
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
