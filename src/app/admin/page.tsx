import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser, isAdminRequestAllowed } from "@/lib/auth";
import AdminUsers from "@/components/admin/AdminUsers";

export const metadata: Metadata = { title: "Admin" };

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!(await isAdminRequestAllowed(user?.role))) redirect("/");

  const users = await prisma.user.findMany({
    select: {
      id: true,
      username: true,
      email: true,
      role: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold">Admin panel</h1>
        <p className="text-sm text-zinc-500">
          Approve new accounts and manage members.
        </p>
      </div>
      <AdminUsers
        initialUsers={users.map((u) => ({
          ...u,
          createdAt: u.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}