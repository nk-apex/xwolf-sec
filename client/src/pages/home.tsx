import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Server,
  Shield,
  Zap,
  Globe,
  Clock,
  Headphones,
  Rocket,
  ChevronRight,
  Check,
  Cpu,
  HardDrive,
  Users,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";
import { motion } from "framer-motion";

const regions = [
  { code: "CI", name: "Cote d'Ivoire", currency: "CFA Franc", symbol: "CFA" },
  { code: "ET", name: "Ethiopia", currency: "Ethiopian Birr", symbol: "Br" },
  { code: "GH", name: "Ghana", currency: "Ghanaian Cedi", symbol: "GH\u20B5" },
  { code: "IN", name: "India", currency: "Indian Rupee", symbol: "\u20B9" },
  { code: "KE", name: "Kenya", currency: "Kenyan Shilling", symbol: "KSh" },
  { code: "NG", name: "Nigeria", currency: "Nigerian Naira", symbol: "\u20A6" },
  { code: "RW", name: "Rwanda", currency: "Rwandan Franc", symbol: "RF" },
  { code: "ZA", name: "South Africa", currency: "South African Rand", symbol: "R" },
  { code: "TZ", name: "Tanzania", currency: "Tanzanian Shilling", symbol: "TSh" },
  { code: "UG", name: "Uganda", currency: "Ugandan Shilling", symbol: "USh" },
  { code: "ZW", name: "Zimbabwe", currency: "US Dollar", symbol: "$" },
];

const pricingByRegion: Record<string, { limited: number; unlimited: number; admin: number }> = {
  CI: { limited: 300, unlimited: 600, admin: 1500 },
  ET: { limited: 30, unlimited: 60, admin: 150 },
  GH: { limited: 8, unlimited: 16, admin: 40 },
  IN: { limited: 50, unlimited: 100, admin: 250 },
  KE: { limited: 50, unlimited: 100, admin: 250 },
  NG: { limited: 500, unlimited: 1000, admin: 2500 },
  RW: { limited: 600, unlimited: 1200, admin: 3000 },
  ZA: { limited: 10, unlimited: 20, admin: 50 },
  TZ: { limited: 1200, unlimited: 2400, admin: 6000 },
  UG: { limited: 1800, unlimited: 3600, admin: 9000 },
  ZW: { limited: 1, unlimited: 2, admin: 5 },
};

const stats = [
  { value: "99.99%", label: "Uptime SLA", icon: Server },
  { value: "24/7", label: "Support", icon: Headphones },
  { value: "60s", label: "Deployment", icon: Clock },
  { value: "15+", label: "Locations", icon: Globe },
];

const features = [
  {
    icon: Zap,
    title: "Hyper-Speed Servers",
    description: "Dedicated NVMe cores with 99.99% uptime guarantee.",
  },
  {
    icon: Shield,
    title: "Ironclad Security",
    description: "DDoS protection and automated daily backups included.",
  },
  {
    icon: Rocket,
    title: "Instant Payments",
    description: "Seamless deposits via M-Pesa STK Push.",
  },
];

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15 },
  },
};

export default function Home() {
  const [selectedRegion, setSelectedRegion] = useState("KE");
  const region = regions.find((r) => r.code === selectedRegion) || regions[4];
  const prices = pricingByRegion[selectedRegion] || pricingByRegion.KE;

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4 h-16">
            <Link href="/">
              <span className="text-xl font-bold tracking-tight" data-testid="link-home">
                <span className="text-primary">WOLF</span>
                <span className="text-foreground">HOST</span>
              </span>
            </Link>
            <div className="flex items-center gap-3 flex-wrap">
              <Link href="/register">
                <Button data-testid="button-deploy-nav">Deploy Now</Button>
              </Link>
              <Link href="/login">
                <Button variant="outline" data-testid="button-login-nav">Client Area</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 overflow-visible">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/3 rounded-full blur-[100px]" />
        </div>

        <div className="relative max-w-7xl mx-auto text-center">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
          >
            <motion.h1
              variants={fadeInUp}
              className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight mb-6"
              data-testid="text-hero-title"
            >
              POWER YOUR{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-emerald-300">
                DIGITAL EMPIRE
              </span>
            </motion.h1>

            <motion.p
              variants={fadeInUp}
              className="text-muted-foreground text-sm mb-4 italic"
            >
              I am just an explorer - Silent Wolf
            </motion.p>

            <motion.p
              variants={fadeInUp}
              className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-8"
              data-testid="text-hero-subtitle"
            >
              Premium hosting infrastructure for the next generation. Deploy
              servers in seconds. Pay with crypto or mobile money.
            </motion.p>

            <motion.div
              variants={fadeInUp}
              className="flex items-center justify-center gap-4 flex-wrap"
            >
              <Link href="/register">
                <Button size="lg" className="gap-2 text-base" data-testid="button-deploy-hero">
                  Deploy Now
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline" className="gap-2 text-base" data-testid="button-client-hero">
                  Client Area
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Region Selector */}
      <section className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <Select value={selectedRegion} onValueChange={setSelectedRegion}>
              <SelectTrigger className="w-full bg-card border-border" data-testid="select-region">
                <SelectValue placeholder="Select your region" />
              </SelectTrigger>
              <SelectContent>
                {regions.map((r) => (
                  <SelectItem key={r.code} value={r.code} data-testid={`option-region-${r.code}`}>
                    {r.code} - {r.name} — {r.currency} ({r.symbol})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </motion.div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8" id="pricing">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8"
          >
            {/* Limited Plan */}
            <motion.div variants={fadeInUp}>
              <Card className="relative border-border/50 bg-card/50 backdrop-blur-sm h-full">
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl" data-testid="text-plan-limited">Limited</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Perfect for getting started
                  </p>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <span className="text-3xl font-bold" data-testid="text-price-limited">
                      {region.symbol} {prices.limited.toFixed(2)}
                    </span>
                    <span className="text-muted-foreground">/server</span>
                  </div>
                  <ul className="space-y-3">
                    {[
                      { icon: HardDrive, text: "5GB RAM" },
                      { icon: HardDrive, text: "10GB Storage" },
                      { icon: Cpu, text: "1 vCPU" },
                      { icon: Users, text: "10 Slots" },
                      { icon: Shield, text: "Basic DDoS Protection" },
                      { icon: Headphones, text: "Community Support" },
                    ].map((item) => (
                      <li key={item.text} className="flex items-center gap-3">
                        <Check className="w-4 h-4 text-primary flex-shrink-0" />
                        <span className="text-sm text-muted-foreground">{item.text}</span>
                      </li>
                    ))}
                  </ul>
                  <Link href="/register">
                    <Button variant="outline" className="w-full" data-testid="button-get-started-limited">
                      Get Started
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>

            {/* Unlimited Plan */}
            <motion.div variants={fadeInUp}>
              <Card className="relative border-primary/30 bg-card/50 backdrop-blur-sm h-full ring-1 ring-primary/20">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground px-4">
                    POPULAR
                  </Badge>
                </div>
                <CardHeader className="pb-4 pt-8">
                  <CardTitle className="text-xl" data-testid="text-plan-unlimited">Unlimited</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Best value for growing projects
                  </p>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <span className="text-3xl font-bold text-primary" data-testid="text-price-unlimited">
                      {region.symbol} {prices.unlimited.toFixed(2)}
                    </span>
                    <span className="text-muted-foreground">/server</span>
                  </div>
                  <ul className="space-y-3">
                    {[
                      { icon: HardDrive, text: "Unlimited RAM" },
                      { icon: HardDrive, text: "40GB Storage" },
                      { icon: Cpu, text: "2 vCPU" },
                      { icon: Users, text: "Unlimited Slots" },
                      { icon: ShieldCheck, text: "Advanced DDoS Protection" },
                      { icon: Headphones, text: "Priority Support" },
                    ].map((item) => (
                      <li key={item.text} className="flex items-center gap-3">
                        <Check className="w-4 h-4 text-primary flex-shrink-0" />
                        <span className="text-sm text-muted-foreground">{item.text}</span>
                      </li>
                    ))}
                  </ul>
                  <Link href="/register">
                    <Button className="w-full" data-testid="button-get-started-unlimited">
                      Get Started
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>

            {/* Admin Plan */}
            <motion.div variants={fadeInUp}>
              <Card className="relative border-border/50 bg-card/50 backdrop-blur-sm h-full">
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl" data-testid="text-plan-admin">Admin</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Full power and control
                  </p>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <span className="text-3xl font-bold" data-testid="text-price-admin">
                      {region.symbol} {prices.admin.toFixed(2)}
                    </span>
                    <span className="text-muted-foreground">/server</span>
                  </div>
                  <ul className="space-y-3">
                    {[
                      { icon: HardDrive, text: "Unlimited RAM" },
                      { icon: HardDrive, text: "80GB Storage" },
                      { icon: Cpu, text: "4 vCPU" },
                      { icon: Users, text: "Unlimited Slots" },
                      { icon: ShieldCheck, text: "Full DDoS Protection" },
                      { icon: Headphones, text: "24/7 Support" },
                    ].map((item) => (
                      <li key={item.text} className="flex items-center gap-3">
                        <Check className="w-4 h-4 text-primary flex-shrink-0" />
                        <span className="text-sm text-muted-foreground">{item.text}</span>
                      </li>
                    ))}
                  </ul>
                  <Link href="/register">
                    <Button variant="outline" className="w-full" data-testid="button-get-started-admin">
                      Get Started
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 border-y border-border/30">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid grid-cols-2 md:grid-cols-4 gap-8"
          >
            {stats.map((stat) => (
              <motion.div
                key={stat.label}
                variants={fadeInUp}
                className="text-center"
              >
                <stat.icon className="w-8 h-8 text-primary mx-auto mb-3" />
                <div className="text-3xl sm:text-4xl font-bold mb-1" data-testid={`text-stat-${stat.label.toLowerCase().replace(/\s/g, "-")}`}>
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Control Panel Badge */}
      <section className="py-4 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <Badge variant="outline" className="text-primary border-primary/30 px-4 py-1">
            WolfHost Control Panel
          </Badge>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="text-center mb-12"
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-4" data-testid="text-features-title">
              Enterprise-Grade Infrastructure
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Built with cutting-edge technology for maximum performance and
              reliability
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8"
          >
            {features.map((feature) => (
              <motion.div key={feature.title} variants={fadeInUp}>
                <Card className="bg-card/30 border-border/40 backdrop-blur-sm h-full group">
                  <CardContent className="p-6 space-y-4">
                    <div className="w-12 h-12 rounded-md bg-primary/10 flex items-center justify-center">
                      <feature.icon className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold" data-testid={`text-feature-${feature.title.toLowerCase().replace(/\s/g, "-")}`}>
                      {feature.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {feature.description}
                    </p>
                    <button className="text-sm text-primary flex items-center gap-1 group-hover:gap-2 transition-all">
                      Learn more
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
          >
            <Card className="bg-gradient-to-br from-primary/10 via-card to-primary/5 border-primary/20 backdrop-blur-sm">
              <CardContent className="p-8 sm:p-12 text-center space-y-6">
                <h2 className="text-2xl sm:text-3xl font-bold" data-testid="text-cta-title">
                  Ready to Deploy Your Infrastructure?
                </h2>
                <p className="text-muted-foreground max-w-xl mx-auto">
                  Join thousands of developers and businesses who trust WolfHost
                  for their hosting needs.
                </p>
                <Link href="/register">
                  <Button size="lg" className="gap-2" data-testid="button-cta-start">
                    Start Your Journey
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/30 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} WolfHost. All rights reserved.
          </span>
          <div className="flex items-center gap-6">
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Terms of Service
            </a>
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Privacy Policy
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
