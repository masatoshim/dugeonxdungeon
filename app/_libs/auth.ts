import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/app/_libs/prisma";
import bcrypt from "bcrypt";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const user = await prisma.user.findUnique({ where: { email: credentials.email } });
        if (user && user.hashedPassword) {
          const isValid = await bcrypt.compare(credentials.password, user.hashedPassword);
          if (isValid) return user;
        }
        return null;
      },
    }),
  ],
  session: {
    strategy: "jwt", // Credentialsを使う場合はJWTが必須
  },
  callbacks: {
    // トークンが作成・更新されるときに実行（ここでIDを仕込む）
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        // token.role = user.role; // DBにroleがある場合
      }
      return token;
    },
    // セッションがフロントエンド/APIから呼ばれるときに実行
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        // session.user.role = token.role as string;
      }
      return session;
    },
  },
};
