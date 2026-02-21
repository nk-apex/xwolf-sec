import { useScans } from "@/hooks/use-scans";
import { ScannerInput } from "@/components/ScannerInput";
import { ScanCard } from "@/components/ScanCard";
import { Skeleton } from "@/components/ui/skeleton";
import { ShieldCheck, Server, AlertTriangle, Activity } from "lucide-react";
import { motion } from "framer-motion";

export default function Dashboard() {
  const { data: scans, isLoading } = useScans();

  const totalScans = scans?.length || 0;
  const vulnerableCount =
    scans?.filter((s) => s.isScrapable || !s.ddosProtected).length || 0;
  const secureCount = totalScans - vulnerableCount;

  return (
    <div className="space-y-12">
      <section className="text-center space-y-6 pt-10 pb-6 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1
            data-testid="text-hero-title"
            className="text-4xl md:text-6xl font-bold tracking-tight mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white via-gray-200 to-gray-500"
          >
            Security Analysis <br className="hidden md:block" /> & Threat
            Intelligence
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            Deep dive analysis for DDOS resilience, scraping vulnerabilities, and
            server configuration security.
          </p>
        </motion.div>

        <ScannerInput />
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" data-testid="section-stats">
        <StatsCard
          icon={Activity}
          label="Total Scans"
          value={totalScans.toString()}
          color="text-blue-500"
          borderColor="border-blue-500/20"
        />
        <StatsCard
          icon={ShieldCheck}
          label="Secure Targets"
          value={secureCount.toString()}
          color="text-green-500"
          borderColor="border-green-500/20"
        />
        <StatsCard
          icon={AlertTriangle}
          label="Vulnerabilities"
          value={vulnerableCount.toString()}
          color="text-red-500"
          borderColor="border-red-500/20"
        />
        <StatsCard
          icon={Server}
          label="Active Monitors"
          value="24/7"
          color="text-purple-500"
          borderColor="border-purple-500/20"
        />
      </section>

      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <span className="w-1 h-8 bg-primary rounded-full"></span>
            Recent Scans
          </h2>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-48 rounded-xl border border-border/50 bg-card p-6 space-y-4"
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
            className="text-center py-20 border border-dashed border-border rounded-xl bg-card/30"
          >
            <ShieldCheck className="w-16 h-16 mx-auto text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-xl font-medium text-foreground">No scans yet</h3>
            <p className="text-muted-foreground">
              Enter a URL above to start your first security analysis.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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

function StatsCard({ icon: Icon, label, value, color, borderColor }: any) {
  return (
    <div
      className={`bg-card/50 border ${borderColor} p-6 rounded-xl backdrop-blur-sm flex items-center gap-4 hover:bg-card transition-colors`}
    >
      <div className={`p-3 rounded-lg bg-background ${color} bg-opacity-10`}>
        <Icon className={`w-6 h-6 ${color}`} />
      </div>
      <div>
        <p className="text-sm text-muted-foreground font-medium">{label}</p>
        <p className="text-2xl font-bold font-mono">{value}</p>
      </div>
    </div>
  );
}
