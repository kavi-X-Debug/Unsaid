import type { Metadata } from "next";
import { redirect } from "next/navigation";

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

export default async function PublicProfilePage(props: Props) {
  const username = props.params.username.toLowerCase();
  redirect(`/u/${username}`);
}
