import { google } from '@ai-sdk/google';
import {
  streamText,
  convertToModelMessages,
  type UIMessage,
} from 'ai';

export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = streamText({
    model: google('gemini-2.5-flash'),

    system: `You are CodeMentor AI.

You help users learn programming and debug code.

Explain concepts clearly and provide examples.`,

    messages: await convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse();
}