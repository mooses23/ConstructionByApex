import { Link, useLocation } from "wouter";
import { LayoutDashboard, Users, FileText, BarChart3, ChevronRight, Menu, X } from "lucide-react";
import { useState } from "react";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/leads", label: "Leads", icon: Users, exact: false },
  { href: "/admin/quotes", label: "Quotes", icon: FileText, exact: false },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  function isActive(href: string, exact: boolean) {
    if (exact) return location === href;
    return location.startsWith(href);
  }

  const NavContent = () => (
    <nav className="flex-1 p-4 space-y-1">
      {NAV_ITEMS.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
            isActive(item.href, item.exact)
              ? "bg-amber-500 text-black"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
          }`}
          onClick={() => setSidebarOpen(false)}
        >
          <item.icon className="w-4 h-4 shrink-0" />
          {item.label}
        </Link>
      ))}
    </nav>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:flex-col w-56 bg-slate-900 shrink-0">
        <div className="p-4 border-b border-slate-800">
          <Link href="/" className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 bg-amber-500 rounded flex items-center justify-center">
              <span className="text-black font-black text-xs">A</span>
            </div>
            <span className="font-extrabold text-white text-sm leading-tight">Construction<br /><span className="text-amber-400 text-xs">By Apex</span></span>
          </Link>
          <span className="text-xs text-slate-500 uppercase tracking-widest mt-2 block">Admin</span>
        </div>
        <NavContent />
        <div className="p-4 border-t border-slate-800">
          <Link href="/" className="text-xs text-slate-500 hover:text-amber-400 transition-colors flex items-center gap-1">
            View Public Site <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className="relative flex flex-col w-56 bg-slate-900 h-full">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <span className="font-extrabold text-white text-sm">Admin Panel</span>
              <button onClick={() => setSidebarOpen(false)} className="text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            <NavContent />
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="md:hidden bg-white border-b border-slate-200 px-4 h-14 flex items-center gap-3">
          <button onClick={() => setSidebarOpen(true)} className="p-1 text-slate-600">
            <Menu className="w-5 h-5" />
          </button>
          <span className="font-extrabold text-slate-900">Admin</span>
        </header>
        <main className="flex-1 p-4 md:p-8 max-w-6xl w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
