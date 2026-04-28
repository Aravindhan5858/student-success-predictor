'use client';
import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Brain, Video, MessageSquare, Upload, BarChart2, Lightbulb,
  ShieldCheck, Zap, GraduationCap, ArrowRight, Star, CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuthStore } from '@/store/authStore';
import { getDashboardPath } from '@/lib/auth';

const FEATURES = [
  { icon: Brain, title: 'AI Risk Prediction', desc: 'ML models flag at-risk students before it\'s too late.', gradient: 'from-violet-500 to-purple-600' },
  { icon: BarChart2, title: 'Real-time Analytics', desc: 'Track performance, attendance & engagement metrics.', gradient: 'from-blue-500 to-cyan-600' },
  { icon: Video, title: 'Mock Interviews', desc: 'AI-driven interviews with instant, actionable feedback.', gradient: 'from-emerald-500 to-teal-600' },
  { icon: Zap, title: 'MCQ Test Engine', desc: '50+ domain questions with weak/strong area analysis.', gradient: 'from-amber-500 to-orange-600' },
  { icon: ShieldCheck, title: 'Secure & Private', desc: 'Role-based access, encrypted sessions, audit logging.', gradient: 'from-rose-500 to-pink-600' },
  { icon: MessageSquare, title: 'Community Q&A', desc: 'Peer-to-peer discussions moderated by AI.', gradient: 'from-indigo-500 to-violet-600' },
];

const TESTIMONIALS = [
  { name: 'Dr. Sarah Smith', role: 'Professor, CS Dept', text: 'The risk prediction caught 3 students I would have missed. Invaluable tool.', rating: 5 },
  { name: 'Arun Kumar', role: 'B.Tech Student', text: 'Mock interviews helped me crack my campus placement with confidence.', rating: 5 },
  { name: 'College Admin', role: 'System Administrator', text: 'Dashboard gives us full visibility into student outcomes across departments.', rating: 5 },
];

const ROLES = [
  { role: 'Student', href: '/register', desc: 'Practice tests, mock interviews & track your progress', icon: GraduationCap, color: 'from-green-500 to-emerald-600' },
  { role: 'Professor', href: '/register', desc: 'Upload data, monitor students & get AI insights', icon: Upload, color: 'from-blue-500 to-indigo-600' },
  { role: 'Admin', href: '/register', desc: 'Manage users, view analytics & oversee billing', icon: ShieldCheck, color: 'from-purple-500 to-violet-600' },
];

export default function LandingPage() {
  const { isAuthenticated, user } = useAuthStore();
  const router = useRouter();
  const featuresRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (isAuthenticated && user) router.replace(getDashboardPath(user.role));
  }, [isAuthenticated, user, router]);

  if (isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Nav */}
      <nav className="fixed top-0 inset-x-0 z-50 border-b bg-background/80 backdrop-blur-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center">
              <Brain className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-xl">StudentSuccess</span>
          </div>
          <div className="flex gap-3">
            <Button variant="ghost" asChild><Link href="/login">Log in</Link></Button>
            <Button asChild className="bg-gradient-to-r from-primary to-blue-600 hover:opacity-90 transition-opacity">
              <Link href="/register">Get Started Free</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-36 pb-24 px-4 text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 text-sm font-medium text-primary mb-6">
            <Zap className="h-4 w-4" /> AI-Powered Student Analytics Platform
          </div>
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.1] mb-6">
            <span className="bg-gradient-to-r from-primary via-blue-500 to-violet-500 bg-clip-text text-transparent">Predict. Prepare.</span>
            <br />Succeed.
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            Identify at-risk students early, deliver personalised mock interviews & MCQ tests,
            and give professors actionable insights — all in one powerful platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild className="text-base px-8 h-12 bg-gradient-to-r from-primary to-blue-600 hover:opacity-90 shadow-lg shadow-primary/25">
              <Link href="/register" className="gap-2">Get Started Free <ArrowRight className="h-4 w-4" /></Link>
            </Button>
            <Button size="lg" variant="outline" className="text-base px-8 h-12" onClick={() => featuresRef.current?.scrollIntoView({ behavior: 'smooth' })}>
              See Features
            </Button>
          </div>
          <div className="flex items-center justify-center gap-6 mt-8 text-sm text-muted-foreground">
            {['No credit card', 'Free for students', 'Setup in 2 min'].map(t => (
              <span key={t} className="flex items-center gap-1"><CheckCircle2 className="h-4 w-4 text-green-500" />{t}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 px-4 border-y bg-muted/20">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { v: '1,000+', l: 'Students' }, { v: '95%', l: 'Prediction Accuracy' },
            { v: '50+', l: 'MCQ Questions' }, { v: '4', l: 'Role Dashboards' },
          ].map(({ v, l }) => (
            <div key={l}><div className="text-3xl font-black">{v}</div><div className="text-sm text-muted-foreground mt-1">{l}</div></div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section ref={featuresRef} className="py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Everything you need</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">A comprehensive platform for students, professors, and administrators.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map(({ icon: Icon, title, desc, gradient }) => (
              <Card key={title} className="group border-0 shadow-md hover:shadow-xl transition-all hover:-translate-y-1">
                <CardContent className="pt-8 pb-6 flex flex-col gap-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="font-bold text-lg">{title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 px-4 bg-muted/20">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-12">
            {[
              { icon: Upload, step: '01', title: 'Upload Data', desc: 'Professors upload student records via CSV in seconds.' },
              { icon: BarChart2, step: '02', title: 'AI Analyzes', desc: 'ML models process grades, attendance & engagement to build risk profiles.' },
              { icon: Lightbulb, step: '03', title: 'Get Insights', desc: 'Actionable recommendations and real-time tracking for every student.' },
            ].map(({ icon: Icon, step, title, desc }) => (
              <div key={step} className="flex flex-col items-center text-center gap-4">
                <div className="relative">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center shadow-lg shadow-primary/25">
                    <Icon className="h-7 w-7 text-white" />
                  </div>
                  <span className="absolute -top-2 -right-2 bg-background border-2 border-primary text-primary text-xs font-bold rounded-full w-7 h-7 flex items-center justify-center">{step}</span>
                </div>
                <h3 className="font-bold text-lg">{title}</h3>
                <p className="text-sm text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Role-based Entry Points */}
      <section className="py-24 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-4">Built for every role</h2>
          <p className="text-center text-muted-foreground mb-12">Tailored experiences for students, professors & administrators.</p>
          <div className="grid md:grid-cols-3 gap-6">
            {ROLES.map(({ role, href, desc, icon: Icon, color }) => (
              <Card key={role} className="group border-0 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 overflow-hidden">
                <div className={`h-2 bg-gradient-to-r ${color}`} />
                <CardContent className="pt-8 pb-6 flex flex-col items-center text-center gap-4">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center shadow-lg`}>
                    <Icon className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="font-bold text-xl">{role}</h3>
                  <p className="text-sm text-muted-foreground">{desc}</p>
                  <Button asChild variant="outline" className="mt-2 gap-2">
                    <Link href={href}>Sign up as {role} <ArrowRight className="h-4 w-4" /></Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 px-4 bg-muted/20">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-12">What our users say</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map(({ name, role, text, rating }) => (
              <Card key={name} className="border-0 shadow-md">
                <CardContent className="pt-6 space-y-4">
                  <div className="flex gap-1">{Array.from({ length: rating }).map((_, i) => <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />)}</div>
                  <p className="text-sm text-muted-foreground italic">&ldquo;{text}&rdquo;</p>
                  <div><p className="font-semibold text-sm">{name}</p><p className="text-xs text-muted-foreground">{role}</p></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-4">
        <div className="max-w-3xl mx-auto text-center bg-gradient-to-br from-primary to-blue-600 rounded-3xl p-12 shadow-2xl shadow-primary/20">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Ready to transform student outcomes?</h2>
          <p className="text-white/80 mb-8 text-lg">Join thousands of students and professors already on StudentSuccess.</p>
          <Button size="lg" variant="secondary" asChild className="text-base px-8 h-12 font-bold">
            <Link href="/register" className="gap-2">Get Started Free <ArrowRight className="h-4 w-4" /></Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center">
              <Brain className="h-3 w-3 text-white" />
            </div>
            <span className="font-bold text-foreground">StudentSuccess</span>
          </div>
          <div className="flex gap-6">
            <Link href="/about" className="hover:text-foreground transition-colors">About</Link>
            <Link href="/contact" className="hover:text-foreground transition-colors">Contact</Link>
            <Link href="/login" className="hover:text-foreground transition-colors">Login</Link>
          </div>
          <span>© {new Date().getFullYear()} StudentSuccess. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
}
