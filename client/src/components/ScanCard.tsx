import { type Scan } from "@shared/schema";
import { StatusBadge } from "./StatusBadge";
import { formatDistanceToNow } from "date-fns";
import { ArrowRight, Globe, Server, Activity } from "lucide-react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";

interface ScanCardProps {
  scan: Scan;
}

export function ScanCard({ scan }: ScanCardProps) {
  const isRisky = scan.isScrapable || !scan.ddosProtected;

  return (
    <Link href={`/scans/${scan.id}`} className="block group">
      <div
        data-testid={`card-scan-${scan.id}`}
        className={cn(
          "p-5 rounded-xl border bg-black/30 backdrop-blur-sm cursor-pointer h-full flex flex-col justify-between relative transition-all duration-300",
          isRisky
            ? "border-primary/20 hover:border-destructive/40"
            : "border-primary/20 hover:border-primary/40"
        )}
      >
        <div>
          <div className="flex items-start gap-3 mb-4">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <Globe className="w-4 h-4 text-primary/50 shrink-0" />
              <h3 className="font-mono font-medium text-sm truncate text-white group-hover:text-primary transition-colors">
                {scan.url.replace(/^https?:\/\//, "")}
              </h3>
            </div>
            <StatusBadge
              status={isRisky ? "vulnerable" : "secure"}
              label={isRisky ? "Risks Detected" : "Secure"}
              className="shrink-0 whitespace-nowrap"
            />
          </div>

          <div className="space-y-1.5 text-xs text-muted-foreground font-mono">
            {scan.targetIp && (
              <div className="flex items-center gap-2">
                <Activity className="w-3 h-3 text-primary/30" />
                <span data-testid={`text-ip-${scan.id}`}>{scan.targetIp}</span>
              </div>
            )}
            {scan.server && (
              <div className="flex items-center gap-2">
                <Server className="w-3 h-3 text-primary/30" />
                <span data-testid={`text-server-${scan.id}`}>{scan.server}</span>
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-primary/10 flex items-center justify-between text-[10px] text-muted-foreground font-mono">
          <span>
            {scan.createdAt
              ? formatDistanceToNow(new Date(scan.createdAt), { addSuffix: true })
              : "Just now"}
          </span>
          <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transform group-hover:translate-x-1 transition-all text-primary" />
        </div>
      </div>
    </Link>
  );
}
