import { Suspense } from "react";
import SandboxClient from "./SandboxClient";

export default function SandboxPage() {
  return (
    <main className="w-screen h-screen overflow-hidden bg-[#09090b] text-white">
      <Suspense
        fallback={
          <div className="h-full w-full flex flex-col justify-center items-center animate-pulse text-zinc-500">
            <div className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent mb-2">
              Loading CodeMentor AI Workspace...
            </div>
            <div className="text-xs text-zinc-650 font-mono">Preparing sandbox environment</div>
          </div>
        }
      >
        <SandboxClient />
      </Suspense>
    </main>
  );
}
