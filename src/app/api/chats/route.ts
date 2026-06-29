import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { chats, messages, files } from "@/lib/db/schema";
import { eq, desc, and } from "drizzle-orm";

// 1. GET - Fetch all chats for the logged-in user (grouped by mode)
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const userChats = await db.query.chats.findMany({
      where: eq(chats.userId, session.user.id),
      orderBy: [desc(chats.createdAt)],
      with: {
        messages: {
          orderBy: [desc(messages.createdAt)], // Drizzle relation sorting
        },
        files: true,
      },
    });

    // Invert messages order since we fetched desc to sort database results but we render from top to bottom
    const processedChats = userChats.map((chat: any) => ({
      ...chat,
      messages: chat.messages.reverse().map((m: any) => ({
        ...m,
        parts: [{ type: "text", text: m.content }],
      })),
    }));

    return NextResponse.json(processedChats);
  } catch (error) {
    console.error("GET chats error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// 2. POST - Create a new chat session
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { mode, title } = await req.json();

    const newChat = await db
      .insert(chats)
      .values({
        userId: session.user.id,
        mode: mode || "teacher",
        title: title || "New Chat",
      })
      .returning();

    return NextResponse.json(newChat[0]);
  } catch (error) {
    console.error("POST chat error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// 3. DELETE - Delete a specific chat session (owned by the user)
export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { chatId } = await req.json();
    if (!chatId) {
      return NextResponse.json({ error: "Missing chatId" }, { status: 400 });
    }

    // Verify ownership and delete
    const result = await db
      .delete(chats)
      .where(and(eq(chats.id, chatId), eq(chats.userId, session.user.id)))
      .returning();

    if (result.length === 0) {
      return NextResponse.json({ error: "Chat not found or unauthorized" }, { status: 404 });
    }

    return NextResponse.json({ success: true, deletedChat: result[0] });
  } catch (error) {
    console.error("DELETE chat error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// 4. PATCH - Update a specific chat's title
export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { chatId, title } = await req.json();
    if (!chatId || !title) {
      return NextResponse.json({ error: "Missing chatId or title" }, { status: 400 });
    }

    const result = await db
      .update(chats)
      .set({ title })
      .where(and(eq(chats.id, chatId), eq(chats.userId, session.user.id)))
      .returning();

    if (result.length === 0) {
      return NextResponse.json({ error: "Chat not found or unauthorized" }, { status: 404 });
    }

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error("PATCH chat error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
