"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/shared/ui";

export function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <Button variant="ghost" size="sm" onClick={handleLogout}>
      Выйти
    </Button>
  );
}
