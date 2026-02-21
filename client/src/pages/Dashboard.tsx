import { useScans } from "@/hooks/use-scans";
import { ScannerInput } from "@/components/ScannerInput";
import { ScanCard } from "@/components/ScanCard";
import { Skeleton } from "@/components/ui/skeleton";
import { ShieldCheck, Server, AlertTriangle, Activity, Zap } from "lucide-react";
import { motion } from "framer-motion";

export default function Dashboard() {
  const { data: scans, isLoading } = useScans();

  const totalScans = scans?.length || 0;
  const vulnerableCount =
    scans?.filter((s) => s.isScrapable || !s.ddosProtected).length || 0;
  const secureCount = totalScans - vulnerableCount;

  return (
    <div className="space-y-4 sm:space-y-8" data-testid="overview-page">
      <section className="mb-6 sm:mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1
            data-testid="text-hero-title"
            className="text-xl sm:text-3xl font-bold mb-1 sm:mb-2 neon-text"
          >
            Command Center
          </h1>
          <p className="text-gray-400 font-mono text-xs sm:text-sm mb-6">
            Deep security analysis for DDoS resilience, scraping vulnerabilities,
            and server configuration.
          </p>
        </motion.div>

        <ScannerInput />
      </section>

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 mb-4 sm:mb-8" data-testid="section-stats">
        {[
          { icon: Activity, label: "Total Scans", value: totalScans.toString(), color: "primary" },
          { icon: ShieldCheck, label: "Secure Targets", value: secureCount.toString(), color: "primary" },
          { icon: AlertTriangle, label: "Vulnerabilities", value: vulnerableCount.toString(), color: vulnerableCount > 0 ? "destructive" : "primary" },
          { icon: Server, label: "Active Monitors", value: "24/7", color: "primary" },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <div className={cn(
              "p-3 sm:p-5 rounded-xl border bg-black/30 backdrop-blur-sm h-full",
              stat.color === "destructive" ? "border-destructive/20" : "border-primary/20"
            )}>
              <div className="flex justify-between items-start gap-1">
                <div className="min-w-0 flex-1">
                  <p className="text-gray-400 text-[9px] sm:text-xs uppercase tracking-wider mb-0.5 sm:mb-1 truncate">{stat.label}</p>
                  <h3 className={cn(
                    "text-sm sm:text-2xl font-bold font-mono truncate",
                    stat.color === "destructive" ? "text-destructive" : "neon-text"
                  )} data-testid={`text-stat-value-${stat.label.toLowerCase().replace(/\s+/g, '-')}`}>
                    {stat.value}
                  </h3>
                </div>
                <div className={cn(
                  "p-1 sm:p-2 rounded-lg shrink-0",
                  stat.color === "destructive" ? "bg-destructive/10" : "bg-primary/10"
                )}>
                  <stat.icon className={cn(
                    "w-3.5 h-3.5 sm:w-5 sm:h-5",
                    stat.color === "destructive" ? "text-destructive" : "text-primary"
                  )} />
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </section>

      <section className="space-y-4 sm:space-y-6">
        <h2 className="text-base sm:text-xl font-bold flex items-center">
          <Zap className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-primary drop-shadow-[0_0_4px_rgba(0,255,0,0.5)]" />
          <span className="neon-text">Recent Scans</span>
        </h2>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-48 rounded-xl border border-border/30 bg-card p-6 space-y-4"
              >
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-20 w-full" />
              </div>
            ))}
          </div>
        ) : scans?.length === 0 ? (
          <div
            data-testid="text-empty-scans"
            className="text-center py-16 border border-dashed border-border/30 rounded-xl bg-card/30"
          >
            <ShieldCheck className="w-12 h-12 mx-auto text-primary/30 mb-4" />
            <h3 className="text-lg font-medium text-primary/60">No scans yet</h3>
            <p className="text-muted-foreground text-sm font-mono mt-1">
              Enter a URL above to start your first security analysis.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {scans?.slice(0, 6).map((scan, index) => (
              <motion.div
                key={scan.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05, duration: 0.3 }}
              >
                <ScanCard scan={scan} />
              </motion.div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
