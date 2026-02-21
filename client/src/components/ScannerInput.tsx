import { useState } from "react";
import { useCreateScan } from "@/hooks/use-scans";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Loader2, Terminal } from "lucide-react";
import { useLocation } from "wouter";

export function ScannerInput() {
  const [url, setUrl] = useState("https://host.xwolf.space");
  const createScan = useCreateScan();
  const [, setLocation] = useLocation();

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;

    try {
      const result = await createScan.mutateAsync({ url });
      setLocation(`/scans/${result.id}`);
    } catch (error) {
      console.error("Scan failed to start", error);
    }
  };

  return (
    <form onSubmit={handleScan} data-testid="form-scanner" className="relative w-full max-w-2xl mx-auto">
      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-primary/30 via-primary/10 to-primary/30 rounded-lg blur opacity-40 group-hover:opacity-80 transition duration-500"></div>
        <div className="relative flex shadow-xl">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/50">
            <Terminal className="w-4 h-4" />
          </div>
          <Input
            data-testid="input-url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Enter target URL (e.g. https://example.com)"
            className="h-14 pl-10 pr-32 bg-background/80 border-border/50 rounded-lg font-mono text-sm text-primary focus-visible:ring-1 focus-visible:ring-primary/50 placeholder:text-muted-foreground/50"
          />
          <div className="absolute right-2 top-2 bottom-2">
            <Button
              data-testid="button-analyze"
              type="submit"
              disabled={createScan.isPending}
              className="h-full px-6 font-bold font-mono text-xs tracking-wider bg-primary text-primary-foreground shadow-[0_0_15px_rgba(0,255,0,0.3)] transition-all duration-300 uppercase"
            >
              {createScan.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Scanning
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  Analyze
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      <div className="flex justify-between mt-2 px-1 text-[9px] text-muted-foreground/50 font-mono tracking-widest uppercase">
        <span>SYS_READY</span>
        <span>SEC_LEVEL: MAX</span>
        <span>ENCRYPTED</span>
      </div>
    </form>
  );
}
