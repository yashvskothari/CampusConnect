import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BriefcaseBusiness,
  CheckCircle2,
  MessageCircle,
  Sparkles,
  Star,
  Users,
  WalletCards,
} from 'lucide-react';

import Button from '../components/Button';

export default function AboutUsPage() {
  return (
    <div className="min-h-screen bg-surface-0 text-surface-900">
      {/* =========================================================
          HERO
      ========================================================= */}
      <section className="relative isolate overflow-hidden border-b border-white/6">
        {/* Subtle background glow */}
        <div className="pointer-events-none absolute -left-40 -top-40 h-80 w-80 rounded-full bg-primary-500/8 blur-[100px]" />
        <div className="pointer-events-none absolute -right-40 top-20 h-96 w-96 rounded-full bg-primary-500/6 blur-[120px]" />

        <div className="relative mx-auto max-w-7xl px-4 pb-20 pt-16 sm:px-6 sm:pb-24 sm:pt-20 lg:px-8 lg:pb-28 lg:pt-24">
          <div className="mx-auto max-w-4xl text-center">
            {/* Label */}
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary-500/15 bg-primary-500/6 px-3 py-1.5 text-xs font-medium text-primary-400">
              <span className="h-1.5 w-1.5 rounded-full bg-primary-500" />
              About GigVerse
            </div>

            {/* Heading */}
            <h1 className="text-4xl font-bold tracking-tight text-surface-900 sm:text-5xl lg:text-6xl">
              Where talent meets
              <span className="block text-primary-400">
                opportunity.
              </span>
            </h1>

            {/* Description */}
            <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-surface-700 sm:text-lg sm:leading-8">
              GigVerse is a freelance marketplace connecting clients with skilled
              student talent — making it easier to find the right people,
              discover meaningful work, and turn ideas into results.
            </p>

            {/* CTA */}
            <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
              <Link to="/services" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  className="
                    w-full
                    border border-primary-400
                    bg-primary-500
                    text-[#171713]
                    shadow-[0_4px_20px_rgba(217,154,30,0.12)]
                    transition-all duration-200
                    hover:bg-primary-400
                    hover:shadow-[0_6px_25px_rgba(217,154,30,0.20)]
                    sm:w-auto
                  "
                >
                  Explore Services
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>

              <Link to="/jobs" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  variant="outline"
                  className="
                    w-full
                    border-surface-400
                    bg-white/2
                    text-surface-900
                    hover:border-surface-500
                    hover:bg-white/5
                    sm:w-auto
                  "
                >
                  Browse Jobs
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          OUR PURPOSE
      ========================================================= */}
      <section className="border-b border-white/6 bg-surface-0">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
          <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
            {/* Left */}
            <div>
              <div className="flex items-center gap-2 text-sm text-surface-600">
                <span className="h-1.5 w-1.5 rounded-full bg-primary-500" />
                Why GigVerse
              </div>

              <h2 className="mt-3 text-3xl font-bold tracking-tight text-surface-900 sm:text-4xl">
                Built for both sides of the opportunity.
              </h2>
            </div>

            {/* Right */}
            <div className="space-y-5 text-sm leading-7 text-surface-700 sm:text-base">
              <p>
                Great work starts with the right connection. GigVerse gives student
                freelancers a place to showcase what they can do while giving
                clients a simpler way to discover emerging talent.
              </p>

              <p>
                For clients, that means access to capable, motivated talent for
                projects of different sizes. For freelancers, it means
                opportunities to apply their skills, build credibility, and
                gain real-world experience.
              </p>

              <p>
                The goal is simple: make it easier for the right talent and the right
                opportunity to find each other — and make the work that follows
                straightforward for everyone.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          TWO SIDES
      ========================================================= */}
      <section className="bg-surface-50 border-b border-white/6">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mb-4 inline-flex items-center gap-2 text-sm text-surface-600">
              <Users className="h-4 w-4 text-primary-400" />
              One platform, two sides
            </div>

            <h2 className="text-3xl font-bold tracking-tight text-surface-900 sm:text-4xl">
              Two sides. One shared goal.
            </h2>

            <p className="mt-4 text-sm leading-6 text-surface-700 sm:text-base">
              GigVerse brings clients and student freelancers together through a
              straightforward marketplace designed to make finding, hiring,
              and working together easier.
            </p>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-2">
            {/* Freelancer */}
            <div className="rounded-xl border border-white/6 bg-surface-100 p-6 transition-colors hover:border-primary-500/20 sm:p-8">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-500/8">
                <BriefcaseBusiness className="h-5 w-5 text-primary-400" />
              </div>

              <h3 className="mt-5 text-xl font-semibold text-surface-900">
                For Student Freelancers
              </h3>

              <p className="mt-3 text-sm leading-6 text-surface-700">
                Showcase what you do, find projects that fit your skills, and build
                experience and credibility while you study.
              </p>

              <ul className="mt-6 space-y-3">
                {[
                  'Create and showcase your services',
                  'Discover relevant jobs',
                  'Submit bids and proposals',
                  'Build your profile and ratings',
                ].map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2.5 text-sm text-surface-700"
                  >
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary-400" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Client */}
            <div className="rounded-xl border border-white/6 bg-surface-100 p-6 transition-colors hover:border-primary-500/20 sm:p-8">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-500/8">
                <Users className="h-5 w-5 text-primary-400" />
              </div>

              <h3 className="mt-5 text-xl font-semibold text-surface-900">
                For Clients
              </h3>

              <p className="mt-3 text-sm leading-6 text-surface-700">
                Find motivated student freelancers with fresh skills and ideas to
                help move your projects forward.
              </p>

              <ul className="mt-6 space-y-3">
                {[
                  'Post jobs with your requirements',
                  'Receive proposals from freelancers',
                  'Compare bids and delivery estimates',
                  'Hire and communicate with students',
                ].map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2.5 text-sm text-surface-700"
                  >
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary-400" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          HOW IT WORKS
      ========================================================= */}
      <section className="border-b border-white/6 bg-surface-0">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 text-sm text-surface-600">
              <span className="h-1.5 w-1.5 rounded-full bg-primary-500" />
              The GigVerse Experience
            </div>

            <h2 className="mt-3 text-3xl font-bold tracking-tight text-surface-900 sm:text-4xl">
              Simple by design.
            </h2>

            <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-surface-700 sm:text-base">
              Whether you're looking for work or looking for talent, GigVerse keeps
              the journey from discovery to delivery straightforward.
            </p>
          </div>

          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {/* Step 1 */}
            <div className="relative rounded-xl border border-white/6 bg-surface-100 p-6">
              <span className="text-xs font-semibold tracking-widest text-primary-400">
                01
              </span>

              <h3 className="mt-4 text-lg font-semibold text-surface-900">
                Discover
              </h3>

              <p className="mt-2 text-sm leading-6 text-surface-700">
                Explore services or discover jobs based on your skills, requirements,
                budget, and goals.
              </p>
            </div>

            {/* Step 2 */}
            <div className="relative rounded-xl border border-white/6 bg-surface-100 p-6">
              <span className="text-xs font-semibold tracking-widest text-primary-400">
                02
              </span>

              <h3 className="mt-4 text-lg font-semibold text-surface-900">
                Connect
              </h3>

              <p className="mt-2 text-sm leading-6 text-surface-700">
                Send proposals, review offers, and communicate directly to find the
                right fit for the work.
              </p>
            </div>

            {/* Step 3 */}
            <div className="relative rounded-xl border border-white/6 bg-surface-100 p-6">
              <span className="text-xs font-semibold tracking-widest text-primary-400">
                03
              </span>

              <h3 className="mt-4 text-lg font-semibold text-surface-900">
                Get Things Done
              </h3>

              <p className="mt-2 text-sm leading-6 text-surface-700">
                Work together, complete the project, and build trust through reviews,
                ratings, and a growing track record.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          PLATFORM FEATURES
      ========================================================= */}
      <section className="bg-surface-50 border-b border-white/6">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
          <div className="mx-auto max-w-2xl text-center">
            <div className="flex items-center justify-center gap-2 text-sm text-surface-600">
              <Sparkles className="h-4 w-4 text-primary-400" />
              What powers GigVerse
            </div>

            <h2 className="mt-3 text-3xl font-bold tracking-tight text-surface-900 sm:text-4xl">
              Tools that make the marketplace work.
            </h2>
          </div>

          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Communication */}
            <div className="rounded-xl border border-white/6 bg-surface-100 p-5">
              <MessageCircle className="h-5 w-5 text-primary-400" />

              <h3 className="mt-4 font-semibold text-surface-900">
                Real-time Communication
              </h3>

              <p className="mt-2 text-sm leading-6 text-surface-700">
                Communicate directly with clients and freelancers throughout the
                project.
              </p>
            </div>

            {/* Reviews */}
            <div className="rounded-xl border border-white/6 bg-surface-100 p-5">
              <Star className="h-5 w-5 text-primary-400" />

              <h3 className="mt-4 font-semibold text-surface-900">
                Reviews & Ratings
              </h3>

              <p className="mt-2 text-sm leading-6 text-surface-700">
                Build confidence with ratings and feedback from completed work.
              </p>
            </div>

            {/* AI */}
            <div className="rounded-xl border border-white/6 bg-surface-100 p-5">
              <Sparkles className="h-5 w-5 text-primary-400" />

              <h3 className="mt-4 font-semibold text-surface-900">
                Smart Assistance
              </h3>

              <p className="mt-2 text-sm leading-6 text-surface-700">
                Smart assistance helps freelancers discover relevant opportunities
                and create stronger proposals.
              </p>
            </div>

            {/* Payments */}
            <div className="rounded-xl border border-white/6 bg-surface-100 p-5">
              <WalletCards className="h-5 w-5 text-primary-400" />

              <h3 className="mt-4 font-semibold text-surface-900">
                Simple Payments
              </h3>

              <p className="mt-2 text-sm leading-6 text-surface-700">
                Keep project payments and transaction history organized in one place.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          MISSION / CLOSING CTA
      ========================================================= */}
      <section className="relative isolate overflow-hidden bg-[#0f0f0d]">
        {/* Ambient amber background */}
        <div className="pointer-events-none absolute -left-40 -top-40 h-80 w-80 rounded-full bg-primary-500/20 blur-[110px]" />
        <div className="pointer-events-none absolute -right-40 -bottom-40 h-96 w-96 rounded-full bg-primary-500/20 blur-[120px]" />

        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(15,15,13,0.15)_0%,rgba(15,15,13,0.5)_60%,rgba(15,15,13,0.85)_100%)]" />

        <div className="relative mx-auto max-w-4xl px-4 py-20 text-center sm:px-6 lg:px-8 lg:py-28">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-primary-500/20 bg-primary-500/10">
            <Sparkles className="h-6 w-6 text-primary-400" />
          </div>

          <h2 className="mt-6 text-3xl font-bold tracking-tight text-[#f3f3ed] sm:text-4xl">
            The right connection could start here.
          </h2>

          <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-[#aaa9a0] sm:text-base">
            Whether you're a student ready to showcase your skills or a
            client looking for fresh talent, GigVerse brings both sides
            together.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link to="/signup" className="w-full sm:w-auto">
              <Button
                size="lg"
                className="
                  w-full
                  border border-primary-400
                  bg-primary-500
                  text-[#171713]
                  hover:bg-primary-400
                  sm:w-auto
                "
              >
                Join GigVerse
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>

            <Link to="/services" className="w-full sm:w-auto">
              <Button
                size="lg"
                variant="outline"
                className="
                  w-full
                  border-[#55554d]
                  bg-white/2
                  text-surface-900
                  hover:border-[#77776d]
                  hover:bg-white/6
                  sm:w-auto
                "
              >
                Explore Opportunities
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}