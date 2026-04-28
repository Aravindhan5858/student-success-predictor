"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Brain, Target, Users, TrendingUp, Award, MessageSquare } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <section className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Student Success Predictor
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          AI-powered platform to predict student performance, provide personalized learning paths, and enhance academic success
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/login?role=student">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700">Student Login</Button>
          </Link>
          <Link href="/login?role=professor">
            <Button size="lg" variant="outline">Professor Login</Button>
          </Link>
        </div>
      </section>

      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">Key Features</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <Card className="p-6 hover:shadow-lg transition-shadow">
            <Brain className="w-12 h-12 text-blue-600 mb-4" />
            <h3 className="text-xl font-semibold mb-2">AI Prediction</h3>
            <p className="text-gray-600">Advanced ML models predict student performance and identify at-risk students early</p>
          </Card>
          <Card className="p-6 hover:shadow-lg transition-shadow">
            <Target className="w-12 h-12 text-purple-600 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Mock Interviews</h3>
            <p className="text-gray-600">Practice with AI-powered mock interviews with strict proctoring and real-time feedback</p>
          </Card>
          <Card className="p-6 hover:shadow-lg transition-shadow">
            <MessageSquare className="w-12 h-12 text-green-600 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Community Q&A</h3>
            <p className="text-gray-600">Collaborative learning platform with points system and expert moderation</p>
          </Card>
          <Card className="p-6 hover:shadow-lg transition-shadow">
            <TrendingUp className="w-12 h-12 text-orange-600 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Performance Analytics</h3>
            <p className="text-gray-600">Comprehensive dashboards for tracking progress and identifying improvement areas</p>
          </Card>
          <Card className="p-6 hover:shadow-lg transition-shadow">
            <Award className="w-12 h-12 text-red-600 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Placement Support</h3>
            <p className="text-gray-600">Campus interview management, resume building, and career guidance</p>
          </Card>
          <Card className="p-6 hover:shadow-lg transition-shadow">
            <Users className="w-12 h-12 text-indigo-600 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Mentorship</h3>
            <p className="text-gray-600">Connect with mentors for personalized guidance and career advice</p>
          </Card>
        </div>
      </section>

      <section className="container mx-auto px-4 py-16 text-center">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-12 text-white">
          <h2 className="text-3xl font-bold mb-4">Ready to Transform Your Academic Journey?</h2>
          <p className="text-xl mb-8 opacity-90">Join thousands of students achieving their academic goals</p>
          <Link href="/register">
            <Button size="lg" variant="secondary">Get Started Free</Button>
          </Link>
        </div>
      </section>

      <footer className="border-t py-8 mt-16">
        <div className="container mx-auto px-4 text-center text-gray-600">
          <p>&copy; 2026 Student Success Predictor. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
