"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { cookieName } from "@/shared/api/client";

const backendUrl = process.env.BACKEND_URL || "http://api:3001";

export async function revokeDevice(deviceId: string) {
  const store = await cookies();
  const cookie = store.get(cookieName)?.value;
  if (!cookie) return { ok: false, error: "UNAUTHORIZED" };

  const res = await fetch(`${backendUrl}/api/devices/${encodeURIComponent(deviceId)}`, {
    method: "DELETE",
    headers: { cookie },
    cache: "no-store",
  });
  const body = await res.json().catch(() => ({}));
  revalidatePath("/account/devices");
  return body;
}
