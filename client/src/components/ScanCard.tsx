import { type Scan } from "@shared/schema";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "./StatusBadge";
import { formatDistanceToNow } from "date-fns";
import { ArrowRight, Globe, Server, Activity } from "lucide-react";
import { Link } from "wouter";

interface ScanCardProps {
  scan: Scan;
}

export function ScanCard({ scan }: ScanCardProps) {
  const isRisky = scan.isScrapable || !scan.ddosProtected;

  return (
    <Link href={`/scans/${scan.id}`} className="block group">
      <Card
        data-testid={`card-scan-${scan.id}`}
        className="cyber-card p-5 hover:border-primary/50 cursor-pointer h-full flex flex-col justify-between overflow-hidden relative"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />

        <div>
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-muted-foreground" />
              <h3 className="font-mono font-medium text-lg truncate max-w-[200px] text-foreground group-hover:text-primary transition-colors">
                {scan.url.replace(/^https?:\/\//, "")}
              </h3>
            </div>
            <StatusBadge
              status={isRisky ? "vulnerable" : "secure"}
              label={isRisky ? "Risks Detected" : "Secure"}
            />
          </div>

          <div className="space-y-2 text-sm text-muted-foreground font-mono">
            {scan.targetIp && (
              <div className="flex items-center gap-2">
                <Activity className="w-3.5 h-3.5" />
                <span data-testid={`text-ip-${scan.id}`}>{scan.targetIp}</span>
              </div>
            )}
            {scan.server && (
              <div className="flex items-center gap-2">
                <Server className="w-3.5 h-3.5" />
                <span data-testid={`text-server-${scan.id}`}>{scan.server}</span>
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-border/50 flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {scan.createdAt
              ? formatDistanceToNow(new Date(scan.createdAt), { addSuffix: true })
              : "Just now"}
          </span>
          <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transform group-hover:translate-x-1 transition-all text-primary" />
        </div>
      </Card>
    </Link>
  );
}
