import type { Timestamp } from "firebase/firestore";

export type UserSettings = {
  positiveOnlyMode: boolean;
};

export type AppUser = {
  uid: string;
  username: string;
  bio?: string;
  avatarUrl?: string;
  createdAt: Timestamp | null;
  settings: UserSettings;
  profileViews?: number;
};

export type ReactionCounts = {
  heart: number;
  laugh: number;
  wow: number;
};

export type Question = {
  id: string;
  toUserId: string;
  anonymousId?: string | null;
  chatId?: string;
  questionText: string;
  answerText?: string;
  isAnswered: boolean;
  isReported: boolean;
  createdAt: Timestamp | null;
  answeredAt?: Timestamp | null;
  reactionCounts?: ReactionCounts;
};

export type PollOption = {
  optionText: string;
  voteCount: number;
};

export type PollType = "yes_no" | "multiple_choice";

export type Poll = {
  id: string;
  toUserId: string;
  anonymousId?: string | null;
  chatId?: string;
  pollType: PollType;
  questionText?: string;
  options: PollOption[];
  isPublished: boolean;
  isReported?: boolean;
  createdAt: Timestamp | null;
  ownerSelection?: number | null;
};

export type Chat = {
  id: string;
  receiverUserId: string;
  token: string;
  createdAt: Timestamp | null;
};

export type Message = {
  id: string;
  chatId: string;
  messageText: string;
  createdAt: Timestamp | null;
  sender: "anonymous";
};
