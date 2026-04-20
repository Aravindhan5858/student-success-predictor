'use client';
import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Brain, Video, MessageSquare, Upload, BarChart2, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuthStore } from '@/store/authStore';
import { getDashboardPath } from '@/lib/auth';

export default function LandingPage() {
  const { isAuthenticated, user } = useAuthStore();
  const router = useRouter();
  const featuresRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (isAuthenticated && user) {
      router.replace(getDashboardPath(user.role));
    }
  }, [isAuthenticated, user, router]);

  if (isAuthenticated) return null;

  function scrollToFeatures() {
    featuresRef.current?.scrollIntoView({ behavior: 'smooth' });
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <nav className="fixed top-0 inset-x-0 z-40 border-b bg-background/80 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <span className="font-bold text-lg">StudentSuccess</span>
          <div className="flex gap-2">
            <Button variant="ghost" asChild><Link href="/login">Log in</Link></Button>
            <Button asChild><Link href="/register">Sign up</Link></Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-4 text-center">
        <h1 className="text-5xl font-extrabold tracking-tight mb-4 bg-gradient-to-r from-primary to-blue-500 bg-clip-text text-transparent">
          Predict. Prepare. Succeed.
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
          AI-powered platform that identifies at-risk students early, delivers personalised mock interviews,
          and gives professors actionable insights — all in one place.
        </p>
        <div className="flex gap-3 justify-center">
          <Button size="lg" asChild><Link href="/register">Get Started</Link></Button>
          <Button size="lg" variant="outline" onClick={scrollToFeatures}>Learn More</Button>
        </div>
      </section>

      {/* Features */}
      <section ref={featuresRef} className="py-16 px-4 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-10">Features</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: Brain, title: 'AI Risk Prediction', desc: 'Machine learning models flag at-risk students before it\'s too late, so professors can intervene early.' },
              { icon: Video, title: 'Mock Interviews', desc: 'AI-driven mock interviews with instant feedback help students build confidence and sharpen their skills.' },
              { icon: MessageSquare, title: 'Community Q&A', desc: 'Peer-to-peer Q&A forum moderated by AI keeps discussions focused and productive.' },
            ].map(({ icon: Icon, title, desc }) => (
              <Card key={title}>
                <CardContent className="pt-6 flex flex-col items-center text-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg">{title}</h3>
                  <p className="text-sm text-muted-foreground">{desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-10">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Upload, step: '01', title: 'Upload Data', desc: 'Professors upload student academic records via CSV in seconds.' },
              { icon: BarChart2, step: '02', title: 'Analyze Performance', desc: 'Our AI processes attendance, grades, and engagement to build risk profiles.' },
              { icon: Lightbulb, step: '03', title: 'Get Insights', desc: 'Receive actionable recommendations and track student progress over time.' },
            ].map(({ icon: Icon, step, title, desc }) => (
              <div key={step} className="flex flex-col items-center text-center gap-3">
                <div className="relative">
                  <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center">
                    <Icon className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <span className="absolute -top-2 -right-2 text-xs font-bold bg-muted rounded-full w-6 h-6 flex items-center justify-center">
                    {step}
                  </span>
                </div>
                <h3 className="font-semibold">{title}</h3>
                <p className="text-sm text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 px-4 bg-primary text-primary-foreground">
        <div className="max-w-4xl mx-auto grid grid-cols-3 gap-8 text-center">
          {[
            { value: '1000+', label: 'Students' },
            { value: '95%', label: 'Accuracy' },
            { value: '50+', label: 'Professors' },
          ].map(({ value, label }) => (
            <div key={label}>
              <div className="text-4xl font-extrabold">{value}</div>
              <div className="text-primary-foreground/80 mt-1">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 text-center">
        <h2 className="text-3xl font-bold mb-4">Ready to get started?</h2>
        <p className="text-muted-foreground mb-6">Join thousands of students and professors already using StudentSuccess.</p>
        <Button size="lg" asChild><Link href="/register">Sign Up Free</Link></Button>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 px-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">StudentSuccess</span>
          <div className="flex gap-4">
            <Link href="/about" className="hover:text-foreground transition-colors">About</Link>
            <Link href="/contact" className="hover:text-foreground transition-colors">Contact</Link>
          </div>
          <span>© {new Date().getFullYear()} StudentSuccess. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
}
