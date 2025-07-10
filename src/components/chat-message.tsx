"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Bot, User } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";
import { motion } from "framer-motion";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: ReactNode;
}

export function ChatMessage({ role, content }: ChatMessageProps) {
  const isUser = role === "user";
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "flex items-start gap-4 py-4",
        isUser ? "justify-end" : ""
      )}
    >
      {!isUser && (
        <Avatar className="h-10 w-10 border border-primary/20 flex-shrink-0">
          <AvatarFallback className="bg-primary/10 text-primary">
            <Bot className="h-6 w-6" />
          </AvatarFallback>
        </Avatar>
      )}
      <div
        className={cn(
          "max-w-2xl rounded-xl px-5 py-3 shadow-md",
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-card border"
        )}
      >
        {typeof content === "string" ? (
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{content}</p>
        ) : (
          content
        )}
      </div>
      {isUser && (
        <Avatar className="h-10 w-10 border border-muted-foreground/20 flex-shrink-0">
          <AvatarFallback className="bg-muted text-muted-foreground">
            <User className="h-6 w-6" />
          </AvatarFallback>
        </Avatar>
      )}
    </motion.div>
  );
}
