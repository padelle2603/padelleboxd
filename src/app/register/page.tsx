import type { Metadata } from "next";
import Link from "next/link";
import AuthForm from "@/components/AuthForm";

export const metadata: Metadata = { title: "Sign up" };

export default function RegisterPage() {
  return (
    <div className="mx-auto max-w-md">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-zinc-100">Create your account</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Track, rate and organize the TV series you watch.
        </p>
      </div>
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
        <AuthForm mode="register" />
        <p className="mt-4 text-center text-sm text-zinc-400">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-blue-400 hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}