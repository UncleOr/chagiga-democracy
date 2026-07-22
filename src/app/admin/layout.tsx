import { requireAdmin } from "@/lib/auth";
import { AdminNav } from "@/components/admin/AdminNav";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold">ניהול</h1>
        <p className="text-sm text-slate-500">חגיגה של דמוקרטיה — פאנל מארגנים</p>
      </div>
      <AdminNav />
      <div>{children}</div>
    </div>
  );
}
