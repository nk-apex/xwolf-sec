import { useState } from "react";
import { useCreateScan } from "@/hooks/use-scans";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Loader2 } from "lucide-react";
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
        <div className="absolute -inset-1 bg-gradient-to-r from-primary/50 to-blue-600/50 rounded-lg blur opacity-25 group-hover:opacity-75 transition duration-500"></div>
        <div className="relative flex shadow-xl">
          <Input
            data-testid="input-url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Enter target URL (e.g. https://example.com)"
            className="h-14 pl-6 pr-32 bg-background border-border/50 rounded-lg font-mono text-lg focus-visible:ring-1 focus-visible:ring-primary/50"
          />
          <div className="absolute right-2 top-2 bottom-2">
            <Button
              data-testid="button-analyze"
              type="submit"
              disabled={createScan.isPending}
              className="h-full px-6 font-semibold bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_20px_rgba(34,197,94,0.3)] hover:shadow-[0_0_30px_rgba(34,197,94,0.5)] transition-all duration-300"
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

      <div className="flex justify-between mt-2 px-1 text-[10px] text-muted-foreground font-mono opacity-50">
        <span>SYSTEM_READY</span>
        <span>SEC_LEVEL: MAX</span>
        <span>ENCRYPTION: ON</span>
      </div>
    </form>
  );
}
