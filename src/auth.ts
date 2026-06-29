import NextAuth from "next-auth";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import GitHub from "next-auth/providers/github";
import Credentials from "next-auth/providers/credentials";

const adapter = process.env.DATABASE_URL ? DrizzleAdapter(db) : undefined;

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter,
  secret: process.env.AUTH_SECRET || "default_auth_secret_for_development_purposes_only",
  session: { strategy: "jwt" },
  providers: [
    GitHub({
      clientId: process.env.GITHUB_ID,
      clientSecret: process.env.GITHUB_SECRET,
    }),
    Credentials({
      name: "Instant Access",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "student@example.com" },
        name: { label: "Name", type: "text", placeholder: "Student User" },
      },
      async authorize(credentials) {
        if (!credentials?.email) return null;
        
        const emailStr = credentials.email as string;
        const nameStr = (credentials.name as string) || "Student User";

        // Find or create user in database
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
    }),
  ],
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
