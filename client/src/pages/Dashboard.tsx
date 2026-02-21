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
    <div className="space-y-10">
      <section className="text-center space-y-6 pt-8 pb-4 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1
            data-testid="text-hero-title"
            className="text-3xl md:text-5xl font-bold tracking-tight mb-3 neon-text"
          >
            Command Center
          </h1>
          <p className="text-sm text-muted-foreground max-w-xl mx-auto mb-8 font-mono">
            Deep security analysis for DDoS resilience, scraping vulnerabilities,
            and server configuration.
          </p>
        </motion.div>

        <ScannerInput />
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" data-testid="section-stats">
        <StatsCard
          icon={Activity}
          label="TOTAL SCANS"
          value={totalScans.toString()}
        />
        <StatsCard
          icon={ShieldCheck}
          label="SECURE TARGETS"
          value={secureCount.toString()}
        />
        <StatsCard
          icon={AlertTriangle}
          label="VULNERABILITIES"
          value={vulnerableCount.toString()}
          isAlert={vulnerableCount > 0}
        />
        <StatsCard
          icon={Server}
          label="ACTIVE MONITORS"
          value="24/7"
        />
      </section>

      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <Zap className="w-5 h-5 text-primary drop-shadow-[0_0_4px_rgba(0,255,0,0.5)]" />
          <h2 className="text-xl font-bold neon-text tracking-wide">
            Recent Scans
          </h2>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {scans?.slice(0, 6).map((scan) => (
              <motion.div
                key={scan.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
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

function StatsCard({ icon: Icon, label, value, isAlert }: { icon: any; label: string; value: string; isAlert?: boolean }) {
  return (
    <div
      className={cn(
        "cyber-card p-5 flex items-center gap-4",
        isAlert && "border-destructive/30"
      )}
    >
      <div className={cn(
        "p-2.5 rounded-lg border",
        isAlert
          ? "bg-destructive/10 border-destructive/20"
          : "bg-primary/5 border-primary/15"
      )}>
        <Icon className={cn("w-5 h-5", isAlert ? "text-destructive" : "text-primary drop-shadow-[0_0_4px_rgba(0,255,0,0.3)]")} />
      </div>
      <div>
        <p className="text-[10px] text-muted-foreground font-mono tracking-widest uppercase">{label}</p>
        <p className={cn(
          "text-2xl font-bold font-mono",
          isAlert ? "text-destructive" : "neon-text"
        )}>{value}</p>
      </div>
    </div>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
