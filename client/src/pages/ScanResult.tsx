import { useScan } from "@/hooks/use-scans";
import { useParams, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  ArrowLeft,
  Shield,
  Lock,
  Unlock,
  Server,
  Terminal,
  AlertTriangle,
  ShieldAlert,
  ShieldCheck,
  AlertOctagon,
  Info,
  ChevronDown,
  ChevronUp,
  Zap,
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useState } from "react";
import type { Finding, SeverityLevel } from "@shared/schema";

const severityConfig: Record<SeverityLevel, { color: string; bg: string; border: string; icon: typeof AlertOctagon; order: number }> = {
  CRITICAL: { color: "text-red-500", bg: "bg-red-500/10", border: "border-red-500/40", icon: AlertOctagon, order: 0 },
  HIGH: { color: "text-orange-500", bg: "bg-orange-500/10", border: "border-orange-500/40", icon: ShieldAlert, order: 1 },
  MEDIUM: { color: "text-yellow-500", bg: "bg-yellow-500/10", border: "border-yellow-500/40", icon: AlertTriangle, order: 2 },
  LOW: { color: "text-blue-400", bg: "bg-blue-400/10", border: "border-blue-400/40", icon: Info, order: 3 },
  INFO: { color: "text-gray-400", bg: "bg-gray-400/10", border: "border-gray-400/40", icon: Info, order: 4 },
};

export default function ScanResult() {
  const { id } = useParams();
  const { data: scan, isLoading, error } = useScan(Number(id));

  if (isLoading) return <ScanLoading />;
  if (error || !scan) return <ScanError />;

  const findings: Finding[] = (scan.findings as Finding[]) || [];
  const sortedFindings = [...findings].sort(
    (a, b) => (severityConfig[a.severity]?.order ?? 5) - (severityConfig[b.severity]?.order ?? 5)
  );

  const severityCounts = findings.reduce<Record<string, number>>((acc, f) => {
    acc[f.severity] = (acc[f.severity] || 0) + 1;
    return acc;
  }, {});

  const categories = [...new Set(findings.map((f) => f.category))];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/">
          <Button
            data-testid="button-back"
            variant="outline"
            size="icon"
            className="rounded-full h-10 w-10 border-primary/30 hover:border-primary hover:text-primary hover:bg-primary/10 transition-all"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1
            data-testid="text-scan-target"
            className="text-xl font-bold font-mono tracking-tight flex items-center gap-2"
          >
            <span className="text-muted-foreground">TARGET:</span> <span className="neon-text">{scan.url}</span>
          </h1>
          <p className="text-muted-foreground text-xs font-mono tracking-wider">
            ID: #{scan.id.toString().padStart(6, "0")} &bull;{" "}
            {new Date(scan.createdAt!).toLocaleString()}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
              ? "WAF / CDN protection detected"
              : "No edge protection found"
          }
        />
        <Card className="cyber-card col-span-1 md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-mono font-medium text-muted-foreground flex items-center gap-2 tracking-widest uppercase">
              <Server className="w-4 h-4 text-primary/50" /> Target Infrastructure
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-background/50 rounded-lg border border-border/30">
              <span className="text-xs text-muted-foreground font-mono">IP Address</span>
              <code data-testid="text-target-ip" className="font-mono text-sm neon-text">
                {scan.targetIp || "Unknown"}
              </code>
            </div>
            <div className="flex items-center justify-between p-3 bg-background/50 rounded-lg border border-border/30">
              <span className="text-xs text-muted-foreground font-mono">Server Tech</span>
              <code data-testid="text-server-tech" className="font-mono text-sm text-primary/70">
                {scan.server || "Hidden"}
              </code>
            </div>
          </CardContent>
        </Card>
      </div>

      {findings.length > 0 && (
        <div className="flex flex-wrap gap-2" data-testid="section-severity-summary">
          {(["CRITICAL", "HIGH", "MEDIUM", "LOW", "INFO"] as SeverityLevel[]).map((sev) => {
            const count = severityCounts[sev] || 0;
            if (count === 0) return null;
            const cfg = severityConfig[sev];
            return (
              <div
                key={sev}
                className={cn("flex items-center gap-2 px-3 py-1.5 rounded-lg border font-mono text-xs", cfg.bg, cfg.border)}
              >
                <cfg.icon className={cn("w-3.5 h-3.5", cfg.color)} />
                <span className={cfg.color}>
                  {count} {sev}
                </span>
              </div>
            );
          })}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-card font-mono text-xs text-muted-foreground">
            {findings.length} total findings
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
          <div className="flex items-center gap-3">
            <Zap className="w-4 h-4 text-primary drop-shadow-[0_0_4px_rgba(0,255,0,0.5)]" />
            <h2 className="text-lg font-bold neon-text tracking-wide">
              Security Findings
            </h2>
            <span className="text-xs text-muted-foreground font-mono ml-auto">
              {categories.length} categories
            </span>
          </div>

          <div className="space-y-3" data-testid="section-findings">
            {sortedFindings.length > 0 ? (
              sortedFindings.map((f, idx) => (
                <FindingCard key={idx} finding={f} index={idx} />
              ))
            ) : scan.recommendations && scan.recommendations.length > 0 ? (
              scan.recommendations.map((rec, idx) => (
                <motion.div
                  key={idx}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: idx * 0.1 }}
                  className="p-4 rounded-xl border border-l-4 border-l-yellow-500/60 border-border/30 bg-card/80 flex gap-4 items-start"
                >
                  <div className="min-w-[24px] pt-1">
                    <div className="w-6 h-6 rounded-full bg-yellow-500/10 text-yellow-500 flex items-center justify-center text-xs font-bold font-mono border border-yellow-500/20">
                      {idx + 1}
                    </div>
                  </div>
                  <p className="text-card-foreground text-sm leading-relaxed">{rec}</p>
                </motion.div>
              ))
            ) : (
              <div className="p-8 border border-dashed border-primary/20 bg-primary/5 rounded-xl text-center">
                <ShieldCheck className="w-12 h-12 text-primary mx-auto mb-3 opacity-40" />
                <h3 className="font-medium text-primary/70 font-mono">All Clear</h3>
                <p className="text-xs text-muted-foreground font-mono mt-1">
                  No immediate vulnerabilities detected.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-5">
          <div className="flex items-center gap-3">
            <Terminal className="w-4 h-4 text-primary/50" />
            <h2 className="text-lg font-bold text-card-foreground tracking-wide">
              Headers
            </h2>
          </div>

          <Card className="cyber-card h-fit max-h-[600px] overflow-auto">
            <CardContent className="p-0">
              <div className="bg-black/60 p-2 border-b border-border/30 sticky top-0 backdrop-blur-md z-10">
                <div className="flex gap-1.5 px-2 py-1">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500/50" />
                </div>
              </div>
              <div className="p-4 font-mono text-[11px] space-y-3" data-testid="section-headers">
                {scan.headers && Object.keys(scan.headers).length > 0 ? (
                  Object.entries(scan.headers).map(([key, value]) => (
                    <div key={key} className="flex flex-col gap-0.5 break-all">
                      <span className="text-primary/70 font-bold">{key}:</span>
                      <span className="text-muted-foreground pl-4 border-l border-border/30">
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

function FindingCard({ finding, index }: { finding: Finding; index: number }) {
  const [expanded, setExpanded] = useState(
    finding.severity === "CRITICAL" || finding.severity === "HIGH"
  );
  const cfg = severityConfig[finding.severity];

  return (
    <motion.div
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ delay: Math.min(index * 0.05, 0.5) }}
      data-testid={`finding-${index}`}
      className={cn(
        "rounded-xl border border-l-4 bg-card/60 overflow-hidden",
        cfg.border
      )}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-start gap-3 p-4 text-left hover:bg-primary/5 transition-colors"
        data-testid={`button-finding-toggle-${index}`}
      >
        <div className="min-w-[28px] pt-0.5">
          <div
            className={cn(
              "w-7 h-7 rounded-full flex items-center justify-center border",
              cfg.bg,
              cfg.border
            )}
          >
            <cfg.icon className={cn("w-3.5 h-3.5", cfg.color)} />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span
              className={cn(
                "text-[10px] font-bold font-mono px-2 py-0.5 rounded",
                cfg.bg,
                cfg.color
              )}
            >
              {finding.severity}
            </span>
            <span className="text-[10px] text-muted-foreground font-mono px-2 py-0.5 rounded bg-secondary/50">
              {finding.category}
            </span>
          </div>
          <p className="text-sm font-medium text-card-foreground leading-snug">
            {finding.title}
          </p>
        </div>
        <div className="pt-1 text-muted-foreground">
          {expanded ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 pl-[52px]">
          <div className="text-xs text-muted-foreground leading-relaxed border-t border-border/30 pt-3 font-mono">
            {finding.detail}
          </div>
        </div>
      )}
    </motion.div>
  );
}

function ResultCard({ title, icon: Icon, status, value, description }: any) {
  const isSecure = status === "secure";
  return (
    <Card
      className={cn(
        "cyber-card relative overflow-hidden",
        isSecure ? "border-primary/20" : "border-destructive/30"
      )}
    >
      <div className="absolute top-0 right-0 p-3 opacity-5">
        <Icon
          className={cn(
            "w-20 h-20",
            isSecure ? "text-primary" : "text-destructive"
          )}
        />
      </div>
      <CardHeader className="pb-2">
        <CardTitle className="text-[10px] font-mono font-medium text-muted-foreground tracking-widest uppercase">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div
          className={cn(
            "text-2xl font-bold font-mono mb-1",
            isSecure ? "neon-text" : "text-destructive"
          )}
        >
          {value}
        </div>
        <p className="text-[10px] text-muted-foreground font-mono">{description}</p>
        <div
          className={cn(
            "h-0.5 w-full mt-4 rounded-full",
            isSecure ? "bg-primary/15" : "bg-destructive/15"
          )}
        >
          <div
            className={cn(
              "h-0.5 rounded-full w-3/4",
              isSecure ? "bg-primary shadow-[0_0_4px_rgba(0,255,0,0.3)]" : "bg-destructive"
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
      <div className="relative w-28 h-28">
        <div className="absolute inset-0 border-2 border-primary/20 rounded-full"></div>
        <div className="absolute inset-0 border-2 border-primary border-t-transparent rounded-full animate-spin shadow-[0_0_10px_rgba(0,255,0,0.2)]"></div>
        <div className="absolute inset-4 bg-primary/5 rounded-full flex items-center justify-center animate-pulse">
          <Shield className="w-8 h-8 text-primary drop-shadow-[0_0_8px_rgba(0,255,0,0.5)]" />
        </div>
      </div>
      <div className="text-center space-y-2">
        <h2 className="text-xl font-bold neon-text animate-pulse font-mono">
          Running Deep Analysis...
        </h2>
        <p className="text-muted-foreground font-mono text-[10px] tracking-widest">
          DNS &bull; HEADERS &bull; BOT DETECTION &bull; CORS &bull; SSL/TLS &bull; RATE LIMITING
        </p>
      </div>
    </div>
  );
}

function ScanError() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-4">
      <div className="p-4 rounded-full bg-destructive/10 text-destructive mb-2">
        <AlertTriangle className="w-10 h-10" />
      </div>
      <h2 className="text-xl font-bold font-mono text-destructive">Scan Not Found</h2>
      <p className="text-muted-foreground text-sm font-mono max-w-md">
        The requested security scan could not be found or an error occurred
        during retrieval.
      </p>
      <Link href="/">
        <Button data-testid="button-return-dashboard" variant="outline" className="mt-4 border-primary/30 text-primary hover:bg-primary/10">
          Return to Command Center
        </Button>
      </Link>
    </div>
  );
}
