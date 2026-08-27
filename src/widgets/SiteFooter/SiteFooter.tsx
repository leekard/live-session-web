import Link from "next/link";
import { siteConfig, siteLinks } from "@/shared/config/site";
import { Container } from "@/shared/ui";

export function SiteFooter() {
  return (
    <footer className="border-t border-border-subtle bg-background-darker">
      <Container className="py-8">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-sm text-zinc-500">
            © {new Date().getFullYear()} {siteConfig.name}. Все права защищены.
          </p>
          <nav className="flex items-center gap-6 text-sm text-zinc-500">
            <Link href="/#features" className="transition-colors hover:text-zinc-100">
              Возможности
            </Link>
            <Link href="/#pricing" className="transition-colors hover:text-zinc-100">
              Тарифы
            </Link>
            <Link href={siteLinks.account} className="transition-colors hover:text-zinc-100">
              Личный кабинет
            </Link>
            <Link href={siteLinks.admin} className="transition-colors hover:text-zinc-100">
              Админ
            </Link>
          </nav>
        </div>
      </Container>
    </footer>
  );
}
