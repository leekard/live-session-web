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

export async function issueLicense(formData: FormData) {
  const store = await cookies();
  const cookie = store.get(cookieName)?.value;
  if (!cookie) return { ok: false, error: "UNAUTHORIZED" };

  const userId = Number(formData.get("userId"));
  const plan = String(formData.get("plan") || "basic");
  const months = Number(formData.get("months") || 12);
  if (!userId || Number.isNaN(userId)) return { ok: false, error: "VALIDATION" };

  const res = await fetch(`${backendUrl}/api/licenses`, {
    method: "POST",
    headers: { "content-type": "application/json", cookie },
    body: JSON.stringify({ userId, plan, months }),
    cache: "no-store",
  });
  const body = await res.json();
  revalidatePath("/admin/licenses");
  return body;
}
