import type { Metadata } from "next";
import { accountNav } from "@/shared/config/site";
import { PageShell } from "@/widgets";

export const metadata: Metadata = {
  title: "Личный кабинет",
  robots: { index: false },
};

export default function AccountLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <PageShell title="Личный кабинет" nav={accountNav}>
      {children}
    </PageShell>
  );
}
