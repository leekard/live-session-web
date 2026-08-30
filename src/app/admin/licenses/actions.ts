"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { cookieName } from "@/shared/api/client";

const backendUrl = process.env.BACKEND_URL || "http://api:3001";

export async function setLicenseStatus(id: number, status: "active" | "revoked" | "expired") {
  const store = await cookies();
  const cookie = store.get(cookieName)?.value;
  if (!cookie) return { ok: false, error: "UNAUTHORIZED" };

  const res = await fetch(`${backendUrl}/api/licenses/${id}`, {
    method: "PATCH",
    headers: { "content-type": "application/json", cookie },
    body: JSON.stringify({ status }),
    cache: "no-store",
  });
  const body = await res.json();
  revalidatePath("/admin/licenses");
  return body;
}
