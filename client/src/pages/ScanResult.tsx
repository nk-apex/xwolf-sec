import { useScan } from "@/hooks/use-scans";
import { useParams, Link } from "wouter";
import { StatusBadge } from "@/components/StatusBadge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  ArrowLeft,
  Shield,
  Globe,
  Lock,
  Unlock,
  Server,
  Terminal,
  AlertOctagon,
  AlertTriangle,
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export default function ScanResult() {
  const { id } = useParams();
  const { data: scan, isLoading, error } = useScan(Number(id));

  if (isLoading) return <ScanLoading />;
  if (error || !scan) return <ScanError />;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/">
          <Button
            data-testid="button-back"
            variant="outline"
            size="icon"
            className="rounded-full h-10 w-10 border-dashed border-muted-foreground/50 hover:border-primary hover:text-primary transition-all"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1
            data-testid="text-scan-target"
            className="text-2xl font-bold font-mono tracking-tight flex items-center gap-2"
          >
            TARGET: <span className="text-primary">{scan.url}</span>
          </h1>
          <p className="text-muted-foreground text-sm font-mono">
            ID: #{scan.id.toString().padStart(6, "0")} •{" "}
            {new Date(scan.createdAt!).toLocaleString()}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <ResultCard
          title="Scraping Status"
          icon={scan.isScrapable ? Unlock : Lock}
          status={scan.isScrapable ? "vulnerable" : "secure"}
          value={scan.isScrapable ? "Exposed" : "Protected"}
          description={
            scan.isScrapable
              ? "Site is easily scrapable by bots"
              : "Anti-bot measures detected"
          }
        />

        <ResultCard
          title="DDoS Protection"
          icon={Shield}
          status={scan.ddosProtected ? "secure" : "vulnerable"}
          value={scan.ddosProtected ? "Active" : "Inactive"}
          description={
            scan.ddosProtected
              ? "WAF / Cloudflare detected"
              : "No edge protection found"
          }
        />

        <Card className="cyber-card col-span-1 md:col-span-2 bg-gradient-to-br from-card to-card/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Server className="w-4 h-4 text-primary" /> Target Infrastructure
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg border border-border/50">
              <span className="text-sm">IP Address</span>
              <code data-testid="text-target-ip" className="font-mono text-primary">
                {scan.targetIp || "Unknown"}
              </code>
            </div>
            <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg border border-border/50">
              <span className="text-sm">Server Tech</span>
              <code data-testid="text-server-tech" className="font-mono text-blue-400">
                {scan.server || "Hidden"}
              </code>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <AlertOctagon className="w-5 h-5 text-yellow-500" /> Security
              Recommendations
            </h2>
          </div>

          <div className="space-y-4" data-testid="section-recommendations">
            {scan.recommendations && scan.recommendations.length > 0 ? (
              scan.recommendations.map((rec, idx) => (
                <motion.div
                  key={idx}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: idx * 0.1 }}
                  data-testid={`text-recommendation-${idx}`}
                  className="p-4 rounded-xl border border-l-4 border-l-yellow-500 border-border bg-card/80 flex gap-4 items-start shadow-sm"
                >
                  <div className="min-w-[24px] pt-1">
                    <div className="w-6 h-6 rounded-full bg-yellow-500/10 text-yellow-500 flex items-center justify-center text-xs font-bold border border-yellow-500/20">
                      {idx + 1}
                    </div>
                  </div>
                  <div>
                    <p className="text-foreground leading-relaxed">{rec}</p>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="p-8 border border-dashed border-green-500/30 bg-green-500/5 rounded-xl text-center">
                <Shield className="w-12 h-12 text-green-500 mx-auto mb-3 opacity-50" />
                <h3 className="font-medium text-green-500">All Clear</h3>
                <p className="text-sm text-green-500/70">
                  No immediate vulnerabilities detected based on current scan
                  profile.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Terminal className="w-5 h-5 text-muted-foreground" /> Header
              Analysis
            </h2>
          </div>

          <Card className="cyber-card h-fit max-h-[600px] overflow-auto">
            <CardContent className="p-0">
              <div className="bg-black/40 p-2 border-b border-border/50 sticky top-0 backdrop-blur-md">
                <div className="flex gap-1.5 px-2 py-1">
                  <div className="w-3 h-3 rounded-full bg-red-500/50" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                  <div className="w-3 h-3 rounded-full bg-green-500/50" />
                </div>
              </div>
              <div className="p-4 font-mono text-xs space-y-3" data-testid="section-headers">
                {scan.headers && Object.keys(scan.headers).length > 0 ? (
                  Object.entries(scan.headers).map(([key, value]) => (
                    <div key={key} className="flex flex-col gap-1 break-all">
                      <span className="text-blue-400 font-bold">{key}:</span>
                      <span className="text-muted-foreground pl-4 border-l border-border">
                        {String(value)}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-muted-foreground italic">
                    No header data captured.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function ResultCard({ title, icon: Icon, status, value, description }: any) {
  const isSecure = status === "secure";
  return (
    <Card
      className={cn(
        "cyber-card relative overflow-hidden",
        isSecure ? "border-primary/20" : "border-destructive/20"
      )}
    >
      <div className="absolute top-0 right-0 p-3 opacity-10">
        <Icon
          className={cn(
            "w-24 h-24",
            isSecure ? "text-primary" : "text-destructive"
          )}
        />
      </div>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div
          className={cn(
            "text-2xl font-bold mb-1",
            isSecure ? "text-primary" : "text-destructive"
          )}
        >
          {value}
        </div>
        <p className="text-xs text-muted-foreground">{description}</p>
        <div
          className={cn(
            "h-1 w-full mt-4 rounded-full",
            isSecure ? "bg-primary/20" : "bg-destructive/20"
          )}
        >
          <div
            className={cn(
              "h-1 rounded-full w-3/4",
              isSecure ? "bg-primary" : "bg-destructive"
            )}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function ScanLoading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8">
      <div className="relative w-32 h-32">
        <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
        <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <div className="absolute inset-4 bg-primary/10 rounded-full flex items-center justify-center animate-pulse">
          <Shield className="w-10 h-10 text-primary" />
        </div>
      </div>
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold animate-pulse">
          Running Security Analysis...
        </h2>
        <p className="text-muted-foreground font-mono">
          Probing firewall • Checking headers • Testing scrape defenses
        </p>
      </div>
    </div>
  );
}

function ScanError() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-4">
      <div className="p-4 rounded-full bg-destructive/10 text-destructive mb-2">
        <AlertTriangle className="w-12 h-12" />
      </div>
      <h2 className="text-2xl font-bold">Scan Not Found</h2>
      <p className="text-muted-foreground max-w-md">
        The requested security scan could not be found or an error occurred
        during retrieval.
      </p>
      <Link href="/">
        <Button data-testid="button-return-dashboard" variant="outline" className="mt-4">
          Return to Dashboard
        </Button>
      </Link>
    </div>
  );
}
