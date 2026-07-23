import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

export const authOption = {
  secret: process.env.NEXTAUTH_SECRET || "dummy-secret-for-presentation",
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60,
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        // ALWAYS ACCEPT ANY CREDENTIALS FOR PRESENTATION
        return {
          id: "1",
          name: "Emaar Admin",
          email: credentials?.email || "admin@emaarjewellers.com",
          accessToken: "dummy-presentation-token",
          pinVerified: false,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.accessToken = user.accessToken;
        token.pinVerified = user.pinVerified;
        token.user = user;
      }
      if (trigger === "update" && session) {
        if (session.pinVerified !== undefined) {
          token.pinVerified = session.pinVerified;
        }
      }
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken;
      session.pinVerified = token.pinVerified;
      session.user = token.user;
      return session;
    },
  },
};

const handler = NextAuth(authOption);
export { handler as GET, handler as POST };
