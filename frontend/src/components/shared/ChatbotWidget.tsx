"use client";
import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/api";
import ReactMarkdown from "react-markdown";

interface Message {
  role: "user" | "assistant";
  content: string;
  suggested_actions?: string[];
}

const QUICK_ACTIONS = ["Revise DSA", "Start Mock Test", "Ask Doubt"];

export default function ChatbotWidget() {
  const { isAuthenticated } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Load history on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("chatbot_history");
      if (saved) setMessages(JSON.parse(saved));
    } catch {}
  }, []);

  // Save history on change
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem("chatbot_history", JSON.stringify(messages.slice(-50)));
    }
  }, [messages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  if (!isAuthenticated) return null;

  const clearHistory = () => {
    setMessages([]);
    localStorage.removeItem("chatbot_history");
  };

  async function sendMessage(text: string) {
    if (!text.trim() || isLoading) return;
    const userMsg: Message = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);
    try {
      const { data } = await api.post("/chatbot/message", { message: text });
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.response,
          suggested_actions: data.suggested_actions,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, something went wrong. Please try again." },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      {isOpen && (
        <div className="fixed bottom-20 right-4 z-50 w-[380px] h-[500px] flex flex-col rounded-xl shadow-2xl border bg-background">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b bg-primary text-primary-foreground rounded-t-xl">
            <div className="flex items-center gap-2 font-semibold">
              <MessageCircle className="h-4 w-4" />
              AI Assistant
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={clearHistory}
                className="h-7 w-7 p-0 hover:bg-primary-foreground/20 text-primary-foreground"
                title="Clear history"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
              <button onClick={() => setIsOpen(false)} className="hover:opacity-70 ml-1">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {messages.length === 0 && (
              <p className="text-center text-sm text-muted-foreground mt-8">
                Hi! How can I help you today?
              </p>
            )}
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex flex-col w-full ${msg.role === "user" ? "items-end" : "items-start"}`}
              >
                <div
                  className={`rounded-2xl px-4 py-3 text-sm leading-relaxed max-w-xs ${
                    msg.role === "user"
                      ? "bg-blue-600 text-white rounded-br-sm"
                      : "bg-muted text-foreground rounded-bl-sm"
                  }`}
                >
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <ReactMarkdown
                      components={{
                        h1: ({ node, ...props }) => <h1 className="text-base font-bold mt-2 mb-1" {...props} />,
                        h2: ({ node, ...props }) => <h2 className="text-sm font-bold mt-2 mb-1" {...props} />,
                        h3: ({ node, ...props }) => <h3 className="text-sm font-semibold mt-1.5 mb-0.5" {...props} />,
                        p: ({ node, ...props }) => <p className="mb-1 last:mb-0" {...props} />,
                        ul: ({ node, ...props }) => <ul className="list-disc list-inside mb-2 space-y-0.5" {...props} />,
                        ol: ({ node, ...props }) => <ol className="list-decimal list-inside mb-2 space-y-0.5" {...props} />,
                        li: ({ node, ...props }) => <li className="mb-0.5" {...props} />,
                        strong: ({ node, ...props }) => <strong className="font-semibold" {...props} />,
                        em: ({ node, ...props }) => <em className="italic" {...props} />,
                        code: ({ node, ...props }) => (
                          <code className="bg-black/20 px-1.5 py-0.5 rounded text-xs font-mono" {...props} />
                        ),
                      }}
                    >
                      {msg.content}
                    </ReactMarkdown>
                  </div>
                </div>
                {msg.suggested_actions && msg.suggested_actions.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3 w-full">
                    {msg.suggested_actions.map((action) => (
                      <button
                        key={action}
                        onClick={() => sendMessage(action)}
                        className="text-xs px-3 py-1.5 rounded-full border border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-colors duration-200 font-medium"
                      >
                        {action}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex items-start">
                <div className="bg-muted rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                      style={{ animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick actions */}
          <div className="flex gap-2 px-3 pb-3 flex-wrap bg-muted/30">
            {QUICK_ACTIONS.map((action) => (
              <button
                key={action}
                onClick={() => sendMessage(action)}
                className="text-xs px-3 py-1.5 rounded-full bg-muted hover:bg-muted/70 text-muted-foreground font-medium transition-colors duration-200"
              >
                {action}
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="flex gap-2 p-3 border-t">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
              placeholder="Type a message..."
              className="flex-1 text-sm"
              disabled={isLoading}
            />
            <Button
              size="icon"
              onClick={() => sendMessage(input)}
              disabled={isLoading || !input.trim()}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Floating button */}
      <button
        onClick={() => setIsOpen((o) => !o)}
        className="fixed bottom-4 right-4 z-50 w-12 h-12 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:opacity-90 transition-opacity"
      >
        {isOpen ? <X className="h-5 w-5" /> : <MessageCircle className="h-5 w-5" />}
      </button>
    </>
  );
}
