import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import * as dns from "dns/promises";

async function analyzeUrl(targetUrl: string) {
  const urlObj = new URL(targetUrl);

  let targetIp = null;
  try {
    const lookup = await dns.lookup(urlObj.hostname);
    targetIp = lookup.address;
  } catch (e) {
    console.error("DNS lookup failed", e);
  }

  const recommendations: string[] = [];
  let isScrapable = true;
  let ddosProtected = false;
  let headers: Record<string, string> = {};
  let server = "Unknown";

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(targetUrl, {
      method: "GET",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    response.headers.forEach((value, key) => {
      headers[key.toLowerCase()] = value;
    });

    try {
      const botResponse = await fetch(targetUrl, {
        method: "GET",
        headers: {
          "User-Agent":
            "Googlebot/2.1 (+http://www.google.com/bot.html)",
        },
        signal: AbortSignal.timeout(5000),
      });
      if (botResponse.status === 403 || botResponse.status === 429) {
        isScrapable = false;
      }
    } catch (e) {
      isScrapable = false;
    }

    const securityHeaders = [
      "x-cloudflare-status",
      "cf-ray",
      "x-akamai-transformed",
      "x-cdn",
      "x-sucuri-id",
      "x-amz-cf-id",
      "x-goog-generation",
    ];
    if (securityHeaders.some((h) => headers[h])) {
      ddosProtected = true;
    }

    try {
      const robotsRes = await fetch(`${urlObj.origin}/robots.txt`, {
        signal: AbortSignal.timeout(3000),
      });
      if (robotsRes.ok) {
        const text = await robotsRes.text();
        if (text.includes("Disallow: /")) {
          recommendations.push(
            "robots.txt detected with restrictive directives, though this is only a 'polite' request and doesn't stop malicious scrapers."
          );
        }
      }
    } catch (e) {}
  } catch (e) {
    console.error("Fetch failed", e);
    recommendations.push(
      "Ensure the site is reachable and has a valid SSL certificate."
    );
  }

  server = headers["server"] || "Unknown";
  const serverLower = server.toLowerCase();
  if (
    serverLower.includes("cloudflare") ||
    serverLower.includes("sucuri") ||
    serverLower.includes("imperva") ||
    serverLower.includes("akamai")
  ) {
    ddosProtected = true;
  }

  if (isScrapable) {
    recommendations.push(
      "CRITICAL: The site lacks technical scraping protection. It's recommended to implement TLS fingerprinting checks or a JS-based challenge (e.g., Turnstile)."
    );
  }

  if (!ddosProtected) {
    recommendations.push(
      `VULNERABILITY: Origin IP (${targetIp || "unknown"}) is directly reachable. Implement a proxy-based WAF to mitigate Layer 7 DDoS floods.`
    );
  }

  if (!headers["strict-transport-security"]) {
    recommendations.push(
      "RECOMMENDATION: Enable HSTS to prevent SSL stripping attacks."
    );
  }

  if (!headers["content-security-policy"]) {
    recommendations.push(
      "RECOMMENDATION: Define a CSP to prevent cross-site scripting (XSS) and data injection."
    );
  }

  if (!headers["x-content-type-options"]) {
    recommendations.push(
      "RECOMMENDATION: Add 'X-Content-Type-Options: nosniff' to prevent MIME-type sniffing."
    );
  }

  if (!headers["x-frame-options"]) {
    recommendations.push(
      "RECOMMENDATION: Add 'X-Frame-Options: DENY' or 'SAMEORIGIN' to prevent clickjacking."
    );
  }

  if (!headers["referrer-policy"]) {
    recommendations.push(
      "RECOMMENDATION: Set a 'Referrer-Policy' (e.g., 'strict-origin-when-cross-origin') to control how much referrer information is shared."
    );
  }

  if (!headers["permissions-policy"]) {
    recommendations.push(
      "RECOMMENDATION: Implement a 'Permissions-Policy' to restrict browser features like camera, microphone, or geolocation."
    );
  }

  return {
    url: targetUrl,
    targetIp,
    server,
    isScrapable,
    ddosProtected,
    headers,
    recommendations,
  };
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  app.get(api.scans.list.path, async (req, res) => {
    try {
      const scansList = await storage.getScans();
      res.json(scansList);
    } catch (err) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get(api.scans.get.path, async (req, res) => {
    try {
      const scan = await storage.getScan(Number(req.params.id));
      if (!scan) {
        return res.status(404).json({ message: "Scan not found" });
      }
      res.json(scan);
    } catch (err) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post(api.scans.create.path, async (req, res) => {
    try {
      const input = api.scans.create.input.parse(req.body);
      const analysisData = await analyzeUrl(input.url);
      const scan = await storage.createScan(analysisData);
      res.status(201).json(scan);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join("."),
        });
      }
      res.status(500).json({ message: "Failed to perform scan" });
    }
  });

  return httpServer;
}
