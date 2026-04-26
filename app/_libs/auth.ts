import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/app/_libs/prisma";
import bcrypt from "bcrypt";

const adapter = PrismaAdapter(prisma);

// createUser メソッドを上書きする
const customAdapter = {
  ...adapter,
  createUser: async (data: any) => {
    // Googleから渡ってくるが、DBに保存したくない項目（imageなど）を抽出
    const { name, image, emailVerified, ...rest } = data;

    const now = new Date(); // UTC時刻として扱われる
    const generatedUserName = name || "User_" + Math.random().toString(36).slice(-4);

    const newUser = await prisma.user.create({
      data: {
        ...rest,
        userName: name,
        nickName: generatedUserName, // サインアップ時は userName と同様
        lastLoginAt: now, // 初回ログイン時刻
        emailVerified: now, // サインアップ時に確認済みとする
        isActive: true,
        deletedFlg: false,
      },
    });

    return await prisma.user.update({
      where: { id: newUser.id },
      data: {
        createdBy: newUser.id,
        updatedBy: newUser.id,
      },
    });
  },
};

export const authOptions: NextAuthOptions = {
  adapter: customAdapter,
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

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        // 論理削除フラグまたは無効化フラグのチェック
        if (!user || !user.hashedPassword || user.deletedFlg || !user.isActive) {
          return null;
        }

        const isValid = await bcrypt.compare(credentials.password, user.hashedPassword);
        if (isValid)
          return {
            id: user.id,
            email: user.email,
            name: user.userName,
            nickName: user.nickName ?? user.userName,
            role: user.role,
          };

        return null;
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
    newUser: "/", // 新規ユーザー時の遷移先
    error: "/signup", // エラーが発生した時に新規登録画面（またはログイン画面）へ飛ばす
  },
  callbacks: {
    // Google認証時などの「ログイン可否」の最終判定
    async signIn({ user, account, profile }) {
      // Googleログイン時の重複チェック
      if (account?.provider === "google") {
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email as string },
        });
        if (existingUser?.hashedPassword) {
          throw new Error("AlreadyRegisteredWithPassword");
        }
      }
      // 既存ユーザーのステータスチェックと最終ログイン更新
      if (user?.id) {
        const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
        // 既にDBにいるユーザーの場合のみチェック（新規登録時は skip）
        if (dbUser) {
          if (dbUser.deletedFlg || !dbUser.isActive) {
            return false;
          }
          // 最終ログイン時刻の更新
          await prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
          });
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.userName = (user as any).userName;
        token.nickName = (user as any).nickName;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.name = token.userName as string;
        session.user.nickName = token.nickName as string;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      else if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },
  // Google初回登録時の userName 生成ロジック
  events: {
    async createUser({ user }) {
      // Google 経由で作成された場合、userName が空になるのを防ぐ
      if (!user.userName) {
        const generatedName = user.email?.split("@")[0] + "_" + Math.floor(Math.random() * 1000);
        await prisma.user.update({
          where: { id: user.id },
          data: {
            userName: generatedName,
            nickName: generatedName,
            createdBy: user.id,
            updatedBy: user.id,
          },
        });
      }
    },
  },
};
