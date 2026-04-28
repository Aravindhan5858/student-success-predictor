"use client";
import LoginForm from "@/components/forms/LoginForm";
import Link from "next/link";
import { AuthPage } from "@/components/ui/auth-page";

export default function LoginPage() {
  return (
    <AuthPage
      title="Sign In or Join Now!"
      subtitle="Sign in to your Student Success Predictor account"
      brandName="StudentSuccess"
      testimonial={{
        text: "The risk prediction caught 3 students I would have missed. Invaluable tool.",
        author: "~ Dr. Sarah Smith, Professor",
      }}
    >
      <div className="space-y-4">
        <LoginForm />
        <p className="text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            className="text-primary hover:underline font-medium"
          >
            Register
          </Link>
        </p>
      </div>
    </AuthPage>
  );
}
