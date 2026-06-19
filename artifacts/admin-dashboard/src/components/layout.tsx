import { Link, useLocation } from "wouter";
import { useAuthStore } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Users,
  Truck,
  LogOut,
  Menu,
  X,
  Map,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useGetDashboardStats, getGetDashboardStatsQueryKey } from "@workspace/api-client-react";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const logout = useAuthStore((s) => s.logout);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { data: stats } = useGetDashboardStats({ query: { queryKey: getGetDashboardStatsQueryKey(), refetchInterval: 15000 } });
  const pendingDrivers = stats?.pendingDrivers ?? 0;

  const navItems = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard, badge: 0 },
    { href: "/drivers", label: "Drivers", icon: Users, badge: pendingDrivers },
    { href: "/requests", label: "Tow Requests", icon: Truck, badge: 0 },
    { href: "/live-map", label: "Live Map", icon: Map, badge: 0 },
  ];

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 flex flex-col w-64 bg-sidebar text-sidebar-foreground transition-transform duration-200 lg:static lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center gap-3 px-6 py-5 border-b border-sidebar-border">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary">
            <Truck className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-bold text-sm leading-tight text-sidebar-foreground">Swift Tow</p>
            <p className="text-xs text-sidebar-foreground/60 leading-tight">Admin Console</p>
          </div>
          <button
            className="ml-auto lg:hidden text-sidebar-foreground/60 hover:text-sidebar-foreground"
            onClick={() => setSidebarOpen(false)}
            data-testid="button-close-sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {navItems.map(({ href, label, icon: Icon, badge }) => {
            const active = location === href;
            return (
              <Link key={href} href={href} onClick={() => setSidebarOpen(false)}>
                <div
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors cursor-pointer",
                    active
                      ? "bg-primary text-primary-foreground"
                      : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                  data-testid={`nav-${label.toLowerCase().replace(/\s+/g, "-")}`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="flex-1">{label}</span>
                  {badge > 0 && (
                    <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-amber-500 text-white text-xs font-bold leading-none">
                      {badge}
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-sidebar-border">
          <Button
            variant="ghost"
            className="w-full justify-start gap-2 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
            onClick={logout}
            data-testid="button-logout"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </Button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="flex items-center gap-3 h-14 px-4 border-b border-border bg-card lg:hidden shrink-0">
          <button
            className="text-muted-foreground hover:text-foreground"
            onClick={() => setSidebarOpen(true)}
            data-testid="button-open-sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-primary" />
            <span className="font-semibold text-sm">Swift Tow Admin</span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
