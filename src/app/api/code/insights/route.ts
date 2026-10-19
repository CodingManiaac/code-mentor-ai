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

    const { code, language = "javascript" } = await req.json();

    if (!code) {
      return NextResponse.json({ error: "Missing code payload" }, { status: 400 });
    }

    const prompt = `You are a static code analyzer. Analyze the following ${language} code and calculate performance and quality insights.
    
    You must output exactly a JSON object matching this schema. Provide NO other text, markdown blocks, or quotes around the JSON.
    
    Schema:
    {
      "timeComplexity": "O(...) (e.g. O(n log n))",
      "spaceComplexity": "O(...) (e.g. O(1))",
      "qualityScore": 85, // 0 to 100
      "readability": 90, // 0 to 100
      "optimizationScore": 75, // 0 to 100
      "explanation": "Brief paragraph explaining complexity and suggestions for improvement."
    }
    
    Code to analyze:
    ${code}`;

    const { text } = await generateText({
      model: google("gemini-2.5-flash"),
      prompt,
    });

    const jsonText = text.replace(/```json/g, "").replace(/```/g, "").trim();
    const insights = JSON.parse(jsonText);

    return NextResponse.json(insights);
  } catch (err: any) {
    console.error("Insights analyzer failed:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
