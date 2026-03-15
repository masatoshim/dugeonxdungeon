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
        if (isValid) return user;

        return null;
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
    newUser: "/signup", // 新規ユーザー時の遷移先
    error: "/signup", // エラーが発生した時に新規登録画面（またはログイン画面）へ飛ばす
  },
  callbacks: {
    // Google認証時などの「ログイン可否」の最終判定
    async signIn({ user, account, profile }) {
      // 既存のユーザーをメールアドレスで検索
      const existingUser = await prisma.user.findUnique({
        where: { email: user.email as string },
      });
      // 「既にユーザーが存在する」かつ「Google連携（account.provider）ではない」場合
      // つまり、メール+パスワードで既に登録されている場合
      if (existingUser && account?.provider === "google") {
        // ここで既存ユーザーがGoogleと紐付いていない（パスワード設定がある等）なら拒否
        if (existingUser.hashedPassword) {
          // エラーを投げると pages.error で指定したURLに ?error=... が付いてリダイレクトされる
          throw new Error("AlreadyRegisteredWithPassword");
        }
      }

      if (!user?.id) return true;
      // DBから最新のユーザー情報を取得してチェック
      const dbUser = await prisma.user.findUnique({ where: { id: user.id } });

      // DBにまだ存在しない（＝今まさに createUser されたばかりの新規ユーザー）場合
      if (!dbUser) {
        // 新規登録時は createUser 側で lastLoginAt を入れているので、
        // ここでは何もせず true を返してログインを完了させる
        return true;
      }

      if (dbUser?.deletedFlg || dbUser?.isActive === false) {
        return false; // ログイン拒否
      }
      if (user?.id) {
        // 既存ユーザーのログイン時に lastLoginAt を更新する
        await prisma.user.update({
          where: { id: user.id },
          data: {
            lastLoginAt: new Date(),
          },
        });
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.userName = (user as any).userName;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.name = token.userName as string;
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
