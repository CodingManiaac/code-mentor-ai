import React, { useState, useEffect } from "react";
import { Award, Target, Flame, Compass, CheckCircle2, ShieldAlert, Sparkles, Send, Loader2, GitBranch, Calendar, FileText, HardDrive } from "lucide-react";

interface ProfileStats {
  score: number;
  level: number;
  currentStreak: number;
  longestStreak: number;
  totalCorrect: number;
  totalIncorrect: number;
  totalQuizzes: number;
  averageAccuracy: number;
  learningGoal: string;
  weakConcepts: string[];
  strongConcepts: string[];
  masteredConcepts: string[];
  masteries: { topic: string; mastery: number }[];
  lastQuizTopic: string | null;
  lastQuizAccuracy: number | null;
  lastQuizDifficulty: string | null;
}

interface MentorDashboardProps {
  userId: string;
  stats: ProfileStats;
  currentAccent: any;
  onClose: () => void;
}

export default function MentorDashboard({ userId, stats, currentAccent, onClose }: MentorDashboardProps) {
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);
  const [composioRunning, setComposioRunning] = useState<string | null>(null);
  const [composioLogs, setComposioLogs] = useState<string[]>([]);
  const [certifyingTopic, setCertifyingTopic] = useState<string | null>(null);

  // Fetch leaderboard ranking data
  useEffect(() => {
    setLoadingLeaderboard(true);
    fetch("/api/leaderboard")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setLeaderboard(data);
      })
      .catch((e) => console.error("Failed to load leaderboard", e))
      .finally(() => setLoadingLeaderboard(false));
  }, []);

  // Trigger Composio operations
  const triggerComposio = async (actionType: string) => {
    setComposioRunning(actionType);
    setComposioLogs([]);
    try {
      const res = await fetch("/api/composio/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: actionType,
          details: {
            topic: stats.lastQuizTopic || "Data Structures",
            accuracy: stats.averageAccuracy,
            xpEarned: 100,
          },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setComposioLogs(data.actions || []);
      }
    } catch (e) {
      console.error("Composio webhook trigger error:", e);
    } finally {
      setTimeout(() => {
        setComposioRunning(null);
      }, 1000);
    }
  };

  // Learning Roadmap definition
  const roadmapNodes = [
    { name: "Arrays", masteryKey: "Arrays", requiredVal: 90, desc: "Sequences & indexing rules" },
    { name: "Linked Lists", masteryKey: "Linked Lists", requiredVal: 90, desc: "Nodes and pointer alignments" },
    { name: "Stacks", masteryKey: "Stacks", requiredVal: 90, desc: "LIFO structures & stack frames" },
    { name: "Queues", masteryKey: "Queues", requiredVal: 90, desc: "FIFO circular buffers & queues" },
    { name: "Trees", masteryKey: "Trees", requiredVal: 80, desc: "BST insertions & AVL rotations" },
    { name: "Graphs", masteryKey: "Graphs", requiredVal: 80, desc: "DFS/BFS traversals & Dykstra paths" },
  ];

  const getTopicMastery = (topicName: string) => {
    if (!Array.isArray(stats.masteries)) return 0;
    
    const normalize = (s: string) => 
      s.toLowerCase()
       .replace(/s$/, "")
       .replace(/[^a-z0-9]/g, "");
       
    const target = normalize(topicName);
    const item = stats.masteries.find(m => {
      if (!m.topic) return false;
      const current = normalize(m.topic);
      return current.includes(target) || target.includes(current);
    });
    return item ? item.mastery : 0;
  };

  // Daily learning mission checks (Dynamic based on profile values)
  const dailyMissionsList = [
    { name: "Practice 1 Spaced Repetition topic", done: stats.totalQuizzes > 0 },
    { name: "Revise AVL Rotations concept", done: stats.weakConcepts.length === 0 || getTopicMastery("Trees") > 50 },
    { name: "Achieve accuracy above 80%", done: stats.averageAccuracy >= 80 },
  ];
  const completedMissions = dailyMissionsList.filter((m) => m.done).length;

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-[var(--background)] scrollbar-thin text-[var(--foreground)]">
      
      {/* Dashboard Toolbar Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-[var(--card-border)] gap-3">
        <div>
          <h2 className="text-xl font-black text-[var(--foreground)] flex items-center gap-2">
            <Sparkles className={currentAccent.text} size={20} />
            AI Mentor Intelligence Dashboard
          </h2>
          <p className="text-[10px] text-zinc-550 mt-0.5 tracking-wider uppercase font-semibold">
            Goal: <span className="text-zinc-400">{stats.learningGoal}</span>
          </p>
        </div>
        <button
          onClick={onClose}
          className="text-xxs font-bold uppercase tracking-wider bg-[var(--btn-bg)] border border-[var(--btn-border)] text-[var(--btn-text)] hover:bg-[var(--btn-hover-bg)] hover:text-[var(--btn-hover-text)] py-2 px-4 rounded-xl transition cursor-pointer self-start sm:self-auto"
        >
          Return to Chat
        </button>
      </div>

      {/* 1. Analytics Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className="glass-panel border border-[var(--card-border)] p-4 rounded-2xl flex items-center gap-3.5 bg-[var(--card-bg)] text-[var(--foreground)]">
          <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400">
            <Award size={18} />
          </div>
          <div>
            <span className="text-[9px] font-bold text-zinc-550 block uppercase tracking-wider">Level {stats.level}</span>
            <span className="text-sm font-black text-[var(--foreground)] font-mono">{stats.score} XP</span>
          </div>
        </div>

        <div className="glass-panel border border-[var(--card-border)] p-4 rounded-2xl flex items-center gap-3.5 bg-[var(--card-bg)] text-[var(--foreground)]">
          <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400">
            <Target size={18} />
          </div>
          <div>
            <span className="text-[9px] font-bold text-zinc-550 block uppercase tracking-wider">Quizzes Taken</span>
            <span className="text-sm font-black text-[var(--foreground)] font-mono">{stats.totalQuizzes}</span>
          </div>
        </div>

        <div className="glass-panel border border-[var(--card-border)] p-4 rounded-2xl flex items-center gap-3.5 bg-[var(--card-bg)] text-[var(--foreground)]">
          <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
            <CheckCircle2 size={18} />
          </div>
          <div>
            <span className="text-[9px] font-bold text-zinc-550 block uppercase tracking-wider">Avg Accuracy</span>
            <span className="text-sm font-black text-[var(--foreground)] font-mono">{stats.averageAccuracy}%</span>
          </div>
        </div>

        <div className="glass-panel border border-[var(--card-border)] p-4 rounded-2xl flex items-center gap-3.5 bg-[var(--card-bg)] text-[var(--foreground)]">
          <div className="p-2 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400">
            <Flame size={18} />
          </div>
          <div>
            <span className="text-[9px] font-bold text-zinc-550 block uppercase tracking-wider">Streak Count</span>
            <span className="text-sm font-black text-[var(--foreground)] font-mono">{stats.currentStreak} Days</span>
          </div>
        </div>

        <div className="glass-panel border border-[var(--card-border)] p-4 rounded-2xl col-span-2 lg:col-span-1 flex flex-col justify-center bg-[var(--card-bg)] text-[var(--foreground)]">
          <div className="flex justify-between items-center text-[9px] font-bold text-zinc-500 uppercase mb-1">
            <span>Daily Goal</span>
            <span>{Math.round((completedMissions / dailyMissionsList.length) * 100)}%</span>
          </div>
          <div className="w-full h-1.5 bg-[var(--btn-bg)] rounded-full overflow-hidden border border-[var(--btn-border)]">
            <div 
              className={`h-full ${currentAccent.bg} transition-all duration-300`} 
              style={{ width: `${(completedMissions / dailyMissionsList.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* 2. Main Columns: Roadmap vs Daily Missions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left/Center Column: Learning Roadmap */}
        <div className="lg:col-span-2 space-y-5">
          <div className="glass-panel border border-[var(--card-border)] p-5 rounded-3xl bg-[var(--card-bg)] space-y-4 text-[var(--foreground)]">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--foreground)] flex items-center gap-1.5">
              <Compass size={14} className={currentAccent.text} />
              Personalized DSA Learning Path
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {roadmapNodes.map((node, index) => {
                const masteryVal = getTopicMastery(node.name);
                const isMastered = masteryVal >= node.requiredVal;
                const isUnlocked = index === 0 || getTopicMastery(roadmapNodes[index - 1].name) >= 40;

                return (
                  <div 
                    key={node.name}
                    className={`p-4 rounded-2xl border transition-all duration-200 ${
                      isMastered
                        ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-600"
                        : isUnlocked
                          ? "bg-[var(--btn-bg)] border-[var(--btn-border)] text-[var(--foreground)]"
                          : "bg-zinc-950/10 border-[var(--card-border)] text-zinc-550 opacity-50"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1.5">
                      <div>
                        <h4 className="text-xs font-bold text-[var(--foreground)]">{node.name}</h4>
                        <p className="text-[10px] text-zinc-500 mt-0.5">{node.desc}</p>
                      </div>
                      {isMastered ? (
                        <span className="text-[9px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-2 py-0.5 rounded-full uppercase">Mastered</span>
                      ) : isUnlocked ? (
                        <span className="text-[9px] font-bold bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 px-2 py-0.5 rounded-full uppercase">{masteryVal}% Match</span>
                      ) : (
                        <span className="text-[9px] font-bold bg-[var(--btn-bg)] border border-[var(--btn-border)] px-2 py-0.5 rounded-full uppercase">Locked</span>
                      )}
                    </div>

                    <div className="w-full h-1 bg-[var(--btn-bg)] rounded-full overflow-hidden mt-3">
                      <div 
                        className={`h-full ${isMastered ? "bg-emerald-500" : isUnlocked ? "bg-indigo-500" : "bg-zinc-800"}`}
                        style={{ width: `${Math.min(100, isUnlocked ? masteryVal : 0)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Certificates of Mastery Panel */}
          <div className="glass-panel border border-[var(--card-border)] p-5 rounded-3xl bg-[var(--card-bg)] space-y-4 transition-colors duration-300">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--foreground)] flex items-center gap-1.5">
              <Award size={14} className="text-amber-500" />
              Certificates of Mastery & Course Graduation
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {roadmapNodes.map((node) => {
                const masteryVal = getTopicMastery(node.name);
                const isMastered = masteryVal >= node.requiredVal;
                
                return (
                  <div
                    key={node.name}
                    className={`p-4 rounded-2xl border flex flex-col justify-between gap-3.5 transition-all duration-300 ${
                      isMastered
                        ? "bg-amber-500/5 border-amber-500/20 text-[var(--foreground)] shadow-md shadow-amber-500/5 hover:shadow-amber-500/10"
                        : "bg-zinc-950/20 border-[var(--card-border)] text-zinc-500 opacity-60"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className={`text-xs font-bold ${isMastered ? "text-amber-500 font-extrabold" : "text-[var(--btn-text)]"}`}>
                          Mastery: {node.name}
                        </h4>
                        <p className="text-[10px] text-zinc-500 mt-0.5">
                          {isMastered 
                            ? "Course section completed successfully." 
                            : `Unlock certificate at ${node.requiredVal}% mastery.`}
                        </p>
                      </div>
                      <div className={`p-1.5 rounded-lg border ${
                        isMastered 
                          ? "bg-amber-500/10 border-amber-500/30 text-amber-500" 
                          : "bg-[var(--btn-bg)] border-[var(--btn-border)] text-zinc-500"
                      }`}>
                        <Award size={14} />
                      </div>
                    </div>

                    {isMastered ? (
                      <a
                        href={`/api/certificate/generate?topic=${encodeURIComponent(node.name)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="w-full flex items-center justify-center gap-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black py-2 rounded-xl font-bold text-xs transition cursor-pointer shadow-md hover:shadow-lg active:scale-[0.98]"
                      >
                        <Award size={12} />
                        Download Certificate
                      </a>
                    ) : (
                      <div className="w-full text-center text-[10px] font-semibold text-zinc-500 py-2 border border-dashed border-[var(--btn-border)] rounded-xl bg-zinc-950/40">
                        {masteryVal}% / {node.requiredVal}% Mastery
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Supermemory Weak vs Strong Concepts list */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="glass-panel border border-zinc-800/80 p-5 rounded-3xl bg-zinc-950/10 space-y-3">
              <h4 className="text-xxs font-bold uppercase tracking-widest text-rose-400 flex items-center gap-1.5">
                <ShieldAlert size={12} />
                Knowledge Gaps (Weak Concepts)
              </h4>
              {stats.weakConcepts.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {stats.weakConcepts.map((gap) => (
                    <span key={gap} className="text-xxs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2.5 py-1 rounded-lg">
                      {gap}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xxs text-zinc-550 italic">No weak concepts logged. Keep up the high accuracy!</p>
              )}
            </div>

            <div className="glass-panel border border-[var(--card-border)] p-5 rounded-3xl bg-[var(--card-bg)] space-y-3">
              <h4 className="text-xxs font-bold uppercase tracking-widest text-emerald-500 flex items-center gap-1.5">
                <CheckCircle2 size={12} />
                Mastered Concepts (Supermemory)
              </h4>
              {stats.masteredConcepts.length > 0 || stats.strongConcepts.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {[...stats.strongConcepts, ...stats.masteredConcepts].map((strong) => (
                    <span key={strong} className="text-xxs font-semibold bg-emerald-500/10 text-emerald-450 border border-emerald-500/20 px-2.5 py-1 rounded-lg">
                      {strong}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xxs text-zinc-550 italic">Concepts will show here as you score correctly on quizzes.</p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Daily Mission & Actions Panel & Leaderboard */}
        <div className="space-y-6">
          
          {/* Daily Missions */}
          <div className="glass-panel border border-[var(--card-border)] p-5 rounded-3xl bg-[var(--card-bg)] space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--foreground)] flex items-center gap-1.5">
              <Target size={14} className={currentAccent.text} />
              Daily Learning Missions
            </h3>
            
            <div className="space-y-2.5">
              {dailyMissionsList.map((m) => (
                <div key={m.name} className="flex items-center gap-2.5 text-xs">
                  <CheckCircle2 
                    className={m.done ? "text-emerald-500" : "text-zinc-700"} 
                    size={16} 
                  />
                  <span className={m.done ? "text-zinc-400 line-through opacity-70" : "text-[var(--foreground)]"}>
                    {m.name}
                  </span>
                </div>
              ))}
            </div>

            {completedMissions === dailyMissionsList.length && (
              <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-xl text-center font-bold text-xs animate-pulse">
                🎉 Daily Mission Reward Claimed: +100 XP
              </div>
            )}
          </div>

          {/* Composio Action Integrations Triggering */}
          <div className="glass-panel border border-[var(--card-border)] p-5 rounded-3xl bg-[var(--card-bg)] space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--foreground)]">
              Composio Action Workspace
            </h3>
            
            <div className="grid grid-cols-3 gap-2">
              <button
                disabled={!!composioRunning}
                onClick={() => {
                  triggerComposio("DOCS_EXPORT");
                  window.open("https://docs.google.com", "_blank");
                }}
                className="flex flex-col items-center justify-center p-3.5 bg-[var(--btn-bg)] border border-[var(--btn-border)] text-[var(--btn-text)] hover:bg-[var(--btn-hover-bg)] hover:text-[var(--btn-hover-text)] rounded-xl cursor-pointer transition text-center gap-1"
                title="Create Google Docs guide"
              >
                <FileText size={16} className="text-indigo-400" />
                <span className="text-[9px] font-bold mt-1">Google Docs</span>
              </button>

              <button
                disabled={!!composioRunning}
                onClick={() => {
                  triggerComposio("DRIVE_UPLOAD");
                  window.open("https://drive.google.com", "_blank");
                }}
                className="flex flex-col items-center justify-center p-3.5 bg-[var(--btn-bg)] border border-[var(--btn-border)] text-[var(--btn-text)] hover:bg-[var(--btn-hover-bg)] hover:text-[var(--btn-hover-text)] rounded-xl cursor-pointer transition text-center gap-1"
                title="Save study resources to Google Drive"
              >
                <HardDrive size={16} className="text-amber-400" />
                <span className="text-[9px] font-bold mt-1">Google Drive</span>
              </button>

              <button
                disabled={!!composioRunning}
                onClick={() => {
                  triggerComposio("CALENDAR_REVISION");
                  window.open("https://calendar.google.com", "_blank");
                }}
                className="flex flex-col items-center justify-center p-3.5 bg-[var(--btn-bg)] border border-[var(--btn-border)] text-[var(--btn-text)] hover:bg-[var(--btn-hover-bg)] hover:text-[var(--btn-hover-text)] rounded-xl cursor-pointer transition text-center gap-1"
                title="Schedule Google Calendar revision events"
              >
                <Calendar size={16} className="text-emerald-400" />
                <span className="text-[9px] font-bold mt-1">Calendar</span>
              </button>
            </div>

            {composioRunning && (
              <div className="flex items-center gap-2 text-xxs text-zinc-550 animate-pulse">
                <Loader2 className="animate-spin" size={12} />
                Executing webhook triggers...
              </div>
            )}

            {composioLogs.length > 0 && (
              <div className="bg-[var(--btn-bg)] p-2.5 rounded-lg border border-[var(--btn-border)] text-[10px] font-mono text-[var(--btn-text)] space-y-1">
                {composioLogs.map((log, idx) => (
                  <div key={idx}>✓ {log}</div>
                ))}
              </div>
            )}
          </div>

          {/* Global Leaderboard Modal Panel */}
          <div className="glass-panel border border-[var(--card-border)] p-5 rounded-3xl bg-[var(--card-bg)] space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--foreground)] flex items-center gap-2">
              <Award size={14} className="text-amber-500 animate-pulse" />
              Global Student Leaderboard
            </h3>

            {loadingLeaderboard ? (
              <div className="text-xxs text-zinc-500 animate-pulse py-2">Loading leaderboard stats...</div>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto scrollbar-thin">
                {leaderboard.map((u: any) => (
                  <div 
                    key={u.rank} 
                    className={`flex items-center justify-between p-2 rounded-xl border text-xxs transition ${
                      u.name === (stats as any).name ? "bg-indigo-500/10 border-indigo-500/20" : "bg-[var(--btn-bg)] border-[var(--btn-border)] text-[var(--btn-text)]"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-zinc-500">#{u.rank}</span>
                      <span className="font-semibold text-[var(--foreground)] truncate max-w-28">{u.name}</span>
                    </div>
                    <div className="flex items-center gap-2.5 font-mono">
                      <span className="text-amber-500 font-bold">{u.score} XP</span>
                      <span className="text-zinc-500">({u.accuracy}%)</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
