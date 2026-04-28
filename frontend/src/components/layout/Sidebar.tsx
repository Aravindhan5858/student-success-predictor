'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  LayoutDashboard, Users, FileText, Upload, GraduationCap,
  ClipboardList, MessageSquare, User, Menu, X, BookOpen,
  BarChart2, Shield, Brain, HelpCircle, UserCheck, FlaskConical,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';

const navItems: Record<string, { href: string; label: string; icon: any }[]> = {
  super_admin: [
    { href: '/super-admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/users', label: 'Users', icon: Users },
    { href: '/admin/moderation', label: 'Moderation', icon: Shield },
    { href: '/admin/audit-logs', label: 'Audit Logs', icon: FileText },
    { href: '/community', label: 'Community Q&A', icon: HelpCircle },
  ],
  admin: [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/users', label: 'Users', icon: Users },
    { href: '/admin/moderation', label: 'Moderation', icon: Shield },
    { href: '/admin/audit-logs', label: 'Audit Logs', icon: FileText },
    { href: '/community', label: 'Community Q&A', icon: HelpCircle },
  ],
  professor: [
    { href: '/professor', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/professor/upload', label: 'Upload Data', icon: Upload },
    { href: '/professor/students', label: 'Students', icon: GraduationCap },
    { href: '/professor/interview-drives', label: 'Interview Drives', icon: ClipboardList },
    { href: '/professor/analytics', label: 'Analytics', icon: BarChart2 },
    { href: '/mentorship', label: 'Mentorship', icon: UserCheck },
    { href: '/community', label: 'Community Q&A', icon: HelpCircle },
  ],
  student: [
    { href: '/student', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/student/assessments', label: 'Assessments', icon: ClipboardList },
    { href: '/student/mcq-test', label: 'MCQ Tests', icon: Brain },
    { href: '/student/mock-test', label: 'Mock Tests', icon: FlaskConical },
    { href: '/student/interviews', label: 'Interviews', icon: MessageSquare },
    { href: '/student/profile', label: 'Profile', icon: User },
    { href: '/mentorship', label: 'Mentorship', icon: UserCheck },
    { href: '/community', label: 'Community Q&A', icon: HelpCircle },
  ],
};

export default function Sidebar() {
  const { user } = useAuthStore();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  if (!user) return null;
  const items = navItems[user.role];

  const NavLinks = () => (
    <nav className="flex flex-col gap-1 p-4">
      <div className="flex items-center gap-2 px-2 py-3 mb-2">
        <Brain className="h-6 w-6 text-primary" />
        <span className="font-bold text-sm">SSPredictor</span>
      </div>
      {items.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          onClick={() => setOpen(false)}
          className={cn(
            'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
            pathname.startsWith(href) && (href !== '/admin' && href !== '/professor' && href !== '/student' || pathname === href)
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
          )}
        >
          <Icon className="h-4 w-4" />
          {label}
        </Link>
      ))}
    </nav>
  );

  return (
    <>
      <button
        className="fixed top-4 left-4 z-50 md:hidden p-2 rounded-md bg-background border"
        onClick={() => setOpen(!open)}
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {open && (
        <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={() => setOpen(false)} />
      )}

      <aside className={cn(
        'fixed left-0 top-0 z-40 h-full w-64 bg-background border-r transition-transform md:hidden',
        open ? 'translate-x-0' : '-translate-x-full'
      )}>
        <NavLinks />
      </aside>

      <aside className="hidden md:flex w-64 flex-col border-r bg-background h-screen sticky top-0 overflow-y-auto">
        <NavLinks />
      </aside>
    </>
  );
}
