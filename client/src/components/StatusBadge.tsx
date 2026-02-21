import { ShieldCheck, ShieldAlert, AlertTriangle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: "secure" | "vulnerable" | "warning" | "info";
  label: string;
  className?: string;
  showIcon?: boolean;
}

export function StatusBadge({ status, label, className, showIcon = true }: StatusBadgeProps) {
  const variants = {
    secure: "bg-primary/10 text-primary border-primary/30",
    vulnerable: "bg-destructive/10 text-destructive border-destructive/30",
    warning: "bg-yellow-500/10 text-yellow-500 border-yellow-500/30",
    info: "bg-blue-500/10 text-blue-500 border-blue-500/30",
  };

  const icons = {
    secure: ShieldCheck,
    vulnerable: ShieldAlert,
    warning: AlertTriangle,
    info: CheckCircle2,
  };

  const Icon = icons[status];

  return (
    <div
      data-testid={`badge-status-${status}`}
      className={cn(
        "inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold font-mono border transition-colors tracking-wider uppercase",
        variants[status],
        className
      )}
    >
      {showIcon && <Icon className="w-3 h-3 mr-1.5" />}
      {label}
    </div>
  );
}
