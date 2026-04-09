import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";

const navLinks = [
  { label: "Services", href: "/services" },
  { label: "Projects", href: "/projects" },
  { label: "Reviews", href: "/reviews" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

export default function SiteNav() {
  const [open, setOpen] = useState(false);
  const [location] = useLocation();

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-amber-500 rounded flex items-center justify-center">
              <span className="text-black font-black text-sm">A</span>
            </div>
            <span className="font-extrabold text-slate-900 text-lg leading-tight">
              Construction<br />
              <span className="text-amber-500 text-sm font-bold tracking-widest uppercase">By Apex</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-semibold transition-colors ${
                  location === link.href
                    ? "text-amber-500"
                    : "text-slate-700 hover:text-amber-500"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <a href="tel:6145550182" className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 hover:text-amber-500 transition-colors">
              <Phone className="w-4 h-4" />
              (614) 555-0182
            </a>
            <Link href="/quote">
              <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-black font-bold">
                Get a Quote
              </Button>
            </Link>
          </div>

          <button
            className="md:hidden p-2 rounded text-slate-700"
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
          >
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden bg-white border-t border-slate-200 px-4 py-4 space-y-3">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="block text-base font-semibold text-slate-700 py-2"
              onClick={() => setOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <div className="pt-3 border-t border-slate-200 flex flex-col gap-3">
            <a href="tel:6145550182" className="flex items-center gap-2 text-base font-semibold text-slate-900">
              <Phone className="w-4 h-4 text-amber-500" />
              (614) 555-0182
            </a>
            <Link href="/quote" onClick={() => setOpen(false)}>
              <Button className="w-full bg-amber-500 hover:bg-amber-600 text-black font-bold">
                Request a Quote
              </Button>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
