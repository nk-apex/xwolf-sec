import { Link, useLocation } from "wouter";
import { LayoutDashboard, History, Settings, Menu, X, Zap } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import logoPath from "@assets/xwolf_logo.png";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/history", label: "Scan History", icon: History },
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row font-sans">
      <header className="md:hidden flex items-center justify-between p-4 border-b border-primary/20 sticky top-0 z-50 bg-black/80 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <img src={logoPath} alt="XWOLF SEC" className="h-8 rounded" />
          <span className="font-bold tracking-tight text-white text-sm" data-testid="text-brand-mobile">XWOLF SEC</span>
        </div>
        <Button data-testid="button-mobile-menu" variant="ghost" size="icon" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <X /> : <Menu />}
        </Button>
      </header>

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-60 border-r border-primary/20 transform transition-transform duration-300 md:translate-x-0 md:static md:block bg-black/80 backdrop-blur-sm",
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="h-full flex flex-col">
          <div className="p-4 border-b border-primary/20">
            <div className="flex items-center gap-3 mb-1">
              <img src={logoPath} alt="XWOLF SEC" className="h-9 rounded" />
              <h1 className="font-bold text-base tracking-wider text-white" data-testid="text-brand">XWOLF SEC</h1>
            </div>
            <p className="text-[10px] text-gray-500 font-mono tracking-wider pl-0.5">Security Analysis<br />& Threat Intelligence</p>
          </div>

          <nav className="flex-1 p-3 space-y-1 mt-2">
            {navItems.map((item) => {
              const isActive = location === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  data-testid={`link-nav-${item.label.toLowerCase().replace(/\s/g, "-")}`}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 relative",
                    isActive
                      ? "text-primary bg-primary/10 border border-primary/20"
                      : "text-muted-foreground hover:text-white hover:bg-black/40"
                  )}
                >
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-primary shadow-[0_0_8px_rgba(0,255,0,0.5)]" />
                  )}
                  <item.icon className={cn("w-4 h-4", isActive && "drop-shadow-[0_0_4px_rgba(0,255,0,0.5)]")} />
                  {item.label}
                  {isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_6px_rgba(0,255,0,0.8)]" />}
                </Link>
              );
            })}
          </nav>

          <div className="p-3 border-t border-primary/20">
            <div className="rounded-xl p-3 text-[10px] font-mono text-muted-foreground border border-primary/20 bg-black/30">
              <div className="flex items-center justify-between mb-2">
                <span className="flex items-center gap-1.5">
                  <Zap className="w-3 h-3 text-primary" />
                  SYSTEM STATUS
                </span>
                <span className="text-primary font-bold tracking-wider" data-testid="text-status">ONLINE</span>
              </div>
              <div className="w-full rounded-full h-0.5 mt-1 bg-black/50">
                <div className="w-full h-0.5 rounded-full animate-pulse bg-primary shadow-[0_0_4px_rgba(0,255,0,0.5)]" />
              </div>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-auto relative">
        <div
          className="absolute inset-0 z-0 opacity-[0.02]"
          style={{
            backgroundImage: `radial-gradient(hsl(var(--primary)) 1px, transparent 1px)`,
            backgroundSize: "30px 30px",
          }}
        />
        <div className="relative z-10 container mx-auto p-4 md:p-8 max-w-7xl">{children}</div>
      </main>

      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-30 md:hidden bg-black/70 backdrop-blur-sm"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
    </div>
  );
}
