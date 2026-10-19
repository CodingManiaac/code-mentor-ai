import NextAuth from "next-auth";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import Resend from "next-auth/providers/resend";

console.log("[Auth Config] DATABASE_URL is present:", !!process.env.DATABASE_URL);
console.log("[Auth Config] AUTH_RESEND_KEY is present:", !!process.env.AUTH_RESEND_KEY);
const adapter = process.env.DATABASE_URL ? DrizzleAdapter(db) : undefined;
console.log("[Auth Config] DrizzleAdapter initialized:", !!adapter);

const providers: any[] = [];

// 1. Add GitHub provider if configured
if (process.env.GITHUB_ID && process.env.GITHUB_SECRET) {
  providers.push(
    GitHub({
      clientId: process.env.GITHUB_ID,
      clientSecret: process.env.GITHUB_SECRET,
    })
  );
}

// 2. Add Google provider if configured
if (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) {
  providers.push(
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    })
  );
}

// 3. Add Resend Magic Link provider if active, else fallback to Credentials bypass
if (process.env.AUTH_RESEND_KEY) {
  providers.push(
    Resend({
      apiKey: process.env.AUTH_RESEND_KEY,
      from: process.env.EMAIL_FROM || "CodeMentor AI <onboarding@resend.dev>",
    })
  );
} else {
  // Local offline sandbox login when Resend key is not specified
  providers.push(
    Credentials({
      name: "Local Testing Bypass",
      credentials: {
        email: { label: "Email Address", type: "email", placeholder: "student@example.com" },
        name: { label: "Full Name", type: "text", placeholder: "Student User" },
      },
      async authorize(credentials) {
        if (!credentials?.email) return null;
        
        const emailStr = credentials.email as string;
        const nameStr = (credentials.name as string) || "Student User";

        // Find or create user record in DB
        let user = await db.query.users.findFirst({
          where: eq(users.email, emailStr),
        });

        if (!user) {
          const inserted = await db.insert(users).values({
            email: emailStr,
            name: nameStr,
            image: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(nameStr)}`,
          }).returning();
          user = inserted[0];
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
        };
      },
    })
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter,
  secret: process.env.AUTH_SECRET || "default_auth_secret_for_development_purposes_only",
  session: {
    strategy: "jwt",
    maxAge: 60 * 60, // 1 hour
    updateAge: 15 * 60, // Update session cookie expiry every 15 minutes of activity
  },
  providers,
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
});
