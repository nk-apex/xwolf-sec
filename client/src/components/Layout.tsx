import { Link, useLocation } from "wouter";
import { LayoutDashboard, History, Settings, Menu, X, Zap, PanelLeftClose, PanelLeft } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import logoPath from "@assets/xwolf_logo.png";
import { MatrixBackground } from "./MatrixBackground";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const navItems = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/history", label: "Scan History", icon: History },
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row font-sans relative overflow-hidden">
      <MatrixBackground />
      <div className="neon-grid-bg" />

      <header className="md:hidden flex items-center justify-between p-4 border-b border-primary/20 sticky top-0 z-50 bg-black/90 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <img src={logoPath} alt="XWOLF SEC" className="h-8 rounded" />
          <span className="font-bold tracking-tight text-white text-sm" data-testid="text-brand-mobile">XWOLF SEC</span>
        </div>
        <Button data-testid="button-mobile-menu" variant="ghost" size="icon" className="relative z-[60]" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <X /> : <Menu />}
        </Button>
      </header>

      {mobileMenuOpen && (
        <div
          data-testid="overlay-mobile"
          className="fixed inset-0 z-[45] md:hidden bg-black/80 backdrop-blur-sm"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 border-r border-primary/20 transform transition-all duration-300 md:translate-x-0 md:static md:block bg-black/95 backdrop-blur-sm",
          mobileMenuOpen ? "translate-x-0 w-60 z-[55]" : "-translate-x-full w-60 z-[55]",
          sidebarCollapsed ? "md:w-[68px]" : "md:w-60"
        )}
      >
        <div className="h-full flex flex-col">
          <div className={cn("p-4 border-b border-primary/20", mobileMenuOpen && "mt-[60px] md:mt-0")}>
            <div className={cn("flex items-center gap-3 mb-1", sidebarCollapsed && "md:justify-center")}>
              <img src={logoPath} alt="XWOLF SEC" className={cn("rounded shrink-0", sidebarCollapsed ? "md:h-7" : "h-9")} />
              <h1 className={cn("font-bold text-base tracking-wider text-white", sidebarCollapsed && "md:hidden")} data-testid="text-brand">XWOLF SEC</h1>
            </div>
            <p className={cn("text-[10px] text-gray-500 font-mono tracking-wider pl-0.5", sidebarCollapsed && "md:hidden")}>Security Analysis<br />& Threat Intelligence</p>
          </div>

          <nav className="flex-1 p-3 space-y-1 mt-2">
            {navItems.map((item) => {
              const isActive = location === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  data-testid={`link-nav-${item.label.toLowerCase().replace(/\s/g, "-")}`}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 relative",
                    sidebarCollapsed && "md:px-0 md:justify-center",
                    isActive
                      ? "text-primary bg-primary/10 border border-primary/20"
                      : "text-muted-foreground hover:text-white hover:bg-black/40"
                  )}
                  title={sidebarCollapsed ? item.label : undefined}
                >
                  {isActive && !sidebarCollapsed && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-primary shadow-[0_0_8px_rgba(0,255,0,0.5)]" />
                  )}
                  <item.icon className={cn("w-4 h-4 shrink-0", isActive && "drop-shadow-[0_0_4px_rgba(0,255,0,0.5)]")} />
                  <span className={cn(sidebarCollapsed && "md:hidden")}>{item.label}</span>
                  {isActive && !sidebarCollapsed && <span className={cn("ml-auto w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_6px_rgba(0,255,0,0.8)]", sidebarCollapsed && "md:hidden")} />}
                </Link>
              );
            })}
          </nav>

          <div className={cn("p-3 border-t border-primary/20", sidebarCollapsed && "md:px-2")}>
            <Button
              data-testid="button-toggle-sidebar"
              variant="ghost"
              size="sm"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="hidden md:flex w-full items-center justify-center gap-2 text-xs font-mono text-muted-foreground mb-2"
              title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {sidebarCollapsed ? (
                <PanelLeft className="w-4 h-4 shrink-0" />
              ) : (
                <>
                  <PanelLeftClose className="w-4 h-4 shrink-0" />
                  <span>Collapse</span>
                </>
              )}
            </Button>

            <div className={cn("rounded-xl p-3 text-[10px] font-mono text-muted-foreground border border-primary/20 bg-black/30", sidebarCollapsed && "md:p-2")}>
              <div className={cn("flex items-center justify-between mb-2", sidebarCollapsed && "md:justify-center")}>
                <span className={cn("flex items-center gap-1.5", sidebarCollapsed && "md:gap-0")}>
                  <Zap className="w-3 h-3 text-primary shrink-0" />
                  <span className={cn(sidebarCollapsed && "md:hidden")}>SYSTEM STATUS</span>
                </span>
                <span className={cn("text-primary font-bold tracking-wider", sidebarCollapsed && "md:hidden")} data-testid="text-status">ONLINE</span>
              </div>
              <div className="w-full rounded-full h-0.5 mt-1 bg-black/50">
                <div className="w-full h-0.5 rounded-full animate-pulse bg-primary shadow-[0_0_4px_rgba(0,255,0,0.5)]" />
              </div>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-auto relative z-10">
        <div className="relative container mx-auto p-4 md:p-8 max-w-7xl">{children}</div>
      </main>
    </div>
  );
}
