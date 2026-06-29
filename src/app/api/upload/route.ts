import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { files } from "@/lib/db/schema";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const chatId = formData.get("chatId") as string;

    if (!file || !chatId) {
      return NextResponse.json({ error: "Missing file or chatId" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Check if Supabase keys exist in env
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

    let publicUrl = "";

    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey);
      const fileName = `${chatId}/${Date.now()}-${file.name}`;
      
      // Upload file to Supabase storage bucket "attachments"
      const { error } = await supabase.storage
        .from("attachments")
        .upload(fileName, buffer, {
          contentType: file.type,
          upsert: true,
        });

      if (error) {
        console.error("Supabase upload error:", error);
        return NextResponse.json({ error: "File upload failed" }, { status: 500 });
      }

      const { data: urlData } = supabase.storage
        .from("attachments")
        .getPublicUrl(fileName);
      
      publicUrl = urlData.publicUrl;
    } else {
      // Fallback for local development without Supabase keys:
      // Encode as a Data URL so the application remains fully functional in offline/mock mode.
      console.warn("Supabase credentials missing in env. Using data URL fallback.");
      const base64Content = buffer.toString("base64");
      publicUrl = `data:${file.type};base64,${base64Content}`;
    }

    // Save metadata record to DB
    const dbFile = await db
      .insert(files)
      .values({
        chatId,
        name: file.name,
        url: publicUrl,
        mimeType: file.type,
        size: file.size,
      })
      .returning();

    return NextResponse.json(dbFile[0]);
  } catch (error) {
    console.error("Upload route error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
