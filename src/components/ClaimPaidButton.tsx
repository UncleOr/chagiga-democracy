"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { claimPaid } from "@/lib/actions/bid";

export function ClaimPaidButton() {
  const [pending, start] = useTransition();
  const [done, setDone] = useState(false);
  const router = useRouter();

  return (
    <button
      className="btn-ghost"
      disabled={pending || done}
      onClick={() =>
        start(async () => {
          await claimPaid();
          setDone(true);
          router.refresh();
        })
      }
    >
      {done ? "נרשם — ממתין לאישור" : pending ? "רושם..." : "כבר שילמתי"}
    </button>
  );
}
