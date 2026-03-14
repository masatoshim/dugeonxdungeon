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
  createUser: (data: any) => {
    // 1. Googleから渡ってくるが、DBに保存したくない項目（imageなど）を抽出
    const { name, image, emailVerified, ...rest } = data;

    return prisma.user.create({
      data: {
        ...rest, // ここには email だけが含まれる
        userName: name || "GoogleUser",
        // iconImageKey はここでは指定しない（DBのデフォルト値または null になる）
        isActive: true,
        deletedFlg: false,
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
        if (isValid) return user;

        return null;
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    // Google認証時などの「ログイン可否」の最終判定
    async signIn({ user, account, profile }) {
      // DBから最新のユーザー情報を取得してチェック
      const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
      if (dbUser?.deletedFlg || dbUser?.isActive === false) {
        return false; // ログイン拒否
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
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
            createdBy: user.id,
            updatedBy: user.id,
          },
        });
      }
    },
  },
};
