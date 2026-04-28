"use client";
import RegisterForm from "@/components/forms/RegisterForm";
import Link from "next/link";
import { AuthPage } from "@/components/ui/auth-page";

export default function RegisterPage() {
  return (
    <AuthPage
      title="Create Account"
      subtitle="Join Student Success Predictor today"
      brandName="StudentSuccess"
      testimonial={{
        text: "Mock interviews helped me crack my campus placement with confidence.",
        author: "~ Arun Kumar, B.Tech Student",
      }}
    >
      <div className="space-y-4">
        <RegisterForm />
        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-primary hover:underline font-medium"
          >
            Sign in
          </Link>
        </p>
      </div>
    </AuthPage>
  );
}
