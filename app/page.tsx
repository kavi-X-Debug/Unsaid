"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useAuth } from "@/components/auth/auth-provider";

type Testimonial = {
  name: string;
  handle: string;
  role: string;
  quote: string;
  image: string;
};

const testimonials: Testimonial[] = [
  {
    name: "Aarav",
    handle: "@aaravwrites",
    role: "Student",
    quote:
      "Unsaid makes it so much easier to ask the things I am nervous to say out loud.",
    image:
      "https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&w=120&h=120&dpr=2"
  },
  {
    name: "Mia",
    handle: "@miacreates",
    role: "Content creator",
    quote:
      "My inbox feels organized instead of chaotic. It is the only anonymous Q&A I actually enjoy using.",
    image:
      "https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=120&h=120&dpr=2"
  },
  {
    name: "Noah",
    handle: "@noahcommunity",
    role: "Community lead",
    quote:
      "We use Unsaid for quick pulse checks and questions. People participate more when it is anonymous.",
    image:
      "https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=120&h=120&dpr=2"
  },
  {
    name: "Sara",
    handle: "@sara.codes",
    role: "Developer",
    quote:
      "I like that I can answer in my own time and only publish what feels right.",
    image:
      "https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=120&h=120&dpr=2"
  }
];

export default function LandingPage() {
  const { user, loading } = useAuth();
  const showAuthButtons = !loading && !user;
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const prefersReducedMotion = useReducedMotion();
  const sectionDuration = prefersReducedMotion ? 0 : 0.4;

  return (
    <main className="min-h-screen flex flex-col bg-gradient-to-b from-slate-50 via-slate-50 to-slate-100 dark:from-slate-950 dark:via-slate-950 dark:to-black">
      <motion.section
        className="flex-1 w-full"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: sectionDuration, ease: "easeOut" }}
      >
        <div className="mx-auto max-w-6xl px-4 py-12 md:py-16 lg:py-20 flex flex-col gap-10 md:grid md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] md:items-center">
          <div className="space-y-5 max-w-xl">
            <p className="text-[11px] uppercase tracking-[0.18em] text-sky-400/80">
              Anonymous questions made safe
            </p>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold leading-tight">
              <span className="bg-gradient-to-r from-sky-400 via-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
                Let people ask anything.
              </span>
              <span className="block text-slate-900 dark:text-slate-100">
                You decide what goes public.
              </span>
            </h1>
            <p className="text-sm md:text-base text-slate-900 dark:text-slate-300">
              Unsaid gives you a simple link where friends, followers, and communities
              can send anonymous questions and polls. You answer from a private inbox
              with reactions and safety tools built in.
            </p>
            {showAuthButtons && (
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Link
                  href="/signup"
                  className="inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-medium transition bg-sky-500 text-slate-950 hover:bg-sky-400 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50 dark:bg-sky-400 dark:hover:bg-sky-300 dark:text-slate-950 dark:focus-visible:ring-offset-slate-950"
                >
                  Get started free
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center rounded-full border border-slate-300 px-6 py-3 text-sm font-medium text-slate-900 hover:bg-slate-100 transition dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-900/80"
                >
                  Log in
                </Link>
              </div>
            )}
            <p className="text-[11px] text-slate-700 dark:text-slate-500">
              No one sees who asked. You control what gets published.
            </p>
          </div>
          <div className="relative">
            <div className="absolute inset-0 -z-10 rounded-3xl bg-sky-300/30 blur-3xl opacity-70 dark:bg-sky-500/20" />
            <div className="rounded-3xl border border-slate-200 bg-white shadow-xl shadow-sky-500/10 p-4 space-y-4 dark:border-slate-800 dark:bg-slate-950/70 dark:shadow-sky-500/20">
              <div className="flex items-center justify-between text-xs text-slate-700 dark:text-slate-400">
                <span className="inline-flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  Inbox
                </span>
                <span className="text-[10px] text-slate-600 dark:text-slate-500">New questions</span>
              </div>
              <div className="space-y-3 text-xs">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 space-y-2 dark:border-slate-800 dark:bg-slate-900/80">
                  <p className="text-slate-900 dark:text-slate-100">
                    What is something you wish more people understood about you?
                  </p>
                  <p className="text-slate-700 dark:text-slate-400">
                    Answer privately, then decide if you want to publish it.
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 space-y-2 dark:border-slate-800 dark:bg-slate-900/80">
                  <p className="text-slate-900 dark:text-slate-100">
                    Poll: Should I start a weekly Q&amp;A series?
                  </p>
                  <div className="grid gap-1">
                    <div className="flex items-center justify-between rounded-full bg-slate-200 px-3 py-1 dark:bg-slate-800">
                      <span className="text-slate-900 text-[11px] dark:text-slate-100">Yes, sounds fun</span>
                      <span className="text-slate-700 text-[10px] dark:text-slate-400">68%</span>
                    </div>
                    <div className="flex items-center justify-between rounded-full bg-slate-200 px-3 py-1 dark:bg-slate-900">
                      <span className="text-slate-900 text-[11px] dark:text-slate-100">Maybe, sometimes</span>
                      <span className="text-slate-700 text-[10px] dark:text-slate-400">24%</span>
                    </div>
                    <div className="flex items-center justify-between rounded-full bg-slate-200 px-3 py-1 dark:bg-slate-900">
                      <span className="text-slate-900 text-[11px] dark:text-slate-100">Not really</span>
                      <span className="text-slate-700 text-[10px] dark:text-slate-400">8%</span>
                    </div>
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 flex items-center justify-between dark:border-slate-800 dark:bg-slate-900/80">
                  <div className="space-y-1">
                    <p className="text-[11px] text-slate-700 dark:text-slate-400">Share your link</p>
                    <p className="text-[11px] text-slate-900 truncate max-w-[200px] dark:text-slate-100">
                      unsaid.app/yourname
                    </p>
                  </div>
                  <span className="inline-flex items-center justify-center rounded-full bg-sky-100 text-sky-700 text-[11px] px-3 py-1 border border-sky-300 dark:bg-sky-500/10 dark:text-sky-400 dark:border-sky-500/40">
                    Copy
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.section>
      <motion.section
        className="border-t border-slate-200 bg-slate-50/90 backdrop-blur-sm dark:border-slate-800/60 dark:bg-slate-950/70"
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: sectionDuration, ease: "easeOut" }}
      >
        <div className="mx-auto max-w-5xl px-4 py-10 space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
              Everything you need in one place
            </h2>
            <p className="text-sm text-slate-700 dark:text-slate-400">
              Floating cards that keep the most important tools close and easy to understand.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <motion.div
              whileHover={{ y: -4 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="rounded-2xl border border-slate-200 bg-white/90 shadow-sm shadow-slate-200/70 p-4 space-y-2 dark:border-slate-800 dark:bg-slate-900/80 dark:shadow-slate-900/60"
            >
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Separate chats for each anonymous user
              </p>
              <p className="text-xs text-slate-700 dark:text-slate-400">
                Every visitor gets their own private conversation, so messages never mix and each chat
                feels personal.
              </p>
            </motion.div>
            <motion.div
              whileHover={{ y: -4 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="rounded-2xl border border-slate-200 bg-white/90 shadow-sm shadow-slate-200/70 p-4 space-y-2 dark:border-slate-800 dark:bg-slate-900/80 dark:shadow-slate-900/60"
            >
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                One simple profile link
              </p>
              <p className="text-xs text-slate-700 dark:text-slate-400">
                Share a single link everywhere. Behind the scenes, Unsaid keeps sessions separate per
                browser for extra privacy.
              </p>
            </motion.div>
            <motion.div
              whileHover={{ y: -4 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="rounded-2xl border border-slate-200 bg-white/90 shadow-sm shadow-slate-200/70 p-4 space-y-2 dark:border-slate-800 dark:bg-slate-900/80 dark:shadow-slate-900/60"
            >
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Private answers, public when you choose
              </p>
              <p className="text-xs text-slate-700 dark:text-slate-400">
                Read and answer in your inbox first. Only publish what feels right for your audience.
              </p>
            </motion.div>
            <motion.div
              whileHover={{ y: -4 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="rounded-2xl border border-slate-200 bg-white/90 shadow-sm shadow-slate-200/70 p-4 space-y-2 dark:border-slate-800 dark:bg-slate-900/80 dark:shadow-slate-900/60"
            >
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Anonymous polls that match your chats
              </p>
              <p className="text-xs text-slate-700 dark:text-slate-400">
                Create quick yes/no or multiple-choice polls that stay linked to each anonymous
                conversation.
              </p>
            </motion.div>
            <motion.div
              whileHover={{ y: -4 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="rounded-2xl border border-slate-200 bg-white/90 shadow-sm shadow-slate-200/70 p-4 space-y-2 dark:border-slate-800 dark:bg-slate-900/80 dark:shadow-slate-900/60"
            >
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Safety tools built in
              </p>
              <p className="text-xs text-slate-700 dark:text-slate-400">
                Use reporting and positive-only settings to keep your space kind, calm, and
                comfortable to use.
              </p>
            </motion.div>
            <motion.div
              whileHover={{ y: -4 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="rounded-2xl border border-slate-200 bg-white/90 shadow-sm shadow-slate-200/70 p-4 space-y-2 dark:border-slate-800 dark:bg-slate-900/80 dark:shadow-slate-900/60"
            >
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                User-friendly from phone to desktop
              </p>
              <p className="text-xs text-slate-700 dark:text-slate-400">
                Cards adapt to any screen, so sending questions and answering them always feels light
                and easy.
              </p>
            </motion.div>
          </div>
        </div>
      </motion.section>
      <motion.section
        className="border-t border-slate-900/70 bg-black/90"
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: sectionDuration, ease: "easeOut" }}
      >
        <div className="mx-auto max-w-5xl px-4 py-12 space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-xl font-semibold text-slate-100">
              What people are saying about Unsaid
            </h2>
            <p className="text-sm text-slate-400">
              A few made-up comments to show how feedback on Unsaid can look.
            </p>
          </div>
          {testimonials.length > 0 && (
            <div className="flex justify-center">
              <div className="w-full max-w-xl space-y-4">
                <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 space-y-3">
                  <div className="flex items-center gap-3">
                    <Image
                      src={testimonials[activeTestimonial].image}
                      alt={testimonials[activeTestimonial].name}
                      width={48}
                      height={48}
                      className="h-12 w-12 rounded-full object-cover border border-slate-700"
                    />
                    <div className="space-y-0.5">
                      <p className="text-sm font-semibold text-slate-100">
                        {testimonials[activeTestimonial].name}
                      </p>
                      <p className="text-xs text-slate-400">
                        {testimonials[activeTestimonial].handle}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {testimonials[activeTestimonial].role}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-slate-200 leading-relaxed">
                    “{testimonials[activeTestimonial].quote}”
                  </p>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1 justify-center">
                  {testimonials.map((person, index) => {
                    const isActive = index === activeTestimonial;
                    const baseClasses =
                      "flex items-center gap-2 rounded-full border px-3 py-1 text-xs whitespace-nowrap transition";
                    const activeClasses =
                      "border-sky-400 bg-sky-500/10 text-slate-50";
                    const inactiveClasses =
                      "border-slate-700 bg-slate-900/60 text-slate-400 hover:border-slate-500";
                    const classes = [
                      baseClasses,
                      isActive ? activeClasses : inactiveClasses
                    ].join(" ");
                    return (
                      <button
                        key={person.handle}
                        type="button"
                        onClick={() => setActiveTestimonial(index)}
                        className={classes}
                      >
                        <span className="inline-flex h-6 w-6 items-center justify-center overflow-hidden rounded-full border border-slate-700 bg-slate-800">
                          <Image
                            src={person.image}
                            alt={person.name}
                            width={24}
                            height={24}
                            className="h-6 w-6 object-cover"
                          />
                        </span>
                        <span>{person.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.section>
    </main>
  );
}
