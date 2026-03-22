import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ account, profile }) {
      // gridpredict.co.jpドメインのみ許可
      if (account?.provider === "google") {
        return profile?.email?.endsWith("@gridpredict.co.jp") ?? false;
      }
      return false;
    },
  },
});

export { handler as GET, handler as POST };
