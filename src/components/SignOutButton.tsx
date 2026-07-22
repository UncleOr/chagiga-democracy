import { signOut } from "@/lib/actions/auth";

export function SignOutButton() {
  return (
    <form action={signOut}>
      <button type="submit" className="btn-ghost border-0 px-2 text-slate-500 hover:bg-slate-100">
        יציאה
      </button>
    </form>
  );
}
