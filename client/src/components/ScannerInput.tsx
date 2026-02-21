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
        <div className="absolute -inset-0.5 rounded-xl bg-primary/20 blur-sm opacity-0 group-hover:opacity-100 transition duration-500"></div>
        <div className="relative rounded-xl border border-primary/20 bg-black/30 backdrop-blur-sm overflow-hidden hover:border-primary/30 transition-colors">
          <div className="flex flex-col sm:flex-row sm:items-center">
            <div className="flex items-center flex-1 min-w-0">
              <div className="pl-3 sm:pl-4 text-primary/50 shrink-0">
                <Terminal className="w-4 h-4" />
              </div>
              <Input
                data-testid="input-url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Enter target URL..."
                className="h-12 sm:h-14 pl-3 pr-3 border-0 bg-transparent font-mono text-xs sm:text-sm text-primary focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/50"
              />
            </div>
            <div className="px-2 pb-2 sm:pb-0 sm:pr-2 sm:pl-0">
              <Button
                data-testid="button-analyze"
                type="submit"
                disabled={createScan.isPending}
                className="w-full sm:w-auto h-9 sm:h-10 px-4 sm:px-6 font-bold font-mono text-xs tracking-wider bg-primary text-primary-foreground shadow-[0_0_15px_rgba(0,255,0,0.3)] transition-all duration-300 uppercase rounded-lg"
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
      </div>

      <div className="flex justify-between mt-2 px-1 text-[9px] text-muted-foreground/50 font-mono tracking-widest uppercase">
        <span>SYS_READY</span>
        <span className="hidden sm:inline">SEC_LEVEL: MAX</span>
        <span>ENCRYPTED</span>
      </div>
    </form>
  );
}
