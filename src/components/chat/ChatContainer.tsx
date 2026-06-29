"use client";

import {
  useMemo,
  useRef,
  useState,
  useEffect,
} from "react";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { signIn, signOut } from "next-auth/react";

import {
  ArrowUp,
  Paperclip,
  Code,
  GraduationCap,
  Sparkles,
  Bug,
  Zap,
  BookOpen,
  Plus,
  Trash2,
  MessageSquare,
  PanelLeftClose,
  PanelLeft,
  LogOut,
  Terminal,
  User,
  Mail,
  Loader2,
} from "lucide-react";

const GithubIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    {...props}
  >
    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
  </svg>
);
import FileActions from "@/components/FileActions";
import MessageBubble from "@/components/MessageBubble";
import ModeToggle from "@/components/ModeToggle";
import UploadBox from "@/components/UploadBox";
import { enrichAttachment } from "@/lib/attachments";
import type { Attachment } from "@/types/attachment";

interface ChatSession {
  id: string;
  title: string;
  mode: "teacher" | "coding";
  messages: any[];
}

export default function ChatContainer() {
  // Authentication & Session State
  const [session, setSession] = useState<any>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [devEmail, setDevEmail] = useState("student@example.com");
  const [devName, setDevName] = useState("Student User");
  const [authSubmitting, setAuthSubmitting] = useState(false);

  // App Sidebar & Workspace State
  const [mounted, setMounted] = useState(false);
  const [chats, setChats] = useState<ChatSession[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [uploadingFile, setUploadingFile] = useState(false);

  const [input, setInput] = useState("");
  const [attachments, setAttachments] =
    useState<Attachment[]>([]);
  const [mode, setMode] = useState<
    "teacher" | "coding"
  >("teacher");

  const fileInputRef =
    useRef<HTMLInputElement>(null);
  const bottomRef =
    useRef<HTMLDivElement>(null);

  const modeRef = useRef(mode);
  modeRef.current = mode;

  const attachmentsRef = useRef(attachments);
  attachmentsRef.current = attachments;

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        body: () => ({
          mode: modeRef.current,
          attachments: attachmentsRef.current, // Send attachments array!
          chatId: activeChatId, // Send chatId to API endpoint for message logging
        }),
      }),
    [activeChatId]
  );

  // Find the active chat session from database list state
  const activeChat = useMemo(() => {
    return chats.find((c) => c.id === activeChatId) || null;
  }, [chats, activeChatId]);

  // Vercel AI SDK useChat Hook
  const {
    messages,
    sendMessage,
    status,
    setMessages,
  } = useChat({
    id: activeChatId || undefined,
    messages: activeChat?.messages || [],
    transport,
  });

  // Enriched attachments are computed inline inside the map preview

  // 1. Fetch Session on Mount
  useEffect(() => {
    setMounted(true);
    fetch("/api/auth/session")
      .then((res) => res.json())
      .then((data) => {
        if (data && Object.keys(data).length > 0 && data.user) {
          setSession(data);
        }
      })
      .catch((err) => console.error("Session load failed", err))
      .finally(() => setSessionLoading(false));
  }, []);

  // 2. Fetch User Chats from Database when Session is verified
  useEffect(() => {
    if (!session?.user) return;

    fetch("/api/chats")
      .then((res) => res.json())
      .then((dbChats) => {
        if (Array.isArray(dbChats)) {
          setChats(dbChats);
          
          // Re-load last active chat ID or fallback to the first one in the list
          const storedActiveId = localStorage.getItem("codementor_active_chat_id");
          const active = dbChats.find((c) => c.id === storedActiveId) || dbChats[0];
          if (active) {
            setActiveChatId(active.id);
            setMode(active.mode);
          } else {
            // Create a default initial chat in database if user has none
            handleCreateNewChat("teacher");
          }
        }
      })
      .catch((err) => console.error("Failed to load user chats", err));
  }, [session]);

  // 3. Save active chat ID to local storage (for persistence across reloads)
  useEffect(() => {
    if (activeChatId) {
      localStorage.setItem("codementor_active_chat_id", activeChatId);
    }
  }, [activeChatId]);

  // 4. Sync client-side streamed messages and handle Auto-Summarization
  useEffect(() => {
    if (!mounted || !activeChatId || !activeChat || !session) return;

    const hasChanged = JSON.stringify(activeChat.messages) !== JSON.stringify(messages);
    if (!hasChanged) return;

    setChats((prevChats) => {
      const index = prevChats.findIndex((c) => c.id === activeChatId);
      if (index === -1) return prevChats;

      const updatedChats = [...prevChats];
      const currentChat = { ...updatedChats[index], messages, mode };

      // Auto-summarize title based on first user message if it is default
      if (currentChat.title === "New Chat" && messages.length > 0) {
        const firstUserMsg = messages.find((m) => m.role === "user");
        if (firstUserMsg) {
          const text = (firstUserMsg.parts?.find((p: any) => p.type === "text") as any)?.text || "";
          if (text) {
            const newTitle = text.slice(0, 26) + (text.length > 26 ? "..." : "");
            currentChat.title = newTitle;

            // Persist the updated title in the database
            fetch("/api/chats", {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ chatId: activeChatId, title: newTitle }),
            }).catch((err) => console.error("Failed to sync title to DB:", err));
          }
        }
      }

      updatedChats[index] = currentChat;
      return updatedChats;
    });
  }, [messages, mode, activeChatId, activeChat, mounted, session]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (messages.length > 0) {
      bottomRef.current?.scrollIntoView({
        behavior: "smooth",
      });
    }
  }, [messages, status]);

  // Actions
  function handleSelectChat(chat: ChatSession) {
    setActiveChatId(chat.id);
    setMode(chat.mode);
    setAttachments([]);
    setInput("");
  }

  async function handleCreateNewChat(selectedMode: "teacher" | "coding" = "teacher") {
    // Prevent duplicate empty chats
    if (activeChat && activeChat.mode === selectedMode && activeChat.messages.length === 0 && activeChat.title === "New Chat") {
      return;
    }

    const existingEmptyChat = chats.find(
      (c) => c.mode === selectedMode && c.messages.length === 0 && c.title === "New Chat"
    );
    if (existingEmptyChat) {
      setActiveChatId(existingEmptyChat.id);
      setAttachments([]);
      setInput("");
      return;
    }

    try {
      const res = await fetch("/api/chats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: selectedMode, title: "New Chat" }),
      });
      if (res.ok) {
        const dbChat = await res.json();
        const newChatSession: ChatSession = {
          id: dbChat.id,
          title: dbChat.title,
          mode: dbChat.mode,
          messages: [],
        };
        setChats((prev) => [newChatSession, ...prev]);
        setActiveChatId(dbChat.id);
        setMode(selectedMode);
      }
    } catch (e) {
      console.error("Failed to create new chat in database:", e);
    }
    setAttachments([]);
    setInput("");
  }

  function handleModeChange(newMode: "teacher" | "coding") {
    setMode(newMode);
    
    const chatsOfNewMode = chats.filter((c) => c.mode === newMode);
    if (chatsOfNewMode.length > 0) {
      const mostRecent = chatsOfNewMode[0];
      setActiveChatId(mostRecent.id);
    } else {
      handleCreateNewChat(newMode);
    }
    setAttachments([]);
    setInput("");
  }

  async function handleDeleteChat(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    try {
      const res = await fetch("/api/chats", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatId: id }),
      });
      
      if (res.ok) {
        setChats((prev) => {
          const updated = prev.filter((c) => c.id !== id);
          
          if (activeChatId === id) {
            const remainingChatsOfMode = updated.filter((c) => c.mode === mode);
            if (remainingChatsOfMode.length > 0) {
              setActiveChatId(remainingChatsOfMode[0].id);
            } else {
              // Fallback to create a fresh chat in active mode
              handleCreateNewChat(mode);
            }
          }
          return updated;
        });
      }
    } catch (e) {
      console.error("Failed to delete chat in DB:", e);
    }
  }

  async function handleFileUpload(file: File) {
    if (!activeChatId) {
      alert("Please open or create a chat session first");
      return;
    }

    try {
      setUploadingFile(true);
      const formData = new FormData();
      formData.append("file", file);
      formData.append("chatId", activeChatId);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error("File upload failed on server");
      }

      const dbFile = await res.json();
      
      const newAttachment: Attachment = {
        name: dbFile.name,
        mimeType: dbFile.mimeType,
        size: dbFile.size,
        content: dbFile.url, // Store storage public URL
      };

      setAttachments((prev) => [...prev, newAttachment]);
    } catch (e) {
      console.error("Upload handler error:", e);
      alert("Failed to upload file. Check your server console.");
    } finally {
      setUploadingFile(false);
    }
  }

  function submitMessage(customText?: string) {
    const textToSubmit = customText !== undefined ? customText : input;
    if (!textToSubmit.trim() && attachments.length === 0) return;

    sendMessage({
      text: textToSubmit || "Please analyze the attached files.",
    });

    setInput("");
    setAttachments([]);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  // Developer Credentials Auth submission handler
  async function handleDevLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!devEmail.trim()) return;

    try {
      setAuthSubmitting(true);
      await signIn("credentials", {
        email: devEmail,
        name: devName,
        redirect: false,
      });
      // Fetch session state again
      const res = await fetch("/api/auth/session");
      const data = await res.json();
      if (data && data.user) {
        setSession(data);
      }
    } catch (err) {
      console.error("Developer sign-in failed", err);
      alert("Sign-in failed. Verify database is running.");
    } finally {
      setAuthSubmitting(false);
    }
  }

  // Filter messages to display only user and assistant
  const displayMessages = messages.filter(
    (message) => message.role !== "system"
  );

  // Filter sidebar chat list to display only chats matching active mode
  const filteredChats = useMemo(() => {
    return chats.filter((c) => c.mode === mode);
  }, [chats, mode]);

  // Suggestions depending on active mode
  const suggestions = {
    teacher: [
      {
        icon: <BookOpen size={16} className="text-indigo-400" />,
        label: "Explain recursion simply",
        prompt: "Can you explain recursion using a real-world analogy and a simple code example?",
      },
      {
        icon: <Sparkles size={16} className="text-indigo-400" />,
        label: "What is Big-O complexity?",
        prompt: "Could you walk me through what Big-O notation is and why we calculate time/space complexity?",
      },
      {
        icon: <Code size={16} className="text-indigo-400" />,
        label: "Explain Stack vs Heap",
        prompt: "What is the difference between stack and heap memory allocations? Use an analogy.",
      },
    ],
    coding: [
      {
        icon: <Bug size={16} className="text-emerald-400" />,
        label: "Find bugs in a script",
        prompt: "I want to share my code with you and have you find common bugs or security flaws in it. Let's start.",
      },
      {
        icon: <Zap size={16} className="text-emerald-400" />,
        label: "Optimize database query",
        prompt: "Show me how to optimize slow nested SQL database queries with proper indexing.",
      },
      {
        icon: <Code size={16} className="text-emerald-400" />,
        label: "JavaScript closures",
        prompt: "How do closures work in JavaScript? Explain the root cause of common issues with examples.",
      },
    ],
  };

  // Loading Screen State
  if (!mounted || sessionLoading) {
    return (
      <div className="h-full w-full flex flex-col justify-center items-center py-20 bg-[#09090b] text-zinc-500">
        <Loader2 className="animate-spin text-indigo-500 mb-4" size={32} />
        <div className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent mb-2">
          Loading CodeMentor AI...
        </div>
        <div className="text-xs text-zinc-600">Checking user authentication profile</div>
      </div>
    );
  }

  // --- UNAUTHENTICATED DASHBOARD (LOGIN SCREEN) ---
  if (!session?.user) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-[#09090b] p-4 text-white relative">
        {/* Animated background glows */}
        <div className="absolute top-1/4 left-1/4 w-80 h-80 rounded-full bg-indigo-600/10 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-emerald-600/10 blur-[120px] pointer-events-none" />

        <div className="glass-panel w-full max-w-md p-8 rounded-3xl border border-zinc-800/80 shadow-2xl relative z-10 text-center animate-slide-up">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center mb-5 border border-indigo-500/20">
            <Terminal className="text-indigo-400" size={26} />
          </div>

          <h1 className="text-2xl font-black tracking-tight bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-500 bg-clip-text text-transparent">
            CodeMentor AI
          </h1>
          <p className="text-zinc-400 text-sm mt-2 max-w-xs mx-auto leading-relaxed">
            Log in to persist your learning history, upload files, and save your progress.
          </p>

          <div className="my-6 border-t border-zinc-800/60" />

          {/* Quick Account Login Form */}
          <form onSubmit={handleDevLogin} className="text-left space-y-4 mb-6">
            <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-1 text-center">
              Quick Sign In
            </h3>

            <div className="space-y-1.5">
              <label className="text-xs text-zinc-450 font-semibold flex items-center gap-1.5">
                <User size={13} className="text-zinc-500" />
                Full Name
              </label>
              <input
                type="text"
                value={devName}
                onChange={(e) => setDevName(e.target.value)}
                required
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
                placeholder="Student User"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-zinc-450 font-semibold flex items-center gap-1.5">
                <Mail size={13} className="text-zinc-500" />
                Email Address
              </label>
              <input
                type="email"
                value={devEmail}
                onChange={(e) => setDevEmail(e.target.value)}
                required
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
                placeholder="student@example.com"
              />
            </div>

            <button
              type="submit"
              disabled={authSubmitting}
              className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 transition font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-650/20 disabled:opacity-40 cursor-pointer text-white"
            >
              {authSubmitting ? (
                <Loader2 className="animate-spin" size={16} />
              ) : (
                "Start Learning & Coding"
              )}
            </button>
          </form>

          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-zinc-850"></div>
            <span className="flex-shrink mx-3 text-zinc-650 text-xxs uppercase font-bold tracking-wider">
              Or connect via
            </span>
            <div className="flex-grow border-t border-zinc-850"></div>
          </div>

          {/* Social Github Login */}
          <button
            onClick={() => signIn("github")}
            className="mt-4 w-full py-3 px-4 rounded-xl border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 active:bg-zinc-950 transition font-semibold text-sm flex items-center justify-center gap-2.5 cursor-pointer text-zinc-200"
          >
            <GithubIcon className="w-[17px] h-[17px]" />
            Continue with GitHub
          </button>
        </div>
      </div>
    );
  }

  // --- AUTHENTICATED CHAT VIEW ---
  return (
    <div className="flex h-full w-full overflow-hidden text-white bg-[#09090b]">
      
      {/* 1. Sidebar */}
      <aside
        className={`glass-panel border-r border-zinc-800/80 flex flex-col transition-all duration-300 z-30 h-full relative
          ${sidebarOpen ? "w-72" : "w-0 overflow-hidden border-r-0"}
        `}
      >
        <div className="flex items-center justify-between p-4 border-b border-zinc-800/50">
          <div className="flex items-center gap-2">
            <span className="font-extrabold tracking-tight bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              {mode === "teacher" ? "Teacher Chats" : "Coding Chats"}
            </span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-1.5 hover:bg-zinc-850/80 rounded-lg text-zinc-400 hover:text-zinc-200 transition cursor-pointer"
            title="Collapse Sidebar"
          >
            <PanelLeftClose size={18} />
          </button>
        </div>

        <div className="p-3">
          <button
            onClick={() => handleCreateNewChat(mode)}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-dashed border-zinc-700 bg-zinc-900/35 hover:bg-zinc-800/50 transition-all font-semibold text-sm cursor-pointer animate-fade-in"
          >
            <Plus size={16} />
            New Chat
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-2 space-y-1.5 pb-6">
          {filteredChats.map((chat) => (
            <div
              key={chat.id}
              onClick={() => handleSelectChat(chat)}
              className={`group flex items-center justify-between p-3 rounded-xl cursor-pointer border transition-all duration-200
                ${
                  chat.id === activeChatId
                    ? "bg-zinc-800/40 border-zinc-700/60 shadow-md text-zinc-100"
                    : "bg-transparent border-transparent text-zinc-400 hover:bg-zinc-900/45 hover:text-zinc-200"
                }
              `}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <MessageSquare size={15} className="flex-shrink-0 opacity-60" />
                <span className="truncate text-sm font-medium leading-none">
                  {chat.title}
                </span>
              </div>
              <button
                onClick={(e) => handleDeleteChat(chat.id, e)}
                className="opacity-0 group-hover:opacity-100 hover:text-red-400 p-1 rounded transition-opacity duration-200"
                title="Delete Chat"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>

        {/* Sidebar Footer User Details Profile */}
        <div className="p-3.5 border-t border-zinc-850/60 bg-zinc-950/20 flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            {session.user.image ? (
              <img
                src={session.user.image}
                alt="Profile"
                className="h-8 w-8 rounded-full border border-zinc-800 bg-zinc-900"
              />
            ) : (
              <div className="h-8 w-8 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-xs font-bold text-indigo-400">
                U
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-zinc-200 truncate leading-tight">
                {session.user.name || "User"}
              </p>
              <p className="text-xxs text-zinc-500 truncate leading-normal">
                {session.user.email}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              signOut({ redirect: false }).then(() => {
                setSession(null);
                setChats([]);
                setActiveChatId(null);
              });
            }}
            className="p-1.5 hover:bg-zinc-850 hover:text-red-400 rounded-lg text-zinc-500 transition cursor-pointer"
            title="Log Out"
          >
            <LogOut size={15} />
          </button>
        </div>
      </aside>

      {/* 2. Main Content Window */}
      <div className="flex-1 flex flex-col h-full min-w-0 relative">
        
        {/* Toggle Sidebar Trigger (when collapsed) */}
        {!sidebarOpen && (
          <button
            onClick={() => setSidebarOpen(true)}
            className="absolute left-4 top-4 z-40 p-2 glass-panel border border-zinc-800 hover:bg-zinc-800/50 rounded-xl text-zinc-350 hover:text-zinc-150 transition cursor-pointer"
            title="Expand Sidebar"
          >
            <PanelLeft size={19} />
          </button>
        )}

        {/* Header toolbar */}
        <header className="py-4 border-b border-zinc-900/50 flex flex-col justify-center items-center relative z-25">
          <h1 className="text-2xl font-black tracking-tight bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-500 bg-clip-text text-transparent">
            CodeMentor AI
          </h1>
          <p className="text-zinc-500 text-xxs mt-0.5 tracking-wide uppercase font-semibold">
            Interactive Concept Teacher & Debugger
          </p>
        </header>

        {/* Chat Stream View */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-6 max-w-4xl mx-auto w-full">
          
          <ModeToggle
            mode={mode}
            onModeChange={handleModeChange}
          />

          {displayMessages.length === 0 ? (
            <div className="flex flex-col justify-center items-center py-6 w-full animate-slide-up">
              
              {/* Greetings Banner */}
              <div className="glass-panel w-full p-8 rounded-3xl text-center mb-8 border border-zinc-800/80">
                <div className="mx-auto w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center mb-4 border border-indigo-500/20">
                  {mode === "teacher" ? (
                    <GraduationCap className="text-indigo-400" size={24} />
                  ) : (
                    <Code className="text-emerald-400" size={24} />
                  )}
                </div>
                
                <h2 className="text-xl font-bold mb-2">
                  {mode === "teacher"
                    ? "Welcome to Teacher Mode!"
                    : "Welcome to Coding Mode!"}
                </h2>
                <p className="text-zinc-400 text-sm leading-relaxed max-w-md mx-auto">
                  {mode === "teacher"
                    ? "Ask general learning queries, request code walkthroughs, or get complex algorithms explained step-by-step with simple analogies."
                    : "Upload a script or image to scan for logic bugs, calculate time complexity, optimize performance, or format cleaner code."}
                </p>

                {/* Upload Area inside Greeting */}
                <div className="mt-6 max-w-md mx-auto">
                  <UploadBox
                    onFileUpload={handleFileUpload}
                  />
                  {uploadingFile && (
                    <div className="mt-2 text-xxs font-semibold text-indigo-400 animate-pulse flex items-center justify-center gap-1.5">
                      <Loader2 className="animate-spin" size={11} />
                      Streaming to secure storage...
                    </div>
                  )}
                </div>
              </div>

              {/* Suggestions Quick Cards */}
              <div className="w-full">
                <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-3 text-center">
                  Try asking one of these
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {suggestions[mode].map((sug, i) => (
                    <button
                      key={i}
                      onClick={() => submitMessage(sug.prompt)}
                      className="flex flex-col text-left p-4 rounded-xl border border-zinc-850 bg-zinc-950/40 hover:bg-zinc-900/60 hover:border-zinc-700 transition duration-200 group cursor-pointer"
                    >
                      <div className="mb-2 p-1.5 w-fit rounded-lg bg-zinc-900 border border-zinc-800">
                        {sug.icon}
                      </div>
                      <span className="text-xs font-semibold text-zinc-300 group-hover:text-zinc-100 transition-colors">
                        {sug.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

            </div>
          ) : (
            displayMessages.map((message) =>
              message.parts
                ?.filter((part) => part.type === "text")
                .map((part: any, index) => (
                  <MessageBubble
                    key={`${message.id}-${index}`}
                    role={message.role === "assistant" ? "assistant" : "user"}
                    content={part.text}
                    isStreaming={
                      status === "streaming" &&
                      message.id === messages[messages.length - 1]?.id
                    }
                  />
                ))
            )
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input Bar */}
        <footer className="w-full max-w-4xl mx-auto px-4 pb-6">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              submitMessage();
            }}
          >
            <div className="rounded-3xl border border-zinc-800/80 bg-zinc-950/70 p-3 shadow-2xl backdrop-blur-xl">
              
              {/* Attachments preview panel */}
              {attachments.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-2.5 max-h-40 overflow-y-auto p-1 scrollbar-thin">
                  {attachments.map((att, i) => {
                    const enriched = enrichAttachment(att);
                    return (
                      <div
                        key={i}
                        className="flex items-center gap-2.5 rounded-2xl bg-zinc-900/60 border border-zinc-800/50 p-2 pr-3.5 max-w-[240px] shadow-sm animate-fade-in"
                      >
                        {enriched.isImage ? (
                          <div className="h-10 w-10 relative rounded-xl overflow-hidden border border-zinc-700 bg-zinc-950 flex-shrink-0">
                            <img
                              src={enriched.content}
                              alt="Upload preview"
                              className="h-full w-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="rounded-lg bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 text-xxs text-indigo-400 font-semibold flex-shrink-0">
                            {enriched.language}
                          </div>
                        )}
                        
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-semibold text-zinc-200">
                            {enriched.name}
                          </p>
                          <p className="text-[10px] text-zinc-500 mt-0.5">
                            {enriched.formattedSize}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setAttachments((prev) => prev.filter((_, idx) => idx !== i));
                          }}
                          className="text-zinc-400 hover:text-red-400 p-1 hover:bg-zinc-850/50 rounded-lg transition"
                          title="Remove file"
                        >
                          ✕
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {attachments.some(att => !att.mimeType.startsWith("image/")) && (
                <div className="mb-2">
                  <FileActions
                    onAction={(prompt) => {
                      setInput(prompt);
                    }}
                  />
                </div>
              )}

              {/* Text Input Row */}
              <div className="flex items-end gap-2 px-1">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingFile}
                  className="rounded-full p-2.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850/50 transition cursor-pointer disabled:opacity-30"
                  title="Upload code, PDF, or image"
                >
                  <Paperclip size={19} />
                </button>

                <input
                  ref={fileInputRef}
                  hidden
                  type="file"
                  accept=".c,.cpp,.java,.py,.js,.ts,.tsx,.txt,.pdf,image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    await handleFileUpload(file);
                  }}
                />

                <textarea
                  rows={1}
                  value={input}
                  placeholder={
                    attachments.some(att => att.mimeType.startsWith("image/"))
                      ? "Ask a question about the attached image(s)..."
                      : `Ask a ${mode === "teacher" ? "learning" : "coding"} question...`
                  }
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      submitMessage();
                    }
                  }}
                  className="max-h-48 flex-1 resize-none bg-transparent px-2 py-2.5 text-white text-sm placeholder:text-zinc-550 focus:outline-none leading-relaxed"
                />

                <button
                  type="submit"
                  disabled={status === "streaming" || uploadingFile || (!input.trim() && attachments.length === 0)}
                  className={`flex h-10 w-10 items-center justify-center rounded-full transition-all duration-300 ${
                    mode === "teacher"
                      ? "bg-indigo-600 hover:bg-indigo-500 hover:shadow-lg hover:shadow-indigo-600/30"
                      : "bg-emerald-600 hover:bg-emerald-500 hover:shadow-lg hover:shadow-emerald-600/30"
                  } disabled:opacity-30 disabled:hover:shadow-none cursor-pointer`}
                >
                  <ArrowUp size={18} />
                </button>
              </div>
            </div>
          </form>
        </footer>

      </div>
      
    </div>
  );
}
