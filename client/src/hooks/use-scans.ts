import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type ScanInput } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";

export function useScans() {
  return useQuery({
    queryKey: [api.scans.list.path],
    queryFn: async () => {
      const res = await fetch(api.scans.list.path);
      if (!res.ok) throw new Error("Failed to fetch scans history");
      return api.scans.list.responses[200].parse(await res.json());
    },
    refetchInterval: 5000,
  });
}

export function useScan(id: number) {
  return useQuery({
    queryKey: [api.scans.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.scans.get.path, { id });
      const res = await fetch(url);
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch scan details");
      return api.scans.get.responses[200].parse(await res.json());
    },
    enabled: !!id,
  });
}

export function useCreateScan() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: ScanInput) => {
      const res = await fetch(api.scans.create.path, {
        method: api.scans.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        if (res.status === 400) {
          const error = api.scans.create.responses[400].parse(await res.json());
          throw new Error(error.message);
        }
        throw new Error("Failed to start scan");
      }

      return api.scans.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.scans.list.path] });
      toast({
        title: "Scan Initiated",
        description: "Target analysis has started successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Scan Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
