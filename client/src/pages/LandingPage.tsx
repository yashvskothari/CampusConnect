import { Link } from 'react-router-dom';
import {
  ArrowRight, Search, MessageSquare, Sparkles, Shield, Zap,
  Code2, PenTool, FileText, GraduationCap, Megaphone, MoreHorizontal,
  Briefcase, Users, Star, ShieldCheck,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import Button from '../components/Button';
import Card from '../components/Card';
import Rating from '../components/Rating';
import { serviceApi } from '../services';
import { formatCurrency } from '../utils';
import type { Service } from '../types';

const categories = [
  { icon: Code2, label: 'Development', count: '120+ jobs', color: 'text-primary-400 bg-primary-500/10' },
  { icon: PenTool, label: 'Design & Creative', count: '96+ jobs', color: 'text-pink-400 bg-pink-500/10' },
  { icon: FileText, label: 'Writing & Translation', count: '80+ jobs', color: 'text-amber-400 bg-amber-500/10' },
  { icon: GraduationCap, label: 'Academic Help', count: '60+ jobs', color: 'text-emerald-400 bg-emerald-500/10' },
  { icon: Megaphone, label: 'Marketing', count: '45+ jobs', color: 'text-violet-400 bg-violet-500/10' },
  { icon: MoreHorizontal, label: 'More Categories', count: 'Explore all', color: 'text-surface-700 bg-surface-300' },
];

const stats = [
  { icon: Briefcase, value: '1.2K+', label: 'Jobs Posted' },
  { icon: Users, value: '850+', label: 'Freelancers' },
  { icon: Star, value: '4.8', label: 'Average Rating' },
  { icon: ShieldCheck, value: '100%', label: 'Secure Payments' },
];

export default function LandingPage() {
  const [featured, setFeatured] = useState<Service[]>([]);

  useEffect(() => {
    serviceApi.getAll().then(({ data }) => setFeatured(data.slice(0, 3))).catch(() => {});
  }, []);

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-surface-0 text-surface-900">
        <div className="pointer-events-none absolute -top-40 right-0 h-96 w-96 rounded-full bg-primary-600/20 blur-3xl" />
        <div className="pointer-events-none absolute top-40 left-0 h-72 w-72 rounded-full bg-accent-600/10 blur-3xl" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <div className="grid lg:grid-cols-[1.2fr_1fr] gap-10 items-center">
            <div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight">
                Connecting Students.<br />
                Creating <span className="brand-gradient-text">Opportunities.</span>
              </h1>
              <p className="mt-6 text-lg text-surface-700 max-w-xl">
                CampusConnect AI is a student-first freelance marketplace to find talent, get work done, and build your reputation.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link to="/jobs"><Button size="lg">
                  Find Jobs
                </Button></Link>
                <Link to="/services"><Button size="lg" variant="outline">
                  Offer Services
                </Button></Link>
              </div>
            </div>

            <Card className="relative overflow-hidden">
              <span className="inline-flex items-center gap-1 text-xs font-medium text-primary-400 mb-3">
                <Sparkles className="h-3.5 w-3.5" /> AI Matchmaker
              </span>
              <h3 className="text-xl font-bold text-surface-900">Smart matches.</h3>
              <h3 className="text-xl font-bold brand-gradient-text mb-3">Better opportunities.</h3>
              <p className="text-sm text-surface-700">
                Our AI recommends the right jobs and freelancers based on skills, preferences and performance.
              </p>
              <div className="pointer-events-none absolute -bottom-6 -right-6 h-28 w-28 rounded-2xl brand-gradient opacity-20 rotate-12" />
            </Card>
          </div>

          {/* Search bar */}
          <div className="mt-12 flex flex-col sm:flex-row gap-3 rounded-2xl border border-surface-300 bg-surface-100 p-3">
            <div className="flex-1 flex items-center gap-2 px-3">
              <Search className="h-5 w-5 text-surface-700 shrink-0" />
              <input
                placeholder="Search for jobs, skills or services..."
                className="w-full bg-transparent py-2 text-sm text-surface-900 placeholder:text-surface-700 focus:outline-none"
              />
            </div>
            <Button size="lg">Search</Button>
          </div>

          {/* Categories */}
          <div className="mt-14">
            <h2 className="text-lg font-semibold text-surface-900 mb-4">Explore Top Categories</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {categories.map(({ icon: Icon, label, count, color }) => (
                <Link
                  key={label}
                  to="/jobs"
                  className="rounded-xl border border-surface-300 bg-surface-100 p-4 hover:border-primary-500/50 transition-colors"
                >
                  <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${color} mb-6`}>
                    <Icon className="h-4.5 w-4.5" />
                  </div>
                  <p className="text-sm font-semibold text-surface-900">{label}</p>
                  <p className="text-xs text-surface-700">{count}</p>
                </Link>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="mt-14 grid grid-cols-2 sm:grid-cols-4 gap-6 border-t border-surface-300 pt-10">
            {stats.map(({ icon: Icon, value, label }) => (
              <div key={label} className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-surface-200 border border-surface-300 text-primary-400">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xl font-bold text-surface-900">{value}</p>
                  <p className="text-xs text-surface-700">{label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-surface-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-surface-900">Why CampusConnect?</h2>
            <p className="mt-3 text-surface-700 max-w-2xl mx-auto">Everything you need to freelance as a student or hire student talent.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Search, title: 'Smart Discovery', desc: 'Browse services and jobs with powerful search and filters.' },
              { icon: Sparkles, title: 'AI Matching', desc: 'Get personalized job recommendations based on your skills.' },
              { icon: MessageSquare, title: 'Real-time Chat', desc: 'Communicate instantly with clients and freelancers.' },
              { icon: Shield, title: 'Secure Platform', desc: 'Mock payment flow with transparent 15% commission.' },
            ].map(({ icon: Icon, title, desc }) => (
              <Card key={title} hover className="text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-500/10">
                  <Icon className="h-6 w-6 text-primary-400" />
                </div>
                <h3 className="font-semibold text-surface-900">{title}</h3>
                <p className="mt-2 text-sm text-surface-700">{desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 bg-surface-0">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-surface-900">How It Works</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Create Your Profile', desc: 'Sign up as a freelancer or client. Add your skills and bio.' },
              { step: '02', title: 'Post or Browse', desc: 'Clients post jobs. Freelancers browse and bid with AI assistance.' },
              { step: '03', title: 'Collaborate & Review', desc: 'Chat in real-time, complete work, pay securely, and leave reviews.' },
            ].map(({ step, title, desc }) => (
              <div key={step} className="relative text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full brand-gradient text-white text-lg font-bold">{step}</div>
                <h3 className="font-semibold text-surface-900 text-lg">{title}</h3>
                <p className="mt-2 text-sm text-surface-700">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Services */}
      <section className="py-20 bg-surface-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-surface-900">Featured Services</h2>
            <Link to="/services" className="text-primary-400 hover:text-primary-300 text-sm font-medium flex items-center gap-1">
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {featured.length > 0 ? featured.map((service) => (
              <Card key={service.id} hover>
                <span className="text-xs font-medium text-primary-400 bg-primary-500/10 px-2 py-0.5 rounded-full">{service.category}</span>
                <h3 className="mt-3 font-semibold text-surface-900">{service.title}</h3>
                <p className="mt-2 text-sm text-surface-700 line-clamp-2">{service.description}</p>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-lg font-bold text-primary-400">{formatCurrency(service.price)}</span>
                  {service.freelancer && <Rating rating={service.freelancer.rating} size={14} />}
                </div>
              </Card>
            )) : (
              [1, 2, 3].map((i) => (
                <Card key={i}>
                  <div className="animate-pulse space-y-3">
                    <div className="h-4 w-24 bg-surface-300 rounded" />
                    <div className="h-6 w-3/4 bg-surface-300 rounded" />
                    <div className="h-4 w-full bg-surface-300 rounded" />
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 brand-gradient">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <Zap className="h-12 w-12 text-white/80 mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-white">Ready to Start Your Journey?</h2>
          <p className="mt-3 text-white/80 max-w-xl mx-auto">Join thousands of students earning while learning. It takes less than 2 minutes to sign up.</p>
          <div className="mt-8 flex justify-center gap-4">
            <Link to="/signup"><Button size="lg" className="bg-surface-100 text-primary-700 hover:bg-surface-100/90">Sign Up as Freelancer</Button></Link>
            <Link to="/signup"><Button size="lg" variant="outline" className="border-white/40 text-white hover:bg-surface-100/10">Hire a Student</Button></Link>
          </div>
        </div>
      </section>
    </div>
  );
}
