import { Link, useLocation } from "wouter";
import { LayoutDashboard, Users, FileText, ChevronRight, Menu, X, TrendingUp, Settings2, RefreshCw, Rss } from "lucide-react";
import { useState } from "react";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/leads", label: "Leads", icon: Users, exact: false },
  { href: "/admin/quotes", label: "Quotes", icon: FileText, exact: false },
  {
    href: "/admin/opportunities",
    label: "Opportunities",
    icon: TrendingUp,
    exact: false,
    children: [
      { href: "/admin/opportunities", label: "All Opportunities", icon: TrendingUp },
      { href: "/admin/opportunities/sources", label: "Sources", icon: Rss },
      { href: "/admin/opportunities/rules", label: "Scoring Rules", icon: Settings2 },
      { href: "/admin/opportunities/sync-log", label: "Sync Log", icon: RefreshCw },
    ],
  },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  function isActive(href: string, exact: boolean) {
    if (exact) return location === href;
    return location === href;
  }

  function isGroupActive(href: string, exact: boolean) {
    if (exact) return location === href;
    return location.startsWith(href);
  }

  const NavContent = () => (
    <nav className="flex-1 p-4 space-y-0.5 overflow-y-auto">
      {NAV_ITEMS.map((item) => {
        const groupActive = isGroupActive(item.href, !!item.exact);
        const inOppsSection = location.startsWith("/admin/opportunities");
        return (
          <div key={item.href}>
            <Link
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                !item.children && isActive(item.href, !!item.exact)
                  ? "bg-amber-500 text-black"
                  : item.children && groupActive
                  ? "text-amber-400 hover:bg-slate-800"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              }`}
              onClick={() => !item.children && setSidebarOpen(false)}
            >
              <item.icon className="w-4 h-4 shrink-0" />
              {item.label}
            </Link>
            {item.children && inOppsSection && (
              <div className="ml-4 mt-0.5 space-y-0.5 border-l border-slate-700 pl-3">
                {item.children.map((child) => (
                  <Link
                    key={child.href}
                    href={child.href}
                    className={`flex items-center gap-2.5 px-2 py-2 rounded-md text-xs font-semibold transition-colors ${
                      location === child.href
                        ? "bg-amber-500 text-black"
                        : "text-slate-500 hover:text-slate-200 hover:bg-slate-800"
                    }`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <child.icon className="w-3.5 h-3.5 shrink-0" />
                    {child.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        );
      })}
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
          <aside className="relative flex flex-col w-64 bg-slate-900 h-full">
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
