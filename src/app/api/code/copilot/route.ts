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

    const { action, code, language = "javascript", error = "", question = "", answer = "" } = await req.json();

    if (!action || !code) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    let prompt = "";
    if (action === "EXPLAIN") {
      prompt = `Explain the following ${language} code step-by-step. Focus on the algorithm, variables, and logic flow:\n\n\`\`\`${language}\n${code}\n\`\`\``;
    } else if (action === "OPTIMIZE") {
      prompt = `Analyze this ${language} code and provide an optimized version. Highlight the time and space complexities. Present the refactored code alongside explanations:\n\n\`\`\`${language}\n${code}\n\`\`\``;
    } else if (action === "DEBUG") {
      prompt = `This ${language} code is failing with error: "${error}". Find the bug, explain the root cause, and provide the corrected code:\n\n\`\`\`${language}\n${code}\n\`\`\``;
    } else if (action === "REFACTOR") {
      prompt = `Refactor this ${language} code to improve readability, variable naming, and styling. Follow best practices:\n\n\`\`\`${language}\n${code}\n\`\`\``;
    } else if (action === "CONVERT_PYTHON") {
      prompt = `Convert the following ${language} code into clean, idiomatic Python code. Include brief explanations of any syntax mappings:\n\n\`\`\`${language}\n${code}\n\`\`\``;
    } else if (action === "EDGE_TESTS") {
      prompt = `Analyze this ${language} code and generate 3 edge test cases (e.g. empty inputs, negative numbers, extreme values). Show the expected inputs and outputs:\n\n\`\`\`${language}\n${code}\n\`\`\``;
    } else if (action === "INTERVIEW_EVALUATE") {
      prompt = `You are a technical interviewer evaluating a student's answer.
      
Code written by the student:
\`\`\`${language}
${code}
\`\`\`

Interviewer Question: "${question}"
Student Answer: "${answer}"

Evaluate the student's answer for accuracy, technical depth, and correct references to the code.
Provide a grade (e.g. 90/100), brief feedback (what they got right, what was missing), and a corrected/optimal response. Keep it concise.`;
    } else {
      prompt = `Analyze the following ${language} code:\n\n\`\`\`${language}\n${code}\n\`\`\``;
    }

    const { text } = await generateText({
      model: google("gemini-2.5-flash"),
      prompt,
    });

    return NextResponse.json({ output: text });
  } catch (err: any) {
    console.error("AI Copilot request failed:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
