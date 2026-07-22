export default function BannedPage() {
  return (
    <div className="mx-auto mt-16 max-w-md text-center">
      <div className="card p-8">
        <div className="mb-3 text-4xl">🚫</div>
        <h1 className="text-xl font-bold">החשבון חסום</h1>
        <p className="mt-2 text-sm text-slate-500">
          החשבון שלך נחסם מהשתתפות במשחק. אם לדעתך מדובר בטעות, פנו למארגני המשחק.
        </p>
      </div>
    </div>
  );
}
