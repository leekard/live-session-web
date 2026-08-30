"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { cookieName } from "@/shared/api/client";

const backendUrl = process.env.BACKEND_URL || "http://api:3001";

export async function savePlanLimit(plan: string, formData: FormData) {
  const store = await cookies();
  const cookie = store.get(cookieName)?.value;
  if (!cookie) return { ok: false, error: "UNAUTHORIZED" };

  const deviceLimit = Number(formData.get("deviceLimit"));
  if (!Number.isInteger(deviceLimit) || deviceLimit < 0) {
    return { ok: false, error: "VALIDATION", message: "deviceLimit must be a non-negative integer" };
  }

  const res = await fetch(`${backendUrl}/api/admin/plan-limits`, {
    method: "PATCH",
    headers: { "content-type": "application/json", cookie },
    body: JSON.stringify({ plan, deviceLimit }),
    cache: "no-store",
  });
  const body = await res.json().catch(() => ({}));
  revalidatePath("/admin/limits");
  return body;
}
