import type { Metadata } from "next";
import Link from "next/link";
import AuthForm from "@/components/auth/AuthForm";

export const metadata: Metadata = { title: "Log in" };

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-md">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-zinc-100">Welcome back</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Log in to manage your TV series list.
        </p>
      </div>
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
        <AuthForm mode="login" />
        <p className="mt-4 text-center text-sm text-zinc-400">
          No account yet?{" "}
          <Link href="/register" className="font-medium text-blue-400 hover:underline">
            Sign up
          </Link>
          , requires administrator approval.
        </p>
      </div>
    </div>
  );
}