import { google } from "@ai-sdk/google";
import {
  streamText,
  convertToModelMessages,
  stepCountIs,
  type UIMessage,
} from "ai";

import { SYSTEM_PROMPTS } from "@/lib/prompts";
import { getTools } from "@/lib/composio";
import { saveMemory, retrieveMemory } from "@/lib/memory";

export const maxDuration = 30;

export async function POST(req: Request) {
  const {
    messages,
    mode,
  }: {
    messages: UIMessage[];
    mode: "teacher" | "coding";
  } = await req.json();

  const latestMessage = messages[messages.length - 1];

  const userText =
    latestMessage.parts
      ?.filter((part) => part.type === "text")
      .map((part) => part.text)
      .join(" ") || "";

  // Retrieve memory
  const memory = await retrieveMemory("demo-user", userText);

  // Get Composio tools
  const tools = await getTools("User_Vishu");

  console.log("========== AVAILABLE TOOLS ==========");
  console.log(Object.keys(tools));
  console.log("=====================================");

  console.log("Memory:", memory);

  const result = streamText({
    model: google("gemini-2.5-flash"),

    tools,

    stopWhen: stepCountIs(10),

    system: `
You are CodeMentor AI.

${SYSTEM_PROMPTS[mode]}

Known User Context:
${memory}

IMPORTANT:
- If the user asks you to perform an action on GitHub, Gmail, Notion, Google Drive or any external service,
  ALWAYS use the appropriate tool instead of explaining how to do it.
- Never answer with instructions if a tool exists.
- Execute the action whenever possible.
`,

    messages: await convertToModelMessages(messages),
  });

  await saveMemory("demo-user", userText);

  return result.toUIMessageStreamResponse();
}