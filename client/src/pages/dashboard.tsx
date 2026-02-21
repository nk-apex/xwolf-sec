import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Server,
  Plus,
  LogOut,
  Shield,
  Cpu,
  HardDrive,
  Activity,
} from "lucide-react";
import { motion } from "framer-motion";

export default function Dashboard() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const { data: user, isLoading } = useQuery<{
    id: string;
    email: string;
    username: string;
    country: string;
  }>({
    queryKey: ["/api/auth/me"],
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/auth/logout");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      toast({ title: "Signed out", description: "You have been signed out successfully." });
      setLocation("/login");
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-3">
          <Activity className="w-5 h-5 text-primary animate-pulse" />
          <span className="text-muted-foreground">Loading...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    setLocation("/login");
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border/40 bg-card/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4 h-16">
            <Link href="/">
              <span className="text-xl font-bold tracking-tight cursor-pointer">
                <span className="text-primary">WOLF</span>
                <span className="text-foreground">HOST</span>
              </span>
            </Link>
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-sm text-muted-foreground hidden sm:inline">
                Welcome, <span className="text-foreground font-medium">{user.username}</span>
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => logoutMutation.mutate()}
                className="gap-2"
                data-testid="button-logout"
              >
                <LogOut className="w-3 h-3" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="flex items-center justify-between gap-4 mb-8 flex-wrap">
            <div>
              <h1 className="text-2xl font-bold" data-testid="text-dashboard-title">Dashboard</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Manage your servers and infrastructure
              </p>
            </div>
            <Button className="gap-2" data-testid="button-deploy-server">
              <Plus className="w-4 h-4" />
              Deploy Server
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[
              { label: "Active Servers", value: "0", icon: Server },
              { label: "CPU Usage", value: "0%", icon: Cpu },
              { label: "Storage Used", value: "0 GB", icon: HardDrive },
              { label: "DDoS Blocked", value: "0", icon: Shield },
            ].map((stat) => (
              <Card key={stat.label} className="bg-card/50 border-border/40">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-sm text-muted-foreground">{stat.label}</span>
                    <stat.icon className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="text-2xl font-bold">{stat.value}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="bg-card/30 border-border/40">
            <CardHeader>
              <CardTitle className="text-lg">Your Servers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Server className="w-12 h-12 text-muted-foreground/40 mb-4" />
                <h3 className="text-lg font-medium mb-2">No servers yet</h3>
                <p className="text-sm text-muted-foreground mb-6 max-w-sm">
                  Deploy your first server to get started with WolfHost premium infrastructure.
                </p>
                <Button className="gap-2" data-testid="button-deploy-first">
                  <Plus className="w-4 h-4" />
                  Deploy Your First Server
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  );
}
