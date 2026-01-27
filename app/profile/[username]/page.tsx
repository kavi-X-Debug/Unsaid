import type { Metadata } from "next";
import { redirect } from "next/navigation";

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
  redirect(`/u/${username}`);
}
