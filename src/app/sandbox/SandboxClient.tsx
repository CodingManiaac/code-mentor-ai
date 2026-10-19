"use client";

import React, { useState, useEffect } from "react";
import CodeSandbox from "@/components/chat/CodeSandbox";
import { Loader2 } from "lucide-react";

export default function SandboxClient() {
  const [code, setCode] = useState<string | null>(null);
  const [title, setTitle] = useState("Interactive DSA Challenge");
  const [language, setLanguage] = useState("javascript");
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState("");

  useEffect(() => {
    // 1. Fetch Auth Session on Client side
    fetch("/api/auth/session")
      .then((res) => res.json())
      .then((data) => {
        if (data?.user?.id) {
          setUserId(data.user.id);
          
          // 2. Retrieve preloaded challenge configurations from localStorage
          const storedCode = localStorage.getItem("sandbox_code") || "";
          const storedTitle = localStorage.getItem("sandbox_title") || "DSA Challenge";
          const storedLang = localStorage.getItem("sandbox_language") || "javascript";
          
          setCode(storedCode);
          setTitle(storedTitle);
          setLanguage(storedLang);
          setLoading(false);
        } else {
          // Redirect to sign in if unauthenticated
          window.location.href = "/api/auth/signin";
        }
      })
      .catch((err) => {
        console.error("Session load failed in workspace", err);
        window.location.href = "/api/auth/signin";
      });
  }, []);

  if (loading) {
    return (
      <div className="w-screen h-screen flex flex-col justify-center items-center bg-[#09090b] text-zinc-400 gap-3">
        <Loader2 className="animate-spin text-indigo-400" size={24} />
        <span className="text-xs font-mono uppercase tracking-widest text-zinc-500">Launching workspace...</span>
      </div>
    );
  }

  return (
    <div className="w-screen h-screen flex flex-col bg-[#09090b] overflow-hidden select-none">
      <CodeSandbox
        userId={userId}
        activeChatId=""
        initialCode={code || ""}
        initialProblemTitle={title}
        onClose={() => window.close()}
      />
    </div>
  );
}
