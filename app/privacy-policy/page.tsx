import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy policy | Unsaid"
};

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-3">
        <h1 className="text-2xl font-semibold">Privacy policy</h1>
      </div>
    </main>
  );
}

