"use client";
import React from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MenuToggleIcon } from "@/components/ui/menu-toggle-icon";
import Link from "next/link";
import { Brain } from "lucide-react";

export function Header() {
  const [open, setOpen] = React.useState(false);

  const links = [
    {
      label: "Features",
      href: "#features",
    },
    {
      label: "How It Works",
      href: "#how-it-works",
    },
    {
      label: "Testimonials",
      href: "#testimonials",
    },
  ];

  React.useEffect(() => {
    if (open) {
      // Disable scroll
      document.body.style.overflow = "hidden";
    } else {
      // Re-enable scroll
      document.body.style.overflow = "";
    }

    // Close menu when user scrolls
    const handleScroll = () => {
      if (open) {
        setOpen(false);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    // Cleanup when component unmounts (important for Next.js)
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("scroll", handleScroll);
    };
  }, [open]);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-black shadow-md transition-all duration-300 ease-in-out",
        !open && "will-change-transform",
      )}
    >
      <nav className={cn("flex h-16 w-full items-center justify-between px-4")}>
        <Link href="/" className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-black dark:bg-white flex items-center justify-center">
            <Brain className="h-3 w-3 text-white dark:text-black" />
          </div>
          <span className="font-bold text-lg hidden sm:inline text-black dark:text-white">
            StudentSuccess
          </span>
        </Link>
        <div className="hidden items-center gap-2 md:flex">
          {links.map((link, i) => (
            <a
              key={i}
              className={buttonVariants({ variant: "ghost" })}
              href={link.href}
            >
              {link.label}
            </a>
          ))}
          <Button variant="outline" asChild>
            <Link href="/login">Sign In</Link>
          </Button>
          <Button
            className="bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-100"
            asChild
          >
            <Link href="/register">Get Started</Link>
          </Button>
        </div>
        <Button
          size="icon"
          variant="outline"
          onClick={() => setOpen(!open)}
          className="md:hidden"
        >
          <MenuToggleIcon open={open} className="size-5" duration={300} />
        </Button>
      </nav>

      <div
        className={cn(
          "bg-white dark:bg-black fixed inset-0 z-40 flex flex-col overflow-hidden border-t border-gray-200 dark:border-gray-800 md:hidden",
          open ? "block" : "hidden",
        )}
        style={{ top: 64, maxHeight: "calc(100vh - 64px)" }}
      >
        <div
          data-slot={open ? "open" : "closed"}
          className={cn(
            "data-[slot=open]:animate-in data-[slot=open]:zoom-in-95 data-[slot=closed]:animate-out data-[slot=closed]:zoom-out-95 ease-out",
            "flex h-full w-full flex-col justify-between gap-y-2 p-4",
          )}
        >
          <div className="grid gap-y-2">
            {links.map((link) => (
              <a
                key={link.label}
                className={buttonVariants({
                  variant: "ghost",
                  className: "justify-start",
                })}
                href={link.href}
                onClick={() => setOpen(false)}
              >
                {link.label}
              </a>
            ))}
          </div>
          <div className="flex flex-col gap-2">
            <Button variant="outline" className="w-full" asChild>
              <Link href="/login">Sign In</Link>
            </Button>
            <Button
              className="w-full bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-100"
              asChild
            >
              <Link href="/register">Get Started</Link>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
