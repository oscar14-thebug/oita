import Image from "next/image";
import Link from "next/link";

const LINKS = [
  { label: "Inicio", href: "/" },
  { label: "Explorar", href: "/explorar" },
  { label: "Comparar", href: "/comparar" },
  { label: "Panorama regional", href: "/panorama-regional" },
  { label: "Metodología", href: "/metodologia" },
  { label: "Sobre OITA", href: "/sobre-oita" },
  { label: "Recursos", href: "/recursos" },
];

export function NavBar() {
  return (
    <header className="sticky top-0 z-50 border-b border-neutral-200 bg-neutral-50">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/images/oita-logo.png"
            alt="OITA - Observatorio Interamericano de Transparencia Algorítmica"
            width={171}
            height={90}
            className="h-9 w-auto"
            priority
          />
        </Link>

        <ul className="flex flex-wrap items-center gap-6 text-sm text-neutral-500">
          {LINKS.map((link) => (
            <li key={link.label}>
              <Link href={link.href} className="transition-colors hover:text-neutral-900">
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
