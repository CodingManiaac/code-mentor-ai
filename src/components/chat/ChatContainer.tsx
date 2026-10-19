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
  CheckCircle2,
  Settings,
  Mic,
  MicOff,
  List,
  Compass,
} from "lucide-react";
import MentorDashboard from "./MentorDashboard";
import CodeSandbox from "./CodeSandbox";

const GithubIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    {...props}
  >
    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
  </svg>
);

const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" width="16" height="16" {...props}>
    <path
      fill="#EA4335"
      d="M5.266 9.765A7.077 7.077 0 0 1 12 4.909c1.69 0 3.218.6 4.418 1.582L19.91 3C17.782 1.145 15.055 0 12 0 7.27 0 3.19 2.698 1.24 6.65l4.026 3.115z"
    />
    <path
      fill="#34A853"
      d="M16.04 15.345c-1.077.732-2.436 1.173-4.04 1.173a7.077 7.077 0 0 1-6.734-4.856L3.24 14.777C5.19 18.73 9.27 21.428 14 21.428c2.99 0 5.755-1.09 7.845-2.986l-5.805-3.097z"
    />
    <path
      fill="#4285F4"
      d="M23.49 12.277c0-.818-.073-1.609-.209-2.373H12v4.582h6.482A5.62 5.62 0 0 1 16.04 15.345l5.805 3.097c3.39-3.136 5.345-7.755 5.345-12.277z"
    />
    <path
      fill="#FBBC05"
      d="M5.266 12.277c0-.855.145-1.682.409-2.512L1.65 6.65A11.968 11.968 0 0 0 1 12c0 1.9.445 3.7 1.24 5.35l4.026-3.115A7.062 7.062 0 0 1 5.266 12.277z"
    />
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

const ACCENTS = {
  indigo: {
    bg: "bg-indigo-600",
    hoverBg: "hover:bg-indigo-500",
    activeBg: "active:bg-indigo-700",
    text: "text-indigo-400",
    border: "border-indigo-500/20",
    bgMuted: "bg-indigo-500/10",
    accentBorder: "border-indigo-500",
    accentBg: "bg-indigo-600",
    shadow: "shadow-indigo-600/20",
    focusBorder: "focus:border-indigo-500",
  },
  emerald: {
    bg: "bg-emerald-600",
    hoverBg: "hover:bg-emerald-500",
    activeBg: "active:bg-emerald-700",
    text: "text-emerald-400",
    border: "border-emerald-500/20",
    bgMuted: "bg-emerald-500/10",
    accentBorder: "border-emerald-500",
    accentBg: "bg-emerald-600",
    shadow: "shadow-emerald-600/20",
    focusBorder: "focus:border-emerald-500",
  },
  pink: {
    bg: "bg-pink-600",
    hoverBg: "hover:bg-pink-500",
    activeBg: "active:bg-pink-700",
    text: "text-pink-400",
    border: "border-pink-500/20",
    bgMuted: "bg-pink-500/10",
    accentBorder: "border-pink-500",
    accentBg: "bg-pink-600",
    shadow: "shadow-pink-600/20",
    focusBorder: "focus:border-pink-500",
  },
};

export default function ChatContainer() {
  // Authentication & Session State
  const [session, setSession] = useState<any>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [devEmail, setDevEmail] = useState("student@example.com");
  const [devName, setDevName] = useState("Student User");
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const [providers, setProviders] = useState<Record<string, any> | null>(null);
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  // App Sidebar & Workspace State
  const [mounted, setMounted] = useState(false);
  const [chats, setChats] = useState<ChatSession[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [uploadingFile, setUploadingFile] = useState(false);

  // User Profile & Settings State
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [activeSettingsTab, setActiveSettingsTab] = useState<"profile" | "preferences" | "system">("profile");
  const [userSettings, setUserSettings] = useState<any>(null);
  const [settingsSaving, setSettingsSaving] = useState(false);

  // Settings form input states
  const [profileNameInput, setProfileNameInput] = useState("");
  const [difficultyInput, setDifficultyInput] = useState<"novice" | "intermediate" | "expert">("intermediate");
  const [languageInput, setLanguageInput] = useState("javascript");
  const [themeAccentInput, setThemeAccentInput] = useState<"indigo" | "emerald" | "pink">("indigo");

  const currentAccent = ACCENTS[themeAccentInput] || ACCENTS.indigo;

  // Voice Input (Speech Recognition) State
  const [voiceListening, setVoiceListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Outline navigation state
  const [outlineOpen, setOutlineOpen] = useState(false);

  // AI Mentor Dashboard view mode
  const [viewMode, setViewMode] = useState<"chat" | "dashboard" | "sandbox">("chat");
  const [learningGoalInput, setLearningGoalInput] = useState("Master Data Structures");

  // Global Theme States
  const [theme, setTheme] = useState<"light" | "dark">("dark");

  useEffect(() => {
    const savedTheme = (localStorage.getItem("theme") as "light" | "dark") || "dark";
    setTheme(savedTheme);
    if (savedTheme === "light") {
      document.documentElement.classList.add("light");
    } else {
      document.documentElement.classList.remove("light");
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    localStorage.setItem("theme", nextTheme);
    if (nextTheme === "light") {
      document.documentElement.classList.add("light");
    } else {
      document.documentElement.classList.remove("light");
    }
  };

  // Code Sandbox split-screen states
  const [sandboxCode, setSandboxCode] = useState("");
  const [sandboxLanguage, setSandboxLanguage] = useState("javascript");

  // Voice Synthesis settings state
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [speechVolume, setSpeechVolume] = useState(1);
  const [speechRate, setSpeechRate] = useState(1);
  const [selectedVoiceName, setSelectedVoiceName] = useState("");
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);

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

  const isResendActive = providers ? "resend" in providers : false;
  const isGithubActive = providers ? "github" in providers : false;
  const isGoogleActive = providers ? "google" in providers : false;

  // Enriched attachments are computed inline inside the map preview

  // 1. Fetch Session and Auth Providers on Mount
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

    fetch("/api/auth/providers")
      .then((res) => res.json())
      .then((data) => {
        if (data) setProviders(data);
      })
      .catch((err) => console.error("Providers load failed", err));

    // Load local TTS options
    const savedVolume = localStorage.getItem("speech_volume");
    const savedRate = localStorage.getItem("speech_rate");
    const savedVoice = localStorage.getItem("speech_voice");
    
    if (savedVolume) setSpeechVolume(parseFloat(savedVolume));
    if (savedRate) setSpeechRate(parseFloat(savedRate));
    if (savedVoice) setSelectedVoiceName(savedVoice);

    if (typeof window !== "undefined" && window.speechSynthesis) {
      const synth = window.speechSynthesis;
      const loadVoices = () => {
        const voices = synth.getVoices();
        setAvailableVoices(voices);
      };
      loadVoices();
      if (synth.onvoiceschanged !== undefined) {
        synth.onvoiceschanged = loadVoices;
      }
    }
  }, []);

  // Cancel speech synthesis on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // 2. Fetch User Settings and Preferences when session is loaded
  useEffect(() => {
    if (!session?.user) return;

    fetch("/api/user/preferences")
      .then((res) => res.json())
      .then((data) => {
        if (data && data.preferences) {
          setUserSettings(data);
          setProfileNameInput(data.name || "");
          setDifficultyInput(data.preferences.explanationLevel || "intermediate");
          setLanguageInput(data.preferences.preferredLanguage || "javascript");
          setThemeAccentInput(data.preferences.themeAccent || "indigo");
          setLearningGoalInput(data.preferences.learningGoal || "Master Data Structures");
        }
      })
      .catch((err) => console.error("Failed to load user preferences:", err));
  }, [session]);

  // Listen for open_code_sandbox event from CodeBlock component
  useEffect(() => {
    const handleOpenSandbox = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        setSandboxCode(customEvent.detail.code || "");
        setSandboxLanguage(customEvent.detail.language || "javascript");
        setViewMode("sandbox"); // switch to sandbox view mode!
      }
    };
    window.addEventListener("open_code_sandbox", handleOpenSandbox);
    return () => window.removeEventListener("open_code_sandbox", handleOpenSandbox);
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

  // Authentication login submission handler (Credentials / Magic Link)
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!devEmail.trim()) return;

    try {
      setAuthSubmitting(true);
      if (isResendActive) {
        const res = await signIn("resend", {
          email: devEmail,
          redirect: false,
          callbackUrl: window.location.origin,
        });
        if (res?.error) {
          throw new Error(res.error);
        }
        setMagicLinkSent(true);
      } else {
        // Fallback Credentials Login
        await signIn("credentials", {
          email: devEmail,
          name: devName || "Student User",
          redirect: false,
        });
        // Fetch session state again
        const res = await fetch("/api/auth/session");
        const data = await res.json();
        if (data && data.user) {
          setSession(data);
        }
      }
    } catch (err: any) {
      console.error("Sign-in failed", err);
      alert(`Sign-in failed: ${err.message || "Verify your connection or credentials."}`);
    } finally {
      setAuthSubmitting(false);
    }
  }

  // Callback when student completes a quiz and earns points/level updates
  const handlePointsUpdate = (newScore: number, newLevel: number, newStreak: number) => {
    setUserSettings((prev: any) => {
      if (!prev) return prev;
      return {
        ...prev,
        preferences: {
          ...prev.preferences,
          score: newScore,
          level: newLevel,
          currentStreak: newStreak,
        },
      };
    });
  };

  const handleLearningGoalChange = (val: string) => {
    setLearningGoalInput(val);
  };

  // Submit settings changes to API route
  async function handleSaveSettings() {
    try {
      setSettingsSaving(true);
      const res = await fetch("/api/user/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: profileNameInput,
          explanationLevel: difficultyInput,
          preferredLanguage: languageInput,
          themeAccent: themeAccentInput,
          learningGoal: learningGoalInput,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        // Update session client details
        setSession((prev: any) => ({
          ...prev,
          user: {
            ...prev.user,
            name: data.name,
          },
        }));
        // Update user settings card
        setUserSettings((prev: any) => ({
          ...prev,
          name: data.name,
          preferences: data.preferences,
        }));
        setSettingsOpen(false);
      } else {
        alert("Failed to save changes. Verify database connection.");
      }
    } catch (e) {
      console.error("Save settings error:", e);
      alert("Error saving settings.");
    } finally {
      setSettingsSaving(false);
    }
  }

  // Export Chat History as a JSON file download
  async function handleExportHistory() {
    try {
      const res = await fetch("/api/user/export");
      if (!res.ok) {
        alert("Failed to export chat history.");
        return;
      }
      const data = await res.json();
      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
        JSON.stringify(data, null, 2)
      )}`;
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", jsonString);
      downloadAnchor.setAttribute("download", `codementor_chat_history.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (err) {
      console.error("Export history error:", err);
      alert("Error exporting history.");
    }
  }

  // Purge all user chats and files
  async function handlePurgeHistory() {
    const doubleConfirm = confirm(
      "WARNING: This will permanently delete all your chats, messages, and uploaded files. This action cannot be undone.\n\nAre you sure you want to proceed?"
    );
    if (!doubleConfirm) return;

    try {
      const res = await fetch("/api/chats", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ purgeAll: true }),
      });

      if (res.ok) {
        setChats([]);
        setActiveChatId(null);
        setMessages([]);
        setAttachments([]);
        setSettingsOpen(false);
        alert("All conversations have been successfully deleted.");
      } else {
        alert("Failed to purge conversations. Try again.");
      }
    } catch (e) {
      console.error("Purge error:", e);
      alert("Error purging conversations.");
    }
  }

  const handleVoiceChange = (voiceName: string) => {
    setSelectedVoiceName(voiceName);
    localStorage.setItem("speech_voice", voiceName);
  };

  const handleVolumeChange = (vol: number) => {
    setSpeechVolume(vol);
    localStorage.setItem("speech_volume", vol.toString());
  };

  const handleRateChange = (rate: number) => {
    setSpeechRate(rate);
    localStorage.setItem("speech_rate", rate.toString());
  };

  // Toggle voice dictation using browser SpeechRecognition API
  function toggleVoiceListening() {
    if (typeof window === "undefined") return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      alert("Notice: Speech-to-Text is not supported on this browser. For best results, use Google Chrome or Microsoft Edge.");
      return;
    }

    if (voiceListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setVoiceListening(false);
      return;
    }

    try {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = false;
      rec.lang = "en-US";

      rec.onstart = () => {
        setVoiceListening(true);
      };

      rec.onresult = (event: any) => {
        let resultText = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            resultText += event.results[i][0].transcript;
          }
        }
        if (resultText) {
          setInput((prev) => {
            const separator = prev === "" || prev.endsWith(" ") ? "" : " ";
            return prev + separator + resultText.trim();
          });
        }
      };

      rec.onerror = (e: any) => {
        console.error("Speech recognition error:", e);
        setVoiceListening(false);
      };

      rec.onend = () => {
        setVoiceListening(false);
      };

      recognitionRef.current = rec;
      rec.start();
    } catch (err) {
      console.error("Failed to start speech recognition:", err);
      setVoiceListening(false);
    }
  }

  // Toggle Text-to-speech playing state for a message
  function handleSpeakToggle(messageId: string, text: string) {
    if (typeof window === "undefined" || !window.speechSynthesis) return;

    if (speakingMessageId === messageId) {
      window.speechSynthesis.cancel();
      setSpeakingMessageId(null);
      return;
    }

    window.speechSynthesis.cancel();

    // Clean markdown syntax tags from text before speaking
    const cleanedText = text
      .replace(/```[\s\S]*?```/g, " [Code snippet omitted] ") // skip code blocks
      .replace(/`([^`]+)`/g, "$1") // strip inline code backticks
      .replace(/[*_#\-+]/g, ""); // strip markdown formatting symbols

    const utterance = new SpeechSynthesisUtterance(cleanedText);
    utterance.volume = speechVolume;
    utterance.rate = speechRate;

    // Apply selected voice if configured, else auto-detect language based on Unicode text scripts
    let voiceToUse = null;
    if (selectedVoiceName) {
      voiceToUse = availableVoices.find((v) => v.name === selectedVoiceName) || null;
    }

    if (!voiceToUse) {
      // 1. Check for Hindi (Devanagari: \u0900-\u097F)
      if (/[\u0900-\u097F]/.test(cleanedText)) {
        voiceToUse = availableVoices.find((v) => v.lang.startsWith("hi")) || null;
        if (!voiceToUse) {
          alert("Notice: No Hindi Text-to-Speech voice is currently installed on this device.\n\nTo hear native Hindi speech, please install the Hindi Language Pack (with Speech/TTS option checked) in your Windows settings (Settings > Time & Language > Language & region > Add a language) and restart your browser.");
        }
      }
      // 2. Check for Telugu (\u0C00-\u0C7F)
      else if (/[\u0C00-\u0C7F]/.test(cleanedText)) {
        voiceToUse = availableVoices.find((v) => v.lang.startsWith("te")) || null;
      }
      // 3. Check for Tamil (\u0B80-\u0BFF)
      else if (/[\u0B80-\u0BFF]/.test(cleanedText)) {
        voiceToUse = availableVoices.find((v) => v.lang.startsWith("ta")) || null;
      }
      // 4. Check for Kannada (\u0C80-\u0CFF)
      else if (/[\u0C80-\u0CFF]/.test(cleanedText)) {
        voiceToUse = availableVoices.find((v) => v.lang.startsWith("kn")) || null;
      }
      // 5. Check for Bengali (\u0980-\u09FF)
      else if (/[\u0980-\u09FF]/.test(cleanedText)) {
        voiceToUse = availableVoices.find((v) => v.lang.startsWith("bn")) || null;
      }
      // 6. Check for Spanish accented characters or common markers
      else if (/[áéíóúüñ¿¡]/.test(cleanedText)) {
        voiceToUse = availableVoices.find((v) => v.lang.startsWith("es")) || null;
      }
      // 7. Check for French accented characters
      else if (/[éèàùçâêîôûëïüÿæœ]/.test(cleanedText)) {
        voiceToUse = availableVoices.find((v) => v.lang.startsWith("fr")) || null;
      }
    }

    if (voiceToUse) {
      utterance.voice = voiceToUse;
    }

    utterance.onend = () => {
      setSpeakingMessageId(null);
    };

    utterance.onerror = () => {
      setSpeakingMessageId(null);
    };

    setSpeakingMessageId(messageId);
    window.speechSynthesis.speak(utterance);
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
          <div className={`mx-auto w-12 h-12 rounded-2xl ${currentAccent.bgMuted} flex items-center justify-center mb-4 border ${currentAccent.border}`}>
            <Terminal className={currentAccent.text} size={26} />
          </div>

          <h1 className="text-2xl font-black tracking-tight bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-500 bg-clip-text text-transparent">
            CodeMentor AI
          </h1>
          <p className="text-zinc-400 text-sm mt-2 max-w-xs mx-auto leading-relaxed">
            Log in to persist your learning history, upload files, and save your progress.
          </p>

          <div className="my-6 border-t border-zinc-800/60" />

          {/* Email Sign In View */}
          {magicLinkSent ? (
            <div className="space-y-4 mb-6">
              <div className="mx-auto w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-4 border border-emerald-500/20">
                <CheckCircle2 className="text-emerald-400 animate-pulse" size={26} />
              </div>
              <h3 className="text-base font-bold text-white">Check your email</h3>
              <p className="text-zinc-400 text-xs max-w-xs mx-auto leading-relaxed">
                We've sent a magic sign-in link to <strong className="text-indigo-400 font-semibold">{devEmail}</strong>. Click the link in your inbox to complete your login!
              </p>
              <button
                type="button"
                onClick={() => setMagicLinkSent(false)}
                className="text-[11px] font-semibold text-zinc-500 hover:text-zinc-300 transition underline cursor-pointer"
              >
                Change email address
              </button>
            </div>
          ) : (
            <form onSubmit={handleLogin} className="text-left space-y-4 mb-6">
              <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-1 text-center">
                {providers && "resend" in providers ? "Sign In with Email" : "Quick Sign In"}
              </h3>

              {providers && !("resend" in providers) && (
                <div className="space-y-1.5 animate-fade-in">
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
              )}

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
                  providers && "resend" in providers ? "Send Magic Sign-In Link" : "Start Learning & Coding"
                )}
              </button>
            </form>
          )}

          {/* Social Logins */}
          {(isGithubActive || isGoogleActive) && (
            <div className="space-y-3">
              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-zinc-850"></div>
                <span className="flex-shrink mx-3 text-zinc-650 text-xxs uppercase font-bold tracking-wider">
                  Or connect via
                </span>
                <div className="flex-grow border-t border-zinc-850"></div>
              </div>

              <div className="flex flex-col gap-3">
                {isGithubActive && (
                  <button
                    onClick={() => signIn("github")}
                    className="w-full py-3 px-4 rounded-xl border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 active:bg-zinc-950 transition font-semibold text-sm flex items-center justify-center gap-2.5 cursor-pointer text-zinc-200"
                  >
                    <GithubIcon className="w-[17px] h-[17px]" />
                    Continue with GitHub
                  </button>
                )}

                {isGoogleActive && (
                  <button
                    onClick={() => signIn("google")}
                    className="w-full py-3 px-4 rounded-xl border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 active:bg-zinc-950 transition font-semibold text-sm flex items-center justify-center gap-2.5 cursor-pointer text-zinc-200"
                  >
                    <GoogleIcon className="w-[17px] h-[17px]" />
                    Continue with Google
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // --- AUTHENTICATED CHAT VIEW ---
  return (
    <div className="flex h-full w-full overflow-hidden text-[var(--foreground)] bg-[var(--background)] transition-colors duration-300">
      
      {/* 1. Sidebar */}
      <aside
        className={`glass-panel border-r border-zinc-800/80 flex flex-col transition-all duration-300 z-30 h-full relative
          ${sidebarOpen ? "w-72" : "w-0 overflow-hidden border-r-0"}
        `}
      >
        <div className="flex items-center justify-between p-4 border-b border-[var(--card-border)]">
          <div className="flex items-center gap-2">
            <span className="font-extrabold tracking-tight bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              {mode === "teacher" ? "Teacher Chats" : "Coding Chats"}
            </span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-1.5 hover:bg-[var(--sidebar-item-hover)] rounded-lg text-[var(--btn-text)] hover:text-[var(--foreground)] transition cursor-pointer"
            title="Collapse Sidebar"
          >
            <PanelLeftClose size={18} />
          </button>
        </div>

        <div className="p-3">
          <button
            onClick={() => handleCreateNewChat(mode)}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-dashed border-[var(--btn-border)] bg-[var(--btn-bg)] hover:bg-[var(--btn-hover-bg)] text-[var(--btn-text)] hover:text-[var(--btn-hover-text)] transition-all font-semibold text-sm cursor-pointer animate-fade-in"
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
                    ? "bg-[var(--sidebar-item-active)] border-[var(--btn-border)] shadow-sm text-[var(--foreground)]"
                    : "bg-transparent border-transparent text-[var(--btn-text)] hover:bg-[var(--sidebar-item-hover)] hover:text-[var(--foreground)]"
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
        <div className="p-3.5 border-t border-[var(--card-border)] bg-[var(--sidebar-item-hover)] flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            {session.user.image ? (
              <img
                src={session.user.image}
                alt="Profile"
                className="h-8 w-8 rounded-full border border-[var(--btn-border)] bg-[var(--btn-bg)]"
              />
            ) : (
            <div className="h-8 w-8 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-xs font-bold text-indigo-400">
                U
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-[var(--foreground)] truncate leading-tight">
                {session.user.name || "User"}
              </p>
              <p className="text-xxs text-[var(--btn-text)] truncate leading-normal">
                {session.user.email}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setSettingsOpen(true)}
              className="p-1.5 hover:bg-[var(--sidebar-item-active)] hover:text-indigo-400 rounded-lg text-[var(--btn-text)] transition cursor-pointer"
              title="Settings"
            >
              <Settings size={15} />
            </button>
            <button
              onClick={() => {
                signOut({ redirect: false }).then(() => {
                  setSession(null);
                  setChats([]);
                  setActiveChatId(null);
                });
              }}
              className="p-1.5 hover:bg-[var(--sidebar-item-active)] hover:text-red-400 rounded-lg text-[var(--btn-text)] transition cursor-pointer"
              title="Log Out"
            >
              <LogOut size={15} />
            </button>
          </div>
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

        {/* Floating Outline Drawer Toggle */}
        {displayMessages.length > 0 && (
          <button
            onClick={() => setOutlineOpen(!outlineOpen)}
            className="absolute right-4 top-4 z-40 p-2 glass-panel border border-zinc-800 hover:bg-zinc-800/50 rounded-xl text-zinc-350 hover:text-zinc-150 transition cursor-pointer"
            title="Toggle Chat Outline Menu"
          >
            <List size={19} />
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

          {/* Mode Selector Button */}
          {displayMessages.length > 0 && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
              <button
                onClick={() => setViewMode(viewMode === "chat" ? "dashboard" : "chat")}
                className={`py-1.5 px-3 text-[10px] font-bold uppercase tracking-wider rounded-xl border flex items-center gap-1.5 transition cursor-pointer ${
                  viewMode === "dashboard"
                    ? `${currentAccent.bg} text-white border-transparent`
                    : "bg-[var(--btn-bg)] border-[var(--btn-border)] text-[var(--btn-text)] hover:bg-[var(--btn-hover-bg)] hover:text-[var(--btn-hover-text)]"
                }`}
              >
                {viewMode === "dashboard" ? <MessageSquare size={12} /> : <Compass size={12} />}
                <span>{viewMode === "dashboard" ? "Chat Feed" : "AI Mentor Dashboard"}</span>
              </button>

              <button
                onClick={() => {
                  localStorage.removeItem("sandbox_code");
                  localStorage.setItem("sandbox_title", "DSA Coding Sandbox");
                  window.open("/sandbox", "_blank");
                }}
                className="py-1.5 px-3 text-[10px] font-bold uppercase tracking-wider rounded-xl border border-[var(--btn-border)] bg-[var(--btn-bg)] text-[var(--btn-text)] hover:bg-[var(--btn-hover-bg)] hover:text-[var(--btn-hover-text)] flex items-center gap-1.5 transition cursor-pointer"
              >
                <Code size={12} />
                <span>Coding Sandbox</span>
              </button>

              <button
                onClick={toggleTheme}
                className="py-1.5 px-3 text-[10px] font-bold uppercase tracking-wider rounded-xl border border-[var(--btn-border)] bg-[var(--btn-bg)] text-[var(--btn-text)] hover:bg-[var(--btn-hover-bg)] hover:text-[var(--btn-hover-text)] flex items-center gap-1.5 transition cursor-pointer"
              >
                <span>{theme === "light" ? "🌙 Dark" : "☀️ Light"} Mode</span>
              </button>
            </div>
          )}
        </header>

        {/* Chat Stream & Sidebar Navigation Split Layout */}
        <div className="flex-1 flex min-h-0 w-full overflow-hidden relative">
          
          {/* Main Left Chat Area */}
          <div className="flex-1 flex flex-col h-full min-w-0 relative">
            
            {viewMode === "dashboard" ? (
              <MentorDashboard
                userId={session?.user?.id}
                stats={
                  userSettings?.preferences || {
                    score: 0,
                    level: 1,
                    currentStreak: 0,
                    longestStreak: 0,
                    totalCorrect: 0,
                    totalIncorrect: 0,
                    totalQuizzes: 0,
                    averageAccuracy: 0,
                    learningGoal: "Master Data Structures",
                    weakConcepts: [],
                    strongConcepts: [],
                    masteredConcepts: [],
                    masteries: [],
                    lastQuizTopic: null,
                    lastQuizAccuracy: null,
                    lastQuizDifficulty: null,
                  }
                }
                currentAccent={currentAccent}
                onClose={() => setViewMode("chat")}
              />
            ) : (
              <>
                {/* Chat Stream View */}
                <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-6 max-w-4xl mx-auto w-full relative">
          
          <ModeToggle
            mode={mode}
            onModeChange={handleModeChange}
          />

          {displayMessages.length === 0 ? (
            <div className="flex flex-col justify-center items-center py-6 w-full animate-slide-up">
              
              {/* Greetings Banner */}
              <div className="glass-panel w-full p-8 rounded-3xl text-center mb-8 border border-[var(--card-border)] bg-[var(--card-bg)] text-[var(--foreground)]">
                <div className={`mx-auto w-12 h-12 rounded-2xl ${currentAccent.bgMuted} flex items-center justify-center mb-4 border ${currentAccent.border}`}>
                  {mode === "teacher" ? (
                    <GraduationCap className={currentAccent.text} size={24} />
                  ) : (
                    <Code className={currentAccent.text} size={24} />
                  )}
                </div>
                
                <h2 className="text-xl font-bold mb-2 text-[var(--foreground)]">
                  {mode === "teacher"
                    ? "Welcome to Teacher Mode!"
                    : "Welcome to Coding Mode!"}
                </h2>
                <p className="text-[var(--btn-text)] text-sm leading-relaxed max-w-md mx-auto">
                  {mode === "teacher"
                    ? "Ask general learning queries, request code walkthroughs, or get complex algorithms explained step-by-step with simple analogies."
                    : "Upload a script or image to scan for logic bugs, calculate time complexity, optimize performance, or format cleaner code."}
                </p>

                {/* Upload Area inside Greeting */}
                <div className="mt-6 max-w-md mx-auto text-[var(--foreground)]">
                  <UploadBox
                    onFileUpload={handleFileUpload}
                  />
                  {uploadingFile && (
                    <div className={`mt-2 text-xxs font-semibold ${currentAccent.text} animate-pulse flex items-center justify-center gap-1.5`}>
                      <Loader2 className="animate-spin" size={11} />
                      Streaming to secure storage...
                    </div>
                  )}
                </div>
              </div>

              {/* Suggestions Quick Cards */}
              <div className="w-full">
                <h3 className="text-xs font-semibold text-[var(--btn-text)] uppercase tracking-widest mb-3 text-center">
                  Try asking one of these
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {suggestions[mode].map((sug, i) => (
                    <button
                      key={i}
                      onClick={() => submitMessage(sug.prompt)}
                      className="flex flex-col text-left p-4 rounded-xl border border-[var(--card-border)] bg-[var(--btn-bg)] hover:bg-[var(--btn-hover-bg)] hover:border-indigo-500/50 transition duration-200 group cursor-pointer text-[var(--foreground)]"
                    >
                      <div className="mb-2 p-1.5 w-fit rounded-lg bg-[var(--btn-bg)] border border-[var(--btn-border)] text-[var(--btn-text)]">
                        {sug.icon}
                      </div>
                      <span className="text-xs font-semibold text-[var(--btn-text)] group-hover:text-[var(--foreground)] transition-colors">
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
                ?.map((part: any, index) => (
                  <div key={`${message.id}-${index}`} id={`message-${message.id}`} className="scroll-mt-16">
                    <MessageBubble
                      role={message.role === "assistant" ? "assistant" : "user"}
                      content={part.text}
                      isStreaming={
                        status === "streaming" &&
                        message.id === messages[messages.length - 1]?.id
                      }
                      messageId={message.id}
                      isSpeaking={speakingMessageId === message.id}
                      onSpeakToggle={handleSpeakToggle}
                      chatId={activeChatId}
                      onPointsUpdate={handlePointsUpdate}
                    />
                  </div>
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
            <div className="rounded-3xl border border-[var(--card-border)] bg-[var(--card-bg)] p-3 shadow-2xl backdrop-blur-xl transition-colors duration-300">
              
              {/* Attachments preview panel */}
              {attachments.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-2.5 max-h-40 overflow-y-auto p-1 scrollbar-thin">
                  {attachments.map((att, i) => {
                    const enriched = enrichAttachment(att);
                    return (
                      <div
                        key={i}
                        className="flex items-center gap-2.5 rounded-2xl bg-[var(--btn-bg)] border border-[var(--btn-border)] p-2 pr-3.5 max-w-[240px] shadow-sm animate-fade-in"
                      >
                        {enriched.isImage ? (
                          <div className="h-10 w-10 relative rounded-xl overflow-hidden border border-[var(--btn-border)] bg-[var(--btn-bg)] flex-shrink-0">
                            <img
                              src={enriched.content}
                              alt="Upload preview"
                              className="h-full w-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className={`rounded-lg ${currentAccent.bgMuted} border ${currentAccent.border} px-2.5 py-1 text-xxs ${currentAccent.text} font-semibold flex-shrink-0`}>
                            {enriched.language}
                          </div>
                        )}
                        
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-semibold text-[var(--foreground)]">
                            {enriched.name}
                          </p>
                          <p className="text-[10px] text-[var(--btn-text)] mt-0.5">
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
                  className="rounded-full p-2.5 text-[var(--btn-text)] hover:text-[var(--foreground)] hover:bg-[var(--sidebar-item-hover)] transition cursor-pointer disabled:opacity-30"
                  title="Upload code, PDF, or image"
                >
                  <Paperclip size={19} />
                </button>

                {/* Voice Input Typing Mic Button */}
                <button
                  type="button"
                  onClick={toggleVoiceListening}
                  className={`rounded-full p-2.5 transition cursor-pointer ${
                    voiceListening
                      ? "text-red-500 bg-red-500/10 animate-pulse border border-red-500/20"
                      : "text-[var(--btn-text)] hover:text-[var(--foreground)] hover:bg-[var(--sidebar-item-hover)]"
                  }`}
                  title={voiceListening ? "Listening... click to stop" : "Voice Typing (Speech to Text)"}
                >
                  {voiceListening ? <MicOff size={19} /> : <Mic size={19} />}
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
                  className="max-h-48 flex-1 resize-none bg-transparent px-2 py-2.5 text-[var(--foreground)] text-sm placeholder:text-zinc-550 focus:outline-none leading-relaxed"
                />

                <button
                  type="submit"
                  disabled={status === "streaming" || uploadingFile || (!input.trim() && attachments.length === 0)}
                  className={`flex h-10 w-10 items-center justify-center rounded-full transition-all duration-300 ${
                    currentAccent.bg
                  } ${currentAccent.hoverBg} hover:shadow-lg ${currentAccent.shadow} disabled:opacity-30 disabled:hover:shadow-none cursor-pointer text-white`}
                >
                  <ArrowUp size={18} />
                </button>
              </div>
            </div>
          </form>
        </footer>
      </>
    )}

  </div>

          {/* Right Navigation Sidebar (displays the full list of questions) */}
          {outlineOpen && displayMessages.length > 0 && (
            <aside className="w-80 h-full border-l border-zinc-900 bg-[#09090b]/80 backdrop-blur-md flex flex-col flex-shrink-0 animate-slide-left">
              {/* Header */}
              <div className="p-4 border-b border-zinc-900/80 flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                  <List size={13} className={currentAccent.text} />
                  Chat Navigation
                </span>
                <button
                  onClick={() => setOutlineOpen(false)}
                  className="text-zinc-500 hover:text-zinc-350 text-xs px-2 py-1 hover:bg-zinc-850 rounded-xl transition cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Outline List (wraps long text comfortably) */}
              <div className="flex-1 overflow-y-auto p-3.5 space-y-2 scrollbar-thin">
                {displayMessages
                  .map((msg, idx) => {
                    if (msg.role !== "user") return null;
                    const textPart = (msg.parts?.find((p: any) => p.type === "text") as any)?.text || (msg as any).content || "";
                    const cleanText = textPart.trim().replace(/\n/g, " ");

                    return (
                      <button
                        key={msg.id}
                        onClick={() => {
                          const el = document.getElementById(`message-${msg.id}`);
                          if (el) {
                            el.scrollIntoView({ behavior: "smooth", block: "center" });
                          }
                        }}
                        className="w-full text-left px-3.5 py-3.5 text-xs font-semibold text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850/80 rounded-xl transition cursor-pointer leading-relaxed block border border-zinc-900/20 shadow-sm whitespace-normal"
                        title={cleanText}
                      >
                        {cleanText || `Prompt #${idx + 1}`}
                      </button>
                    );
                  })
                  .filter(Boolean)}
              </div>
            </aside>
          )}

        </div>
      </div>

      {/* 3. Slide-over Settings Panel */}
      {settingsOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop overlay */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setSettingsOpen(false)}
          />

          {/* Panel Container */}
          <div className="w-full max-w-md h-full bg-[#09090b]/95 border-l border-zinc-800/80 shadow-2xl relative z-10 flex flex-col animate-slide-left text-zinc-200">
            {/* Header */}
            <div className="p-5 border-b border-zinc-800/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Settings className={currentAccent.text} size={19} />
                <h2 className="text-lg font-bold text-white">Settings</h2>
              </div>
              <button
                onClick={() => setSettingsOpen(false)}
                className="p-1.5 hover:bg-zinc-850 rounded-lg text-zinc-400 hover:text-zinc-200 transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Tab navigation */}
            <div className="flex border-b border-zinc-800/50 text-sm font-semibold">
              <button
                type="button"
                onClick={() => setActiveSettingsTab("profile")}
                className={`flex-1 py-3 text-center border-b-2 transition cursor-pointer ${
                  activeSettingsTab === "profile"
                    ? `${currentAccent.accentBorder} text-white`
                    : "border-transparent text-zinc-500 hover:text-zinc-300"
                }`}
              >
                Profile
              </button>
              <button
                type="button"
                onClick={() => setActiveSettingsTab("preferences")}
                className={`flex-1 py-3 text-center border-b-2 transition cursor-pointer ${
                  activeSettingsTab === "preferences"
                    ? `${currentAccent.accentBorder} text-white`
                    : "border-transparent text-zinc-500 hover:text-zinc-300"
                }`}
              >
                AI Tutor
              </button>
              <button
                type="button"
                onClick={() => setActiveSettingsTab("system")}
                className={`flex-1 py-3 text-center border-b-2 transition cursor-pointer ${
                  activeSettingsTab === "system"
                    ? `${currentAccent.accentBorder} text-white`
                    : "border-transparent text-zinc-500 hover:text-zinc-300"
                }`}
              >
                System
              </button>
            </div>

            {/* Tab Panes */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* Tab 1: Profile Pane */}
              {activeSettingsTab === "profile" && (
                <div className="space-y-5">
                  <div className="flex flex-col items-center gap-3.5 pb-4 border-b border-zinc-900/50">
                    <img
                      src={userSettings?.image || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(profileNameInput || "User")}`}
                      alt="Profile Avatar"
                      className="h-20 w-20 rounded-2xl border border-zinc-800 shadow-md bg-zinc-900"
                    />
                    <div className="text-center">
                      <p className="text-sm font-bold text-white">{profileNameInput || "User"}</p>
                      <p className="text-xs text-zinc-500">{userSettings?.email}</p>
                    </div>
                  </div>

                  {userSettings?.preferences && (
                    <div className="space-y-4">
                      {/* Level and XP Progress */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xxs font-bold text-zinc-550 uppercase">
                          <span>Level {userSettings.preferences.level}</span>
                          <span>{userSettings.preferences.score % 500} / 500 XP</span>
                        </div>
                        <div className="w-full h-2 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
                          <div 
                            className={`h-full ${currentAccent.bg} transition-all duration-300`}
                            style={{ width: `${((userSettings.preferences.score % 500) / 500) * 100}%` }}
                          />
                        </div>
                      </div>

                      {/* Streaks & Accuracies Metrics */}
                      <div className="grid grid-cols-2 gap-3 text-center">
                        <div className="bg-zinc-900/40 border border-zinc-900 p-2.5 rounded-xl">
                          <span className="text-[9px] font-bold text-zinc-550 block uppercase">Current Streak</span>
                          <span className="text-xs font-black text-amber-500 font-mono flex items-center justify-center gap-1">
                            🔥 {userSettings.preferences.currentStreak} Days
                          </span>
                        </div>
                        <div className="bg-zinc-900/40 border border-zinc-900 p-2.5 rounded-xl">
                          <span className="text-[9px] font-bold text-zinc-550 block uppercase">Avg Accuracy</span>
                          <span className="text-xs font-black text-emerald-400 font-mono">
                            🎯 {userSettings.preferences.averageAccuracy}%
                          </span>
                        </div>
                      </div>

                      {/* Badges Collection */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-450">Achievements Badges</label>
                        {userSettings.preferences.badgesList?.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {userSettings.preferences.badgesList.map((badge: string) => (
                              <span key={badge} className="text-[9px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full">
                                🏆 {badge}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-[10px] text-zinc-550 italic">No badges unlocked yet. Complete quizzes to earn badges!</p>
                        )}
                       </div>

                       {/* Edit Learning Goal input */}
                       <div className="space-y-1.5 pt-2 border-t border-zinc-900/50">
                         <label className="text-xs font-semibold text-zinc-400">Learning Goal Target</label>
                         <select
                           value={learningGoalInput}
                           onChange={(e) => handleLearningGoalChange(e.target.value)}
                           className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                         >
                           <option value="Master Data Structures">Master Data Structures</option>
                           <option value="Prepare for Coding Interviews">Prepare for Coding Interviews</option>
                           <option value="Crack GATE CSE Exam">Crack GATE CSE Exam</option>
                           <option value="Learn Frontend Development">Learn Frontend Development</option>
                         </select>
                       </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-zinc-400">Display Name</label>
                    <input
                      type="text"
                      value={profileNameInput}
                      onChange={(e) => setProfileNameInput(e.target.value)}
                      className={`w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none ${currentAccent.focusBorder} transition-colors`}
                      placeholder="Display Name"
                    />
                  </div>
                </div>
              )}

              {/* Tab 2: AI Preferences Pane */}
              {activeSettingsTab === "preferences" && (
                <div className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-zinc-400">Explanation Complexity</label>
                    <div className="grid grid-cols-3 gap-2">
                      {["novice", "intermediate", "expert"].map((level) => (
                        <button
                          key={level}
                          type="button"
                          onClick={() => setDifficultyInput(level as any)}
                          className={`py-2 px-3 text-xs font-bold rounded-xl border transition cursor-pointer uppercase tracking-wider ${
                            difficultyInput === level
                              ? `${currentAccent.bgMuted} ${currentAccent.accentBorder} ${currentAccent.text}`
                              : "bg-zinc-900 border-zinc-800 text-zinc-450 hover:border-zinc-700"
                          }`}
                        >
                          {level}
                        </button>
                      ))}
                    </div>
                    <p className="text-[10px] text-zinc-550 mt-1 leading-relaxed">
                      {difficultyInput === "novice" && "Novice: Explains concepts using simple real-world metaphors and analogies."}
                      {difficultyInput === "intermediate" && "Intermediate: Explains concepts clearly with context-oriented walkthroughs."}
                      {difficultyInput === "expert" && "Expert: Deep-dives directly into syntax details, code execution, and complexity analysis."}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-zinc-400">Default Target Coding Language</label>
                    <select
                      value={languageInput}
                      onChange={(e) => setLanguageInput(e.target.value)}
                      className={`w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none ${currentAccent.focusBorder} transition-colors cursor-pointer`}
                    >
                      {["javascript", "typescript", "python", "java", "cpp", "c", "html", "css"].map((lang) => (
                        <option key={lang} value={lang}>
                          {lang.toUpperCase()}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Tab 3: System Settings Pane */}
              {activeSettingsTab === "system" && (
                <div className="space-y-6">
                  <div className="space-y-2.5">
                    <label className="text-xs font-semibold text-zinc-400">UI Accent Theme</label>
                    <div className="flex gap-3">
                      {["indigo", "emerald", "pink"].map((accent) => (
                        <button
                          key={accent}
                          type="button"
                          onClick={() => setThemeAccentInput(accent as any)}
                          className={`w-9 h-9 rounded-full border-2 transition cursor-pointer relative ${
                            accent === "indigo" ? "bg-indigo-600" : accent === "emerald" ? "bg-emerald-600" : "bg-pink-600"
                          } ${
                            themeAccentInput === accent
                              ? "border-white scale-110 shadow-lg shadow-white/10"
                              : "border-transparent scale-100 hover:scale-105"
                          }`}
                          title={`${accent.toUpperCase()} accent`}
                        >
                          {themeAccentInput === accent && (
                            <span className="absolute inset-0 flex items-center justify-center text-white font-bold text-xs">✓</span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-zinc-900/50 space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-550">Voice Settings (TTS)</h3>
                    
                    <div className="space-y-4">
                      {/* Select Voice */}
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-semibold text-zinc-400">Synthesizer Voice</label>
                        <select
                          value={selectedVoiceName}
                          onChange={(e) => handleVoiceChange(e.target.value)}
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                        >
                          <option value="">System Default Voice</option>
                          {availableVoices.map((voice) => (
                            <option key={voice.name} value={voice.name}>
                              {voice.name} ({voice.lang})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Pitch/Speed Sliders */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-[11px] font-semibold text-zinc-400">
                            <span>Speech Rate (Speed)</span>
                            <span className="text-zinc-500">{speechRate}x</span>
                          </div>
                          <input
                            type="range"
                            min="0.5"
                            max="2.0"
                            step="0.1"
                            value={speechRate}
                            onChange={(e) => handleRateChange(parseFloat(e.target.value))}
                            className="w-full accent-indigo-500 cursor-pointer h-1 bg-zinc-800 rounded-lg appearance-none"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <div className="flex justify-between text-[11px] font-semibold text-zinc-400">
                            <span>Volume</span>
                            <span className="text-zinc-500">{Math.round(speechVolume * 100)}%</span>
                          </div>
                          <input
                            type="range"
                            min="0.0"
                            max="1.0"
                            step="0.1"
                            value={speechVolume}
                            onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                            className="w-full accent-indigo-500 cursor-pointer h-1 bg-zinc-800 rounded-lg appearance-none"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-zinc-900/50 space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-550">Data & History</h3>
                    
                    <div className="space-y-3">
                      {/* Export Button */}
                      <div className="flex items-center justify-between p-3.5 bg-zinc-900/40 border border-zinc-900 rounded-2xl">
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-zinc-200">Export Conversations</p>
                          <p className="text-[10px] text-zinc-500 mt-0.5 leading-relaxed">
                            Download a copy of your chat history and files as a structured JSON file.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={handleExportHistory}
                          className="py-1.5 px-3 rounded-lg border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-850 text-xxs font-bold text-zinc-300 transition cursor-pointer flex-shrink-0"
                        >
                          Export JSON
                        </button>
                      </div>

                      {/* Purge Button */}
                      <div className="flex items-center justify-between p-3.5 bg-red-950/5 border border-red-950/20 rounded-2xl">
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-red-400">Purge Conversations</p>
                          <p className="text-[10px] text-zinc-500 mt-0.5 leading-relaxed">
                            Permanently wipe all chats, messages, and attachments from your account.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={handlePurgeHistory}
                          className="py-1.5 px-3 rounded-lg bg-red-950/35 hover:bg-red-950/50 border border-red-900/30 hover:border-red-900/50 text-xxs font-bold text-red-400 transition cursor-pointer flex-shrink-0"
                        >
                          Delete All
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* Footer Actions */}
            <div className="p-5 border-t border-zinc-800/50 bg-[#09090b]/50 flex justify-end gap-3.5">
              <button
                type="button"
                onClick={() => setSettingsOpen(false)}
                className="py-2.5 px-4 rounded-xl border border-zinc-800 hover:bg-zinc-900 transition text-sm font-semibold cursor-pointer text-zinc-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveSettings}
                disabled={settingsSaving}
                className={`py-2.5 px-5 rounded-xl text-white font-bold text-sm flex items-center gap-2 cursor-pointer disabled:opacity-40 ${currentAccent.bg} ${currentAccent.hoverBg} ${currentAccent.shadow} shadow-lg`}
              >
                {settingsSaving ? (
                  <>
                    <Loader2 className="animate-spin" size={16} />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      
    </div>
  );
}
