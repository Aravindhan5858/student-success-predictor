'use client';
import { useAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/store/authStore';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { getRoleBadgeColor } from '@/lib/utils';
import { LogOut, Moon, Sun, User } from 'lucide-react';
import Link from 'next/link';
import { useTheme } from 'next-themes';

export default function Header() {
  const { user } = useAuthStore();
  const { logout } = useAuth();
  const { theme, setTheme } = useTheme();

  if (!user) return null;

  const initials = user.full_name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <header className="h-16 border-b bg-background flex items-center justify-between px-6 sticky top-0 z-30">
      <div className="md:hidden" />
      <h1 className="text-sm font-semibold text-muted-foreground hidden md:block">
        {process.env.NEXT_PUBLIC_APP_NAME || 'Student Success Predictor'}
      </h1>
      <div className="flex items-center gap-3 ml-auto">
        <Badge className={getRoleBadgeColor(user.role)}>{user.role}</Badge>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="transition-colors duration-200"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="rounded-full focus:outline-none focus:ring-2 focus:ring-ring">
              <Avatar className="h-8 w-8 cursor-pointer">
                <AvatarFallback className="text-xs">{initials}</AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>
              <p className="font-medium text-sm">{user.full_name}</p>
              <p className="text-xs text-muted-foreground font-normal">{user.email}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {user.role === 'student' && (
              <DropdownMenuItem asChild>
                <Link href="/student/profile" className="flex items-center gap-2 cursor-pointer">
                  <User className="h-4 w-4" /> Profile
                </Link>
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={logout} className="flex items-center gap-2 cursor-pointer text-destructive">
              <LogOut className="h-4 w-4" /> Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
