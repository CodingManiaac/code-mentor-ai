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

    const { topic = "Linked Lists", difficulty = "medium" } = await req.json();

    const prompt = `You are a LeetCode challenge writer. Generate a coding challenge for the topic "${topic}" and difficulty "${difficulty}".
    
    You must output exactly a JSON object matching this schema. Provide NO other text, markdown blocks, or quotes around the JSON.
    
    Schema:
    {
      "title": "Title of the Problem",
      "description": "Detailed description of the problem statement, including what to implement.",
      "constraints": [
        "Constraint 1 (e.g. Node values between -100 and 100)",
        "Constraint 2"
      ],
      "examples": [
        {
          "input": "head = [1,2,3,4,5]",
          "output": "[5,4,3,2,1]",
          "explanation": "Optional explanation of the output."
        }
      ],
      "starterCode": "function solveChallenge(input) {\\n  // Write your code here\\n  return input;\\n}",
      "testCases": [
        {
          "input": "1",
          "expected": "1",
          "isPublic": true
        },
        {
          "input": "2",
          "expected": "2",
          "isPublic": true
        },
        {
          "input": "3",
          "expected": "3",
          "isPublic": false
        }
      ]
    }`;

    const { text } = await generateText({
      model: google("gemini-2.5-flash"),
      prompt,
    });

    // Clean text of any markdown blocks (e.g. ```json ... ```)
    const jsonText = text.replace(/```json/g, "").replace(/```/g, "").trim();
    const challenge = JSON.parse(jsonText);

    return NextResponse.json(challenge);
  } catch (err: any) {
    console.error("Challenge generator failed:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
