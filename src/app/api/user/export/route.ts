import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { chats } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

// GET /api/user/export - Export all chats, messages, and files for the authenticated user
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const userChats = await db.query.chats.findMany({
      where: eq(chats.userId, session.user.id),
      with: {
        messages: {
          orderBy: (messages: any, { asc }: any) => [asc(messages.createdAt)],
        },
        files: true,
      },
      orderBy: [desc(chats.createdAt)],
    });

    return NextResponse.json({
      exportDate: new Date().toISOString(),
      user: {
        name: session.user.name,
        email: session.user.email,
      },
      chats: userChats,
    });
  } catch (error) {
    console.error("GET export history error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
