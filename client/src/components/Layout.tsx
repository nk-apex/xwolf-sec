import { Link, useLocation } from "wouter";
import { Shield, LayoutDashboard, History, Settings, Menu, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

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
      <header className="md:hidden flex items-center justify-between p-4 border-b border-border bg-card/50 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <Shield className="w-6 h-6 text-primary" />
          <span className="font-bold tracking-tight" data-testid="text-brand-mobile">XWOLF SEC</span>
        </div>
        <Button data-testid="button-mobile-menu" variant="ghost" size="icon" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <X /> : <Menu />}
        </Button>
      </header>

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 bg-card border-r border-border transform transition-transform duration-300 md:translate-x-0 md:static md:block",
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="h-full flex flex-col">
          <div className="p-6 flex items-center gap-3 border-b border-border/50">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="font-bold text-lg tracking-tight" data-testid="text-brand">XWOLF SEC</h1>
              <p className="text-xs text-muted-foreground font-mono">V.2.0.4-ALPHA</p>
            </div>
          </div>

          <nav className="flex-1 p-4 space-y-2">
            {navItems.map((item) => {
              const isActive = location === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  data-testid={`link-nav-${item.label.toLowerCase().replace(/\s/g, "-")}`}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-primary/10 text-primary border border-primary/20 shadow-[0_0_15px_-5px_rgba(34,197,94,0.3)]"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  )}
                >
                  <item.icon className={cn("w-5 h-5", isActive && "animate-pulse")} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-border/50">
            <div className="bg-secondary/50 rounded-lg p-3 text-xs font-mono text-muted-foreground border border-border/50">
              <div className="flex justify-between mb-1">
                <span>STATUS</span>
                <span className="text-primary" data-testid="text-status">ONLINE</span>
              </div>
              <div className="w-full bg-background rounded-full h-1 mt-2">
                <div className="bg-primary w-full h-1 rounded-full animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-auto relative">
        <div
          className="absolute inset-0 z-0 opacity-[0.03]"
          style={{
            backgroundImage: "radial-gradient(#ffffff 1px, transparent 1px)",
            backgroundSize: "30px 30px",
          }}
        />
        <div className="relative z-10 container mx-auto p-4 md:p-8 max-w-7xl">{children}</div>
      </main>

      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
    </div>
  );
}
