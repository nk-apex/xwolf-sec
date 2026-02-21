import { Link, useLocation } from "wouter";
import { Shield, LayoutDashboard, History, Settings, Menu, X, Zap } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import logoPath from "@assets/image_1771640058636.png";

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
      <header className="md:hidden flex items-center justify-between p-4 border-b border-border sticky top-0 z-50" style={{ backgroundColor: 'var(--surface-color)', backdropFilter: 'blur(var(--backdrop-blur))' }}>
        <div className="flex items-center gap-2">
          <img src={logoPath} alt="XWOLF SEC" className="h-8 rounded" />
          <span className="font-bold tracking-tight neon-text text-sm" data-testid="text-brand-mobile">XWOLF SEC</span>
        </div>
        <Button data-testid="button-mobile-menu" variant="ghost" size="icon" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <X /> : <Menu />}
        </Button>
      </header>

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-60 border-r transform transition-transform duration-300 md:translate-x-0 md:static md:block",
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}
        style={{
          backgroundColor: 'var(--surface-color)',
          backdropFilter: 'blur(var(--backdrop-blur))',
          borderColor: 'var(--border-color)',
        }}
      >
        <div className="h-full flex flex-col">
          <div className="p-4" style={{ borderBottom: '1px solid var(--border-color)' }}>
            <div className="flex items-center gap-3 mb-1">
              <img src={logoPath} alt="XWOLF SEC" className="h-9 rounded" />
              <h1 className="font-bold text-base tracking-wider neon-text" data-testid="text-brand">XWOLF SEC</h1>
            </div>
            <p className="text-[10px] text-muted-foreground font-mono tracking-wider pl-0.5">Security Analysis<br />& Threat Intelligence</p>
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
                      ? "text-primary neon-border"
                      : "text-muted-foreground"
                  )}
                  style={isActive ? { backgroundColor: 'rgba(var(--primary-color-rgb), 0.1)' } : undefined}
                >
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full" style={{ backgroundColor: 'var(--primary-color)', boxShadow: '0 0 8px rgba(var(--primary-color-rgb), 0.5)' }} />
                  )}
                  <item.icon className={cn("w-4 h-4", isActive && "drop-shadow-[0_0_4px_rgba(0,255,0,0.5)]")} />
                  {item.label}
                  {isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--primary-color)', boxShadow: '0 0 6px rgba(var(--primary-color-rgb), 0.8)' }} />}
                </Link>
              );
            })}
          </nav>

          <div className="p-3" style={{ borderTop: '1px solid var(--border-color)' }}>
            <div className="rounded-lg p-3 text-[10px] font-mono text-muted-foreground" style={{ border: '1px solid var(--border-color)', backgroundColor: 'rgba(var(--surface-color-rgb), 0.5)' }}>
              <div className="flex items-center justify-between mb-2">
                <span className="flex items-center gap-1.5">
                  <Zap className="w-3 h-3 text-primary" />
                  SYSTEM STATUS
                </span>
                <span className="text-primary font-bold tracking-wider" data-testid="text-status">ONLINE</span>
              </div>
              <div className="w-full rounded-full h-0.5 mt-1" style={{ backgroundColor: 'var(--background-color)' }}>
                <div className="w-full h-0.5 rounded-full animate-pulse" style={{ backgroundColor: 'var(--primary-color)', boxShadow: '0 0 4px rgba(var(--primary-color-rgb), 0.5)' }} />
              </div>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-auto relative">
        <div
          className="absolute inset-0 z-0 opacity-[0.02]"
          style={{
            backgroundImage: `radial-gradient(var(--primary-color) 1px, transparent 1px)`,
            backgroundSize: "30px 30px",
          }}
        />
        <div className="relative z-10 container mx-auto p-4 md:p-8 max-w-7xl">{children}</div>
      </main>

      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-30 md:hidden"
          style={{ backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
    </div>
  );
}
