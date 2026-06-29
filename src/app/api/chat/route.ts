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
import { buildPrompt } from "@/lib/promptBuilder";
import { db } from "@/lib/db";
import { messages as dbMessages } from "@/lib/db/schema";
import type { Attachment } from "@/types/attachment";

export const maxDuration = 30;

export async function POST(req: Request) {
  const {
    messages = [],
    mode,
    attachments = [],
    chatId,
  }: {
    messages: UIMessage[];
    mode: "teacher" | "coding";
    attachments?: Attachment[];
    chatId?: string | null;
  } = await req.json();

  // Normalize messages: restore parts array if loaded from database, or restore content string if client-side
  const normalizedMessages = messages.map((m) => {
    const msg = m as any;
    const hasParts = msg.parts && msg.parts.length > 0;
    const textContent = hasParts
      ? (msg.parts.find((p: any) => p.type === "text") as any)?.text || ""
      : typeof msg.content === "string"
        ? msg.content
        : "";

    return {
      ...m,
      content: textContent,
      parts: hasParts ? msg.parts : [{ type: "text", text: textContent }],
    };
  });

  const latestMessage =
    normalizedMessages[normalizedMessages.length - 1];

  const userText = latestMessage
    ? latestMessage.parts
        ?.filter((part: any) => part.type === "text")
        .map((part: any) => part.text)
        .join(" ") || ""
    : "";

  // Process attachments list
  let imageParts: { type: "image"; image: Buffer; mimeType: string }[] = [];
  let attachedTextFilesInfo = "";

  if (attachments && attachments.length > 0) {
    for (const file of attachments) {
      if (file.mimeType.startsWith("image/")) {
        // Handle images (Base64 data or Supabase Public URL)
        let buffer: Buffer | null = null;
        let mimeType = file.mimeType;
        
        if (file.content.startsWith("data:")) {
          const match = file.content.match(/^data:(image\/[a-zA-Z+-]+);base64,(.+)$/);
          if (match) {
            mimeType = match[1];
            const base64Data = match[2];
            buffer = Buffer.from(base64Data, "base64");
          }
        } else if (file.content.startsWith("http://") || file.content.startsWith("https://")) {
          try {
            const fetchRes = await fetch(file.content);
            if (fetchRes.ok) {
              buffer = Buffer.from(await fetchRes.arrayBuffer());
            }
          } catch (e) {
            console.error(`Failed to fetch image buffer for ${file.name}:`, e);
          }
        }
        
        if (buffer) {
          imageParts.push({ type: "image", image: buffer, mimeType });
        }
      } else {
        // Handle text/code files (read local data URL or fetch from Supabase public URL)
        let fileContent = file.content;
        if (file.content.startsWith("http://") || file.content.startsWith("https://")) {
          try {
            const fetchRes = await fetch(file.content);
            if (fetchRes.ok) {
              fileContent = await fetchRes.text();
            }
          } catch (e) {
            console.error(`Failed to fetch file content for ${file.name}:`, e);
          }
        }
        attachedTextFilesInfo += `\n\n=== ATTACHED FILE: ${file.name} ===\n${fileContent}\n=================================`;
      }
    }
  }

  const memory = await retrieveMemory(
    "demo-user",
    userText
  );

  const tools = await getTools("User_Vishu");

  // Injects code files info directly inside system prompt template
  const systemPrompt = buildPrompt({
    mode,
    memory,
    attachment: attachedTextFilesInfo
      ? { name: "multiple-files", mimeType: "text/plain", size: 0, content: attachedTextFilesInfo }
      : undefined,
    basePrompt: SYSTEM_PROMPTS[mode],
  });

  const modelMessages = await convertToModelMessages(normalizedMessages);
  
  // Append image parts to the last user query message
  if (imageParts.length > 0 && modelMessages.length > 0) {
    const lastMessage = modelMessages[modelMessages.length - 1];
    if (lastMessage.role === "user") {
      const textContent = typeof lastMessage.content === "string"
        ? lastMessage.content
        : Array.isArray(lastMessage.content)
          ? (lastMessage.content.find((p: any) => p.type === "text") as any)?.text || ""
          : "";

      lastMessage.content = [
        { type: "text", text: textContent || "Please analyze the attached image(s)." },
        ...imageParts,
      ];
    }
  }

  const result = streamText({
    model: google("gemini-2.5-flash"),

    system: systemPrompt,

    tools,

    stopWhen: stepCountIs(10),

    messages: modelMessages,

    onFinish: async ({ text }) => {
      if (chatId) {
        try {
          // Save User Message
          await db.insert(dbMessages).values({
            chatId,
            role: "user",
            content: userText || "Uploaded file attachments.",
          });

          // Save Assistant Message
          await db.insert(dbMessages).values({
            chatId,
            role: "assistant",
            content: text || "",
          });
        } catch (e) {
          console.error("Failed to save message to DB in onFinish:", e);
        }
      }
    },
  });

  try {
    await saveMemory(
      "demo-user",
      userText
    );
  } catch (error) {
    console.error(
      "Failed to save memory:",
      error
    );
  }

  return result.toUIMessageStreamResponse();
}