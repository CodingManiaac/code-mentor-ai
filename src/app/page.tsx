import { Suspense } from "react";
import ChatContainer from "@/components/chat/ChatContainer";

export const unstable_instant = false;

export default function Home() {
  return (
    <main className="w-screen h-screen overflow-hidden bg-[#09090b] text-white">
      <Suspense
        fallback={
          <div className="h-full w-full flex flex-col justify-center items-center animate-pulse text-zinc-500">
            <div className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent mb-2">
              Loading CodeMentor AI...
            </div>
            <div className="text-xs text-zinc-600">Preparing interactive interface</div>
          </div>
        }
      >
        <ChatContainer />
      </Suspense>
    </main>
  );
}
