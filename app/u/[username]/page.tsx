import type { Metadata } from "next";
import { ProfilePageClient } from "./profile-client";

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

export default function UserProfilePage(props: Props) {
  const username = props.params.username.toLowerCase();
  return <ProfilePageClient username={username} />;
}
