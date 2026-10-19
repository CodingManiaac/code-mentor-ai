import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { generateText } from "ai";
import { google } from "@ai-sdk/google";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { code, problemTitle, currentHintLevel = 1 } = await req.json();

    if (!problemTitle) {
      return NextResponse.json({ error: "Missing problem title" }, { status: 400 });
    }

    let hintTarget = "";
    if (currentHintLevel === 1) {
      hintTarget = "General Idea (High-level explanation of the logic, no implementation details).";
    } else if (currentHintLevel === 2) {
      hintTarget = "Algorithmic approach (Mention specific data structures, helper variables, or loops to use).";
    } else if (currentHintLevel === 3) {
      hintTarget = "Pseudocode snippet (Provide a brief 3-5 line pseudo-code draft structure).";
    } else {
      hintTarget = "Reveal solution skeleton (Explain the final code structure clearly).";
    }

    const prompt = `The student is working on the coding problem "${problemTitle}".
    Their current code in progress is:
    \`\`\`
    ${code || "// Starter code"}
    \`\`\`
    
    Provide Hint Level ${currentHintLevel}: ${hintTarget}
    
    Do NOT give the final code solution directly. Just write a short, encouraging hint (1-3 sentences).`;

    const { text } = await generateText({
      model: google("gemini-2.5-flash"),
      prompt,
    });

    return NextResponse.json({
      hint: text,
      nextLevel: Math.min(4, currentHintLevel + 1),
    });
  } catch (err: any) {
    console.error("Hints query failed:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
