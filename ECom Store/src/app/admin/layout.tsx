// Admin Website prototype shell — restricted to users with the admin role.
import { redirect } from "next/navigation";
import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { getSession } from "@/lib/auth";
import AdminShell from "@/components/admin/AdminShell";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login?next=/admin");

  if (session.role !== "admin") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream px-4">
        <div className="max-w-md rounded-3xl bg-white p-10 text-center shadow-xl ring-1 ring-ink/10">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-rose-100 text-rose-700">
            <ShieldAlert className="h-7 w-7" />
          </span>
          <h1 className="font-display mt-4 text-2xl font-bold">Restricted Area</h1>
          <p className="mt-2 text-[15px] text-mocha">
            The admin portal is only available to boutique staff. You&apos;re signed in as {session.email}.
          </p>
          <div className="mt-6 flex justify-center gap-2">
            <Link href="/" className="rounded-full bg-ink px-6 py-2.5 text-sm font-semibold text-cream hover:bg-rosewood">
              Back to Store
            </Link>
            <Link href="/login" className="rounded-full border border-ink/20 px-6 py-2.5 text-sm font-semibold hover:border-rosewood hover:text-rosewood">
              Switch Account
            </Link>
          </div>
          <p className="mt-4 text-xs text-mocha">Demo admin: admin@sarahsboutique.com / admin123</p>
        </div>
      </div>
    );
  }

  return <AdminShell>{children}</AdminShell>;
}
