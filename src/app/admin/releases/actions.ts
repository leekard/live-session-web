"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { cookieName } from "@/shared/api/client";

const backendUrl = process.env.BACKEND_URL || "http://api:3001";

export async function uploadRelease(formData: FormData) {
  const store = await cookies();
  const cookie = store.get(cookieName)?.value;
  if (!cookie) return { ok: false, error: "UNAUTHORIZED" };

  const res = await fetch(`${backendUrl}/api/admin/releases`, {
    method: "POST",
    headers: { "x-auth-token": cookie },
    body: formData,
    cache: "no-store",
  });
  const body = await res.json().catch(() => ({}));
  revalidatePath("/admin/releases");
  return body;
}

export async function publishRelease(id: number) {
  const store = await cookies();
  const cookie = store.get(cookieName)?.value;
  if (!cookie) return { ok: false, error: "UNAUTHORIZED" };

  const res = await fetch(`${backendUrl}/api/admin/releases/${id}/publish`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-auth-token": cookie },
    body: JSON.stringify({}),
    cache: "no-store",
  });
  const body = await res.json().catch(() => ({}));
  revalidatePath("/admin/releases");
  return body;
}
