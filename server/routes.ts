import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import * as dns from "dns/promises";
import type { Finding, SeverityLevel } from "@shared/schema";

function finding(severity: SeverityLevel, category: string, title: string, detail: string): Finding {
  return { severity, category, title, detail };
}

async function analyzeUrl(targetUrl: string) {
  let urlObj: URL;
  try {
    urlObj = new URL(targetUrl);
  } catch {
    throw new Error("Invalid URL format. Please enter a valid URL like https://example.com");
  }

  if (!["http:", "https:"].includes(urlObj.protocol)) {
    throw new Error("Only HTTP and HTTPS URLs are supported.");
  }

  let targetIp: string | null = null;
  try {
    const lookup = await dns.lookup(urlObj.hostname);
    targetIp = lookup.address;
  } catch (e) {
    throw new Error(`The website "${urlObj.hostname}" does not exist or cannot be resolved. DNS lookup failed — please check the URL and try again.`);
  }

  const findings: Finding[] = [];
  const recommendations: string[] = [];
  let isScrapable = true;
  let ddosProtected = false;
  let headers: Record<string, string> = {};
  let server = "Unknown";
  let responseStatus = 0;
  let responseBody = "";

  // ──────────────────────────────────────
  // 1. PRIMARY FETCH (browser-like)
  // ──────────────────────────────────────
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    const response = await fetch(targetUrl, {
      method: "GET",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    responseStatus = response.status;

    response.headers.forEach((value, key) => {
      headers[key.toLowerCase()] = value;
    });

    try {
      responseBody = await response.text();
    } catch {}

    // ──────────────────────────────────────
    // 2. BOT / SCRAPING DETECTION
    // ──────────────────────────────────────
    const botAgents = [
      { name: "Googlebot", ua: "Googlebot/2.1 (+http://www.google.com/bot.html)" },
      { name: "Python-requests", ua: "python-requests/2.31.0" },
      { name: "curl", ua: "curl/8.4.0" },
      { name: "Scrapy", ua: "Scrapy/2.11 (+https://scrapy.org)" },
    ];

    let blockedCount = 0;
    const testedAgents: string[] = [];
    const passedAgents: string[] = [];

    for (const bot of botAgents) {
      try {
        const botRes = await fetch(targetUrl, {
          method: "GET",
          headers: { "User-Agent": bot.ua },
          signal: AbortSignal.timeout(5000),
        });
        testedAgents.push(bot.name);
        if (botRes.status === 403 || botRes.status === 429 || botRes.status === 503) {
          blockedCount++;
        } else {
          passedAgents.push(bot.name);
        }
      } catch (e) {
        blockedCount++;
      }
    }

    if (blockedCount === botAgents.length) {
      isScrapable = false;
    } else if (blockedCount > 0) {
      isScrapable = true;
      findings.push(finding("MEDIUM", "Bot Protection", "Partial bot blocking detected",
        `Only ${blockedCount}/${botAgents.length} known bot user-agents were blocked. Agents that passed: ${passedAgents.join(", ")}. Sophisticated scrapers can bypass user-agent based blocking by spoofing headers.`));
    }

    // ──────────────────────────────────────
    // 3. CDN / WAF / DDoS DETECTION
    // ──────────────────────────────────────
    const cdnHeaders = [
      { header: "cf-ray", provider: "Cloudflare" },
      { header: "x-cloudflare-status", provider: "Cloudflare" },
      { header: "cf-cache-status", provider: "Cloudflare" },
      { header: "x-akamai-transformed", provider: "Akamai" },
      { header: "x-cdn", provider: "Generic CDN" },
      { header: "x-sucuri-id", provider: "Sucuri WAF" },
      { header: "x-sucuri-cache", provider: "Sucuri WAF" },
      { header: "x-amz-cf-id", provider: "AWS CloudFront" },
      { header: "x-amz-cf-pop", provider: "AWS CloudFront" },
      { header: "x-goog-generation", provider: "Google Cloud CDN" },
      { header: "x-fastly-request-id", provider: "Fastly" },
      { header: "x-served-by", provider: "Fastly/Varnish" },
      { header: "x-vercel-id", provider: "Vercel Edge" },
      { header: "x-nf-request-id", provider: "Netlify" },
    ];

    const detectedProviders: string[] = [];
    for (const check of cdnHeaders) {
      if (headers[check.header]) {
        ddosProtected = true;
        if (!detectedProviders.includes(check.provider)) {
          detectedProviders.push(check.provider);
        }
      }
    }

    const serverLower = (headers["server"] || "").toLowerCase();
    const wafServers = ["cloudflare", "sucuri", "imperva", "akamai", "fastly", "ddos-guard", "stackpath"];
    for (const waf of wafServers) {
      if (serverLower.includes(waf)) {
        ddosProtected = true;
        const provName = waf.charAt(0).toUpperCase() + waf.slice(1);
        if (!detectedProviders.includes(provName)) {
          detectedProviders.push(provName);
        }
      }
    }

    // ──────────────────────────────────────
    // 4. robots.txt ANALYSIS
    // ──────────────────────────────────────
    try {
      const robotsRes = await fetch(`${urlObj.origin}/robots.txt`, { signal: AbortSignal.timeout(3000) });
      if (robotsRes.ok) {
        const robotsText = await robotsRes.text();
        if (!robotsText.includes("<!DOCTYPE") && !robotsText.includes("Cannot GET")) {
          const hasDisallow = robotsText.includes("Disallow: /");
          const allowsAll = robotsText.includes("Allow: /");
          if (hasDisallow) {
            findings.push(finding("LOW", "Crawl Policy", "robots.txt has restrictive directives",
              "robots.txt contains Disallow rules, but this is only advisory. Malicious bots ignore robots.txt entirely. It should not be relied on for security."));
          } else if (allowsAll) {
            findings.push(finding("INFO", "Crawl Policy", "robots.txt allows all crawling",
              "robots.txt explicitly allows all user-agents to crawl every path. This is expected for public sites but means no crawl restrictions are in place."));
          }
        }
      } else {
        findings.push(finding("INFO", "Crawl Policy", "No robots.txt found",
          "The server returned an error for /robots.txt. While not a vulnerability, having one provides basic crawl control directives."));
      }
    } catch {}

    // ──────────────────────────────────────
    // 5. HTTP METHOD ENUMERATION
    // ──────────────────────────────────────
    const dangerousMethods: string[] = [];

    // Only check via OPTIONS Allow header (reliable signal) and TRACE echo test
    try {
      const optRes = await fetch(targetUrl, { method: "OPTIONS", signal: AbortSignal.timeout(3000) });
      const allow = optRes.headers.get("allow") || optRes.headers.get("access-control-allow-methods") || "";
      if (allow) {
        const allowedMethods = allow.split(",").map(m => m.trim().toUpperCase());
        for (const m of ["PUT", "DELETE", "TRACE", "PATCH"]) {
          if (allowedMethods.includes(m)) dangerousMethods.push(m);
        }
      }
    } catch {}

    // Verify TRACE separately — only flag if server echoes back the request (true TRACE behavior)
    try {
      const traceRes = await fetch(targetUrl, { method: "TRACE", signal: AbortSignal.timeout(3000) });
      if (traceRes.ok) {
        const traceBody = await traceRes.text();
        if (traceBody.includes("TRACE") && traceBody.includes(urlObj.hostname)) {
          if (!dangerousMethods.includes("TRACE")) dangerousMethods.push("TRACE");
        }
      }
    } catch {}

    if (dangerousMethods.length > 0) {
      const unique = [...new Set(dangerousMethods)];
      const hasTrace = unique.includes("TRACE");
      findings.push(finding(
        hasTrace ? "HIGH" : "MEDIUM",
        "HTTP Methods",
        `Server advertises dangerous HTTP methods: ${unique.join(", ")}`,
        `The server's Allow header lists ${unique.join(", ")} as accepted methods.${hasTrace ? " TRACE is confirmed active and echoes requests back, enabling Cross-Site Tracing (XST) attacks that can steal credentials." : ""} PUT/DELETE/PATCH should be restricted to authenticated API routes only — verify these are not accessible on public endpoints.`
      ));
    }

    // ──────────────────────────────────────
    // 6. CORS ANALYSIS
    // ──────────────────────────────────────
    try {
      const corsRes = await fetch(targetUrl, {
        method: "GET",
        headers: {
          "User-Agent": "Mozilla/5.0",
          "Origin": "https://evil-attacker.com",
        },
        signal: AbortSignal.timeout(5000),
      });

      const acao = corsRes.headers.get("access-control-allow-origin");
      const acac = corsRes.headers.get("access-control-allow-credentials");

      if (acao === "*") {
        if (acac === "true") {
          findings.push(finding("CRITICAL", "CORS", "Wildcard CORS with credentials allowed",
            "The server returns 'Access-Control-Allow-Origin: *' combined with 'Access-Control-Allow-Credentials: true'. This is a dangerous misconfiguration that allows any website to make authenticated requests to this origin and read the responses, potentially stealing user data."));
        } else {
          findings.push(finding("LOW", "CORS", "Wildcard CORS origin configured",
            "The server returns 'Access-Control-Allow-Origin: *'. This allows any website to read responses from this API. If this endpoint serves sensitive data, restrict the origin to trusted domains."));
        }
      } else if (acao === "https://evil-attacker.com") {
        findings.push(finding("HIGH", "CORS", "CORS reflects arbitrary origins",
          "The server reflects the requesting Origin header back in 'Access-Control-Allow-Origin'. This means ANY website can make cross-origin requests and read responses, effectively bypassing the Same-Origin Policy. This is a serious misconfiguration."));
      }
    } catch {}

    // ──────────────────────────────────────
    // 7. COOKIE SECURITY
    // ──────────────────────────────────────
    const setCookieHeaders = response.headers.getSetCookie?.() || [];
    const setCookieRaw = headers["set-cookie"];
    const cookies = setCookieHeaders.length > 0
      ? setCookieHeaders
      : setCookieRaw ? [setCookieRaw] : [];

    for (const cookie of cookies) {
      const cookieName = cookie.split("=")[0]?.trim() || "unknown";
      const issues: string[] = [];
      const lc = cookie.toLowerCase();

      if (!lc.includes("httponly")) issues.push("missing HttpOnly flag (accessible to JavaScript / XSS)");
      if (!lc.includes("secure")) issues.push("missing Secure flag (sent over plain HTTP)");
      if (!lc.includes("samesite")) issues.push("missing SameSite attribute (vulnerable to CSRF)");

      if (issues.length > 0) {
        findings.push(finding("MEDIUM", "Cookie Security", `Cookie '${cookieName}' has insecure attributes`,
          `Issues: ${issues.join("; ")}. Cookies without proper security attributes are vulnerable to session hijacking, XSS-based theft, and cross-site request forgery.`));
      }
    }

    // ──────────────────────────────────────
    // 8. INFORMATION LEAKAGE
    // ──────────────────────────────────────
    const xPoweredBy = headers["x-powered-by"];
    if (xPoweredBy) {
      findings.push(finding("MEDIUM", "Information Leakage", `X-Powered-By header exposes technology: ${xPoweredBy}`,
        `The server reveals its backend framework (${xPoweredBy}) via the X-Powered-By header. This helps attackers identify known vulnerabilities specific to this technology stack. Remove this header in production.`));
    }

    const serverHeader = headers["server"];
    if (serverHeader) {
      const versionMatch = serverHeader.match(/[\d]+\.[\d]+/);
      if (versionMatch) {
        findings.push(finding("MEDIUM", "Information Leakage", `Server header leaks version: ${serverHeader}`,
          `The Server header reveals the exact software version (${serverHeader}). Attackers can look up known CVEs for this version. Use a generic server name or remove the header entirely.`));
      }
    }

    const xAspNet = headers["x-aspnet-version"] || headers["x-aspnetmvc-version"];
    if (xAspNet) {
      findings.push(finding("MEDIUM", "Information Leakage", `ASP.NET version exposed: ${xAspNet}`,
        "The server reveals its ASP.NET framework version. Remove X-AspNet-Version and X-AspNetMvc-Version headers in production."));
    }

    // Check for debug/error info in HTML
    if (responseBody) {
      const leakPatterns = [
        { pattern: /stack\s*trace/i, label: "Stack trace detected in response body" },
        { pattern: /SQL\s*syntax.*error/i, label: "SQL error message found in response body" },
        { pattern: /SQLSTATE/i, label: "Database error (SQLSTATE) found in response" },
        { pattern: /Warning:.*on line \d+/i, label: "PHP warning with file path disclosed" },
        { pattern: /\/home\/\w+\/|\/var\/www\//i, label: "Server file paths disclosed in response" },
        { pattern: /<!--.*(?:TODO|FIXME|HACK|password|secret|api[_-]?key)/i, label: "Sensitive comments found in HTML source" },
      ];
      for (const lp of leakPatterns) {
        if (lp.pattern.test(responseBody)) {
          findings.push(finding("HIGH", "Information Leakage", lp.label,
            "The response body contains sensitive debug or error information that should never be exposed in production. This helps attackers understand your internal architecture and find exploitable weaknesses."));
        }
      }
    }

    // ──────────────────────────────────────
    // 9. SSL/TLS CHECKS (via headers heuristics)
    // ──────────────────────────────────────
    if (urlObj.protocol === "https:") {
      // Test HTTP->HTTPS redirect
      try {
        const httpUrl = targetUrl.replace("https://", "http://");
        const httpRes = await fetch(httpUrl, {
          method: "HEAD",
          redirect: "manual",
          signal: AbortSignal.timeout(5000),
        });
        if (httpRes.status >= 300 && httpRes.status < 400) {
          const location = httpRes.headers.get("location") || "";
          if (location.startsWith("https://")) {
            findings.push(finding("INFO", "SSL/TLS", "HTTP to HTTPS redirect is active",
              `HTTP requests are redirected to HTTPS (${httpRes.status}). Good practice, but without HSTS the first request is still vulnerable to interception.`));
          }
        } else if (httpRes.status === 200) {
          findings.push(finding("HIGH", "SSL/TLS", "Site accessible over plain HTTP without redirect",
            "The site serves content over unencrypted HTTP without redirecting to HTTPS. An attacker on the network can intercept, read, and modify all traffic (passwords, session tokens, personal data)."));
        }
      } catch {}
    }

    // ──────────────────────────────────────
    // 10. DNS INFRASTRUCTURE ANALYSIS
    // ──────────────────────────────────────
    const baseDomain = urlObj.hostname.split(".").slice(-2).join(".");

    // Check if DNS uses Cloudflare but proxy is off
    try {
      const nsRecords = await dns.resolveNs(baseDomain);
      const usesCloudflareNs = nsRecords.some(ns => ns.includes("cloudflare"));
      if (usesCloudflareNs && !ddosProtected) {
        findings.push(finding("HIGH", "DNS / Network", "Cloudflare DNS detected but proxy is DISABLED",
          `The domain uses Cloudflare nameservers (${nsRecords.join(", ")}) but Cloudflare's proxy/WAF is not active. The origin server IP (${targetIp}) is directly exposed. Enable Cloudflare's orange-cloud proxy to hide the origin IP and enable DDoS protection.`));
      }
    } catch {}

    // Check for DNSSEC
    try {
      const txtRecords = await dns.resolveTxt(`_dmarc.${baseDomain}`);
      if (txtRecords.length === 0) {
        findings.push(finding("LOW", "DNS / Email", "No DMARC record found",
          `No DMARC TXT record at _dmarc.${baseDomain}. Without DMARC, attackers can spoof emails from your domain for phishing campaigns.`));
      }
    } catch {
      findings.push(finding("LOW", "DNS / Email", "No DMARC record found",
        `No DMARC TXT record at _dmarc.${baseDomain}. Without DMARC, attackers can spoof emails from your domain for phishing campaigns.`));
    }

    try {
      const spfRecords = await dns.resolveTxt(baseDomain);
      const hasSpf = spfRecords.some(r => r.join("").includes("v=spf1"));
      if (!hasSpf) {
        findings.push(finding("LOW", "DNS / Email", "No SPF record found",
          `No SPF TXT record for ${baseDomain}. Without SPF, anyone can send emails pretending to be from your domain.`));
      }
    } catch {}

    // ──────────────────────────────────────
    // 11. RATE LIMITING CHECK
    // ──────────────────────────────────────
    try {
      let rateLimited = false;
      for (let i = 0; i < 10; i++) {
        const rlRes = await fetch(targetUrl, {
          method: "HEAD",
          headers: { "User-Agent": "Mozilla/5.0" },
          signal: AbortSignal.timeout(2000),
        });
        if (rlRes.status === 429 || rlRes.status === 503) {
          rateLimited = true;
          break;
        }
      }
      if (!rateLimited) {
        findings.push(finding("MEDIUM", "Rate Limiting", "No rate limiting detected",
          "Sending 10 rapid requests did not trigger any rate limiting (no 429 responses). This means the server is vulnerable to brute-force attacks, credential stuffing, and application-layer DDoS. Implement rate limiting on API endpoints and login routes."));
      }
    } catch {}

    // ──────────────────────────────────────
    // 12. OPEN REDIRECT CHECK
    // ──────────────────────────────────────
    try {
      const redirectPayloads = [
        `${urlObj.origin}/redirect?url=https://evil.com`,
        `${urlObj.origin}/login?next=https://evil.com`,
        `${urlObj.origin}/login?redirect=https://evil.com`,
        `${urlObj.origin}//evil.com`,
      ];
      for (const payload of redirectPayloads) {
        try {
          const rRes = await fetch(payload, { redirect: "manual", signal: AbortSignal.timeout(3000) });
          const loc = rRes.headers.get("location") || "";
          if (loc.includes("evil.com")) {
            findings.push(finding("HIGH", "Open Redirect", "Open redirect vulnerability detected",
              `The server redirects to an attacker-controlled domain when given a crafted URL parameter. Tested with: ${payload} → Location: ${loc}. This can be used for phishing attacks.`));
            break;
          }
        } catch {}
      }
    } catch {}

    // ──────────────────────────────────────
    // 13. TECHNOLOGY FINGERPRINTING FROM HTML
    // ──────────────────────────────────────
    if (responseBody) {
      const techFingerprints: { pattern: RegExp; tech: string }[] = [
        { pattern: /react/i, tech: "React" },
        { pattern: /vue/i, tech: "Vue.js" },
        { pattern: /angular/i, tech: "Angular" },
        { pattern: /next\.js|__next/i, tech: "Next.js" },
        { pattern: /nuxt/i, tech: "Nuxt.js" },
        { pattern: /wp-content|wordpress/i, tech: "WordPress" },
        { pattern: /jquery/i, tech: "jQuery" },
        { pattern: /bootstrap/i, tech: "Bootstrap" },
        { pattern: /tailwind/i, tech: "Tailwind CSS" },
        { pattern: /google-analytics|gtag/i, tech: "Google Analytics" },
        { pattern: /googletag|doubleclick/i, tech: "Google Ads" },
        { pattern: /hotjar/i, tech: "Hotjar" },
        { pattern: /sentry/i, tech: "Sentry" },
      ];

      const detectedTech: string[] = [];
      for (const tf of techFingerprints) {
        if (tf.pattern.test(responseBody)) {
          detectedTech.push(tf.tech);
        }
      }

      if (detectedTech.length > 0) {
        findings.push(finding("INFO", "Technology Stack", `Detected frontend technologies: ${detectedTech.join(", ")}`,
          `Client-side analysis reveals the following technologies: ${detectedTech.join(", ")}. This information is typically available to anyone inspecting the page source but can help attackers target framework-specific vulnerabilities.`));
      }
    }

    // ──────────────────────────────────────
    // 14. AUTHENTICATION & REGISTRATION DETECTION
    // ──────────────────────────────────────
    if (responseBody) {
      const bodyLower = responseBody.toLowerCase();

      const hasLoginForm = /<form[^>]*>[\s\S]*?(?:type=["']password["']|name=["'](?:password|passwd|pass|pwd)["'])[\s\S]*?<\/form>/i.test(responseBody);
      const hasLoginLinks = /(?:\/login|\/signin|\/sign-in|\/auth\/login|\/account\/login|\/user\/login)/i.test(responseBody);
      const hasLoginKeywords = /(?:log\s*in|sign\s*in|authenticate)/i.test(responseBody);

      const hasRegisterForm = /<form[^>]*>[\s\S]*?(?:name=["'](?:confirm.?password|password.?confirm|register|signup)["']|(?:type=["']password["'][\s\S]*?type=["']password["']))[\s\S]*?<\/form>/i.test(responseBody);
      const hasRegisterLinks = /(?:\/register|\/signup|\/sign-up|\/create.?account|\/join|\/auth\/register)/i.test(responseBody);
      const hasRegisterKeywords = /(?:sign\s*up|register|create\s*(?:an?\s*)?account|join\s*(?:now|free|us))/i.test(responseBody);

      const authDetected = hasLoginForm || hasLoginLinks || hasLoginKeywords;
      const registrationDetected = hasRegisterForm || hasRegisterLinks || hasRegisterKeywords;

      if (authDetected || registrationDetected) {
        const detectedParts: string[] = [];
        if (hasLoginForm) detectedParts.push("login form with password field");
        if (hasLoginLinks) detectedParts.push("login page links");
        if (hasRegisterForm) detectedParts.push("registration form");
        if (hasRegisterLinks) detectedParts.push("registration page links");

        findings.push(finding("INFO", "Authentication", `Authentication system detected: ${detectedParts.join(", ")}`,
          `The site has an authentication system with: ${detectedParts.join(", ")}. This surface area was further analyzed for security weaknesses.`));
      }

      if (hasLoginForm || hasLoginLinks) {
        const commonLoginPaths = ["/login", "/signin", "/sign-in", "/auth/login", "/admin/login", "/wp-login.php", "/user/login", "/account/login", "/admin"];
        const accessibleLoginPaths: string[] = [];

        for (const path of commonLoginPaths) {
          try {
            const loginRes = await fetch(`${urlObj.origin}${path}`, {
              method: "GET",
              headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
              signal: AbortSignal.timeout(3000),
              redirect: "follow",
            });
            if (loginRes.ok) {
              const loginBody = await loginRes.text();
              if (/type=["']password["']/i.test(loginBody)) {
                accessibleLoginPaths.push(path);
              }
            }
          } catch {}
        }

        if (accessibleLoginPaths.length > 0) {
          findings.push(finding("INFO", "Authentication", `Login endpoints found: ${accessibleLoginPaths.join(", ")}`,
            `Discovered ${accessibleLoginPaths.length} accessible login page(s) at: ${accessibleLoginPaths.join(", ")}. These endpoints accept user credentials and are targets for brute-force and credential stuffing attacks.`));

          if (accessibleLoginPaths.some(p => p.includes("admin") || p.includes("wp-login"))) {
            findings.push(finding("MEDIUM", "Authentication", "Admin login panel is publicly accessible",
              `An administrative login page was found at a predictable URL (${accessibleLoginPaths.filter(p => p.includes("admin") || p.includes("wp-login")).join(", ")}). Public admin panels are prime targets for brute-force attacks. Consider restricting access by IP, adding 2FA, or hiding the admin URL.`));
          }
        }

        for (const loginPath of accessibleLoginPaths.slice(0, 2)) {
          try {
            const loginPageRes = await fetch(`${urlObj.origin}${loginPath}`, {
              method: "GET",
              headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
              signal: AbortSignal.timeout(3000),
            });
            if (loginPageRes.ok) {
              const loginHtml = await loginPageRes.text();
              const loginLower = loginHtml.toLowerCase();

              const hasCaptcha = /captcha|recaptcha|hcaptcha|turnstile|g-recaptcha|cf-turnstile/i.test(loginHtml);
              const hasCsrf = /csrf|_token|authenticity.token|__RequestVerificationToken/i.test(loginHtml);
              const hasRateMsg = /too many|rate.limit|try again later|locked out|account.locked/i.test(loginHtml);

              if (!hasCaptcha) {
                findings.push(finding("HIGH", "Authentication", `No CAPTCHA on login page (${loginPath})`,
                  `The login form at ${loginPath} does not use any CAPTCHA (reCAPTCHA, hCaptcha, Turnstile). Without CAPTCHA, automated tools can perform unlimited brute-force login attempts and credential stuffing attacks. Add a CAPTCHA challenge after failed attempts.`));
              }

              if (!hasCsrf) {
                findings.push(finding("HIGH", "Authentication", `No CSRF protection on login form (${loginPath})`,
                  `The login form at ${loginPath} does not appear to include a CSRF token. Without CSRF protection, an attacker can craft a malicious page that submits login requests on behalf of victims, potentially forcing them into attacker-controlled sessions (login CSRF).`));
              }

              if (loginLower.includes("autocomplete") && !loginHtml.includes('autocomplete="off"')) {
                findings.push(finding("LOW", "Authentication", "Password field may allow browser autocomplete",
                  `The login form does not disable autocomplete for sensitive fields. Browsers may cache credentials, which is risky on shared or public computers.`));
              }
            }
          } catch {}
        }

        try {
          const sqlPayloads = ["' OR '1'='1", "admin' --", "' OR 1=1 --"];
          for (const payload of sqlPayloads) {
            const loginPath = accessibleLoginPaths[0] || "/login";
            try {
              const sqliRes = await fetch(`${urlObj.origin}${loginPath}`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/x-www-form-urlencoded",
                  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                },
                body: `username=${encodeURIComponent(payload)}&password=${encodeURIComponent(payload)}`,
                signal: AbortSignal.timeout(5000),
                redirect: "follow",
              });
              const sqliBody = await sqliRes.text();
              const sqliLower = sqliBody.toLowerCase();

              if (sqliLower.includes("sql syntax") || sqliLower.includes("sqlstate") ||
                  sqliLower.includes("mysql") || sqliLower.includes("postgresql") ||
                  sqliLower.includes("sqlite") || sqliLower.includes("ora-") ||
                  sqliLower.includes("unclosed quotation")) {
                findings.push(finding("CRITICAL", "Authentication", "SQL Injection vulnerability detected on login form",
                  `The login form at ${loginPath} returns database error messages when given SQL injection payloads. The payload '${payload}' triggered a database error, indicating the input is not properly sanitized. This is a critical vulnerability that can allow attackers to bypass authentication, extract database contents, or gain full system access.`));
                break;
              }

              if (sqliRes.status === 200 && (sqliLower.includes("dashboard") || sqliLower.includes("welcome") || sqliLower.includes("logged in") || sqliLower.includes("my account"))) {
                findings.push(finding("CRITICAL", "Authentication", "Possible SQL Injection authentication bypass",
                  `The login form at ${loginPath} may be vulnerable to SQL injection-based authentication bypass. The payload '${payload}' resulted in what appears to be a successful login response. This could allow attackers to log in as any user without knowing the password.`));
                break;
              }
            } catch {}
          }
        } catch {}

        const enumPayloads = [
          { user: "admin@nonexistent-domain-xwolf-test.com", pass: "wrongpass123" },
          { user: "test_user_xwolf_probe_" + Date.now(), pass: "wrongpass123" },
        ];

        const loginPath = accessibleLoginPaths[0] || "/login";
        const enumResponses: string[] = [];
        for (const cred of enumPayloads) {
          try {
            const enumRes = await fetch(`${urlObj.origin}${loginPath}`, {
              method: "POST",
              headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                "User-Agent": "Mozilla/5.0",
              },
              body: `username=${encodeURIComponent(cred.user)}&password=${encodeURIComponent(cred.pass)}&email=${encodeURIComponent(cred.user)}`,
              signal: AbortSignal.timeout(5000),
              redirect: "manual",
            });
            const enumBody = await enumRes.text();
            enumResponses.push(enumBody.toLowerCase());
          } catch {}
        }

        if (enumResponses.length >= 2) {
          const hasUserNotFound = enumResponses.some(r => /user.*(not|doesn.t|does not)\s*(exist|found)|no\s*account|unknown\s*user|invalid\s*username/i.test(r));
          const hasInvalidPassword = enumResponses.some(r => /incorrect\s*password|wrong\s*password|invalid\s*password|password.*incorrect/i.test(r));

          if (hasUserNotFound || hasInvalidPassword) {
            findings.push(finding("MEDIUM", "Authentication", "Username enumeration possible via login error messages",
              `The login form reveals whether a username/email exists by returning different error messages for invalid usernames vs. invalid passwords. This allows attackers to build a list of valid accounts before attempting password attacks. Use a generic error message like "Invalid credentials" for all failed login attempts.`));
          }
        }
      }

      if (registrationDetected) {
        const registerPaths = ["/register", "/signup", "/sign-up", "/create-account", "/join", "/auth/register"];
        const accessibleRegPaths: string[] = [];

        for (const path of registerPaths) {
          try {
            const regRes = await fetch(`${urlObj.origin}${path}`, {
              method: "GET",
              headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
              signal: AbortSignal.timeout(3000),
              redirect: "follow",
            });
            if (regRes.ok) {
              const regBody = await regRes.text();
              if (/type=["']password["']/i.test(regBody) || /(?:sign\s*up|register|create\s*account)/i.test(regBody)) {
                accessibleRegPaths.push(path);
              }
            }
          } catch {}
        }

        if (accessibleRegPaths.length > 0) {
          findings.push(finding("INFO", "Registration", `Open registration endpoints: ${accessibleRegPaths.join(", ")}`,
            `Found ${accessibleRegPaths.length} accessible registration page(s) at: ${accessibleRegPaths.join(", ")}. Open registration allows anyone to create accounts.`));

          for (const regPath of accessibleRegPaths.slice(0, 1)) {
            try {
              const regPageRes = await fetch(`${urlObj.origin}${regPath}`, {
                method: "GET",
                headers: { "User-Agent": "Mozilla/5.0" },
                signal: AbortSignal.timeout(3000),
              });
              if (regPageRes.ok) {
                const regHtml = await regPageRes.text();

                const hasCaptcha = /captcha|recaptcha|hcaptcha|turnstile|g-recaptcha|cf-turnstile/i.test(regHtml);
                const hasCsrf = /csrf|_token|authenticity.token/i.test(regHtml);
                const hasEmailVerification = /verify.*email|email.*verif|confirmation.*email|confirm.*account/i.test(regHtml);
                const hasPasswordStrength = /password.*strength|password.*policy|(?:must|should).*(?:contain|include).*(?:upper|lower|number|special|character)/i.test(regHtml);

                if (!hasCaptcha) {
                  findings.push(finding("HIGH", "Registration", `No CAPTCHA on registration page (${regPath})`,
                    `The registration form at ${regPath} has no CAPTCHA protection. Bots can automatically create unlimited fake accounts for spam, abuse, or launching attacks from within the platform. Implement reCAPTCHA, hCaptcha, or Cloudflare Turnstile.`));
                }

                if (!hasCsrf) {
                  findings.push(finding("MEDIUM", "Registration", `No CSRF token on registration form (${regPath})`,
                    `The registration form does not appear to include CSRF protection. An attacker could trick a victim into registering an account with attacker-controlled credentials.`));
                }

                if (!hasEmailVerification) {
                  findings.push(finding("MEDIUM", "Registration", "No email verification indicated on registration page",
                    `The registration page does not mention email verification. Without email verification, attackers can register accounts with fake or victim email addresses, enabling impersonation, spam, and platform abuse.`));
                }

                if (!hasPasswordStrength) {
                  findings.push(finding("LOW", "Registration", "No visible password policy on registration page",
                    `The registration form does not display a password strength policy. Users may create weak passwords vulnerable to brute-force attacks. Enforce and display minimum password requirements (length, complexity).`));
                }
              }
            } catch {}
          }
        }
      }

      const defaultCredPaths = ["/admin", "/admin/login", "/wp-login.php", "/administrator"];
      const defaultCreds = [
        { user: "admin", pass: "admin" },
        { user: "admin", pass: "password" },
        { user: "admin", pass: "123456" },
        { user: "root", pass: "root" },
        { user: "test", pass: "test" },
      ];

      for (const credPath of defaultCredPaths) {
        try {
          const credPageRes = await fetch(`${urlObj.origin}${credPath}`, {
            method: "GET",
            headers: { "User-Agent": "Mozilla/5.0" },
            signal: AbortSignal.timeout(3000),
            redirect: "follow",
          });

          if (!credPageRes.ok) continue;
          const credBody = await credPageRes.text();
          if (!/type=["']password["']/i.test(credBody)) continue;

          for (const cred of defaultCreds) {
            try {
              const loginAttempt = await fetch(`${urlObj.origin}${credPath}`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/x-www-form-urlencoded",
                  "User-Agent": "Mozilla/5.0",
                },
                body: `username=${encodeURIComponent(cred.user)}&password=${encodeURIComponent(cred.pass)}&email=${encodeURIComponent(cred.user)}&log=${encodeURIComponent(cred.user)}&pwd=${encodeURIComponent(cred.pass)}`,
                signal: AbortSignal.timeout(5000),
                redirect: "manual",
              });

              if (loginAttempt.status >= 300 && loginAttempt.status < 400) {
                const loc = loginAttempt.headers.get("location") || "";
                if (loc.includes("dashboard") || loc.includes("admin") || loc.includes("panel") || loc.includes("profile") || loc.includes("wp-admin")) {
                  findings.push(finding("CRITICAL", "Authentication", `Default credentials work: ${cred.user}/${cred.pass} on ${credPath}`,
                    `Successfully authenticated using default credentials (${cred.user}/${cred.pass}) at ${credPath}. The server redirected to '${loc}', indicating a successful login. This is a critical vulnerability — change all default passwords immediately and enforce strong password policies.`));
                  break;
                }
              }

              if (loginAttempt.status === 200) {
                const attemptBody = await loginAttempt.text();
                const attemptLower = attemptBody.toLowerCase();
                if ((attemptLower.includes("dashboard") || attemptLower.includes("welcome") || attemptLower.includes("logged in") || attemptLower.includes("my account") || attemptLower.includes("sign out") || attemptLower.includes("log out")) &&
                    !attemptLower.includes("invalid") && !attemptLower.includes("incorrect") && !attemptLower.includes("failed")) {
                  findings.push(finding("CRITICAL", "Authentication", `Default credentials may work: ${cred.user}/${cred.pass} on ${credPath}`,
                    `Submitting default credentials (${cred.user}/${cred.pass}) at ${credPath} returned a response containing success indicators (dashboard/welcome content). Verify and change these credentials immediately.`));
                  break;
                }
              }
            } catch {}
          }
          break;
        } catch {}
      }

      const sessionHeaders = ["set-cookie", "authorization", "x-auth-token", "x-csrf-token"];
      const hasSessionMgmt = sessionHeaders.some(h => headers[h]);
      if (hasSessionMgmt && authDetected) {
        if (!headers["strict-transport-security"] && urlObj.protocol === "https:") {
          findings.push(finding("HIGH", "Authentication", "Authentication over HTTPS without HSTS",
            "The site uses authentication over HTTPS but lacks HSTS. An attacker can perform SSL stripping to downgrade the first connection to HTTP and intercept login credentials in transit."));
        }

        if (headers["set-cookie"] && !headers["set-cookie"].toLowerCase().includes("secure")) {
          findings.push(finding("HIGH", "Authentication", "Session cookie missing Secure flag",
            "The session cookie is set without the 'Secure' flag, meaning it will be sent over unencrypted HTTP connections. An attacker monitoring network traffic can steal the session cookie and hijack authenticated sessions."));
        }
      }
    }

    // ──────────────────────────────────────
    // BUILD CDN/WAF FINDING
    // ──────────────────────────────────────
    if (detectedProviders.length > 0) {
      findings.push(finding("INFO", "CDN / WAF", `Edge protection detected: ${detectedProviders.join(", ")}`,
        `The site is behind ${detectedProviders.join(", ")} which provides DDoS mitigation and/or WAF capabilities. The origin server IP is likely hidden.`));
    }

    // ──────────────────────────────────────
    // SCRAPING VERDICT
    // ──────────────────────────────────────
    if (isScrapable) {
      if (blockedCount === 0) {
        findings.push(finding("CRITICAL", "Scraping Protection", "No bot protection — all scrapers pass through",
          `All ${botAgents.length} tested bot user-agents (${testedAgents.join(", ")}) received HTTP 200 OK. The site has no scraping defenses whatsoever. Implement TLS fingerprinting, JS challenges (e.g., Cloudflare Turnstile), or a Web Application Firewall.`));
      }
      recommendations.push("CRITICAL: The site lacks technical scraping protection. Implement TLS fingerprinting checks or a JS-based challenge (e.g., Turnstile).");
    } else {
      findings.push(finding("INFO", "Scraping Protection", "Bot protection is active",
        "All tested bot user-agents were blocked or challenged. The site has effective scraping defenses in place."));
    }

    // DDoS verdict
    if (!ddosProtected) {
      findings.push(finding("CRITICAL", "DDoS Protection", `No DDoS protection — Origin IP ${targetIp || "unknown"} is directly exposed`,
        `The origin server (${targetIp}) is directly reachable on the internet without any CDN, WAF, or DDoS mitigation proxy. A Layer 7 flood attack can take the site offline. Deploy Cloudflare proxy, AWS Shield, or a similar service.`));
      recommendations.push(`VULNERABILITY: Origin IP (${targetIp || "unknown"}) is directly reachable. Implement a proxy-based WAF to mitigate Layer 7 DDoS floods.`);
    }

    // ──────────────────────────────────────
    // SECURITY HEADER ANALYSIS
    // ──────────────────────────────────────
    if (!headers["strict-transport-security"]) {
      findings.push(finding("HIGH", "Security Headers", "Missing Strict-Transport-Security (HSTS)",
        "Without HSTS, browsers will attempt plain HTTP connections before upgrading to HTTPS. An attacker performing a man-in-the-middle attack can intercept the initial HTTP request and downgrade the connection (SSL stripping). Add: Strict-Transport-Security: max-age=31536000; includeSubDomains; preload"));
      recommendations.push("RECOMMENDATION: Enable HSTS to prevent SSL stripping attacks.");
    } else {
      const hsts = headers["strict-transport-security"];
      const maxAgeMatch = hsts.match(/max-age=(\d+)/);
      if (maxAgeMatch && parseInt(maxAgeMatch[1]) < 15768000) {
        findings.push(finding("LOW", "Security Headers", "HSTS max-age is too short",
          `Current HSTS max-age is ${maxAgeMatch[1]} seconds (${Math.round(parseInt(maxAgeMatch[1]) / 86400)} days). Recommended minimum is 6 months (15768000 seconds). Short values leave a window for SSL stripping.`));
      }
      if (!hsts.includes("includeSubDomains")) {
        findings.push(finding("LOW", "Security Headers", "HSTS missing includeSubDomains",
          "HSTS is set but doesn't include the 'includeSubDomains' directive. Subdomains remain vulnerable to SSL stripping attacks."));
      }
    }

    if (!headers["content-security-policy"]) {
      findings.push(finding("HIGH", "Security Headers", "Missing Content-Security-Policy (CSP)",
        "Without a CSP, the browser will execute any inline scripts and load resources from any origin. This makes the site vulnerable to XSS attacks where an attacker injects malicious JavaScript. Define a restrictive CSP that limits script sources: Content-Security-Policy: default-src 'self'; script-src 'self'"));
      recommendations.push("RECOMMENDATION: Define a CSP to prevent cross-site scripting (XSS) and data injection.");
    } else {
      const csp = headers["content-security-policy"];
      if (csp.includes("'unsafe-inline'") || csp.includes("'unsafe-eval'")) {
        findings.push(finding("MEDIUM", "Security Headers", "CSP uses unsafe directives",
          `The Content-Security-Policy contains 'unsafe-inline' or 'unsafe-eval', which significantly weakens XSS protection. These directives allow inline scripts and eval() to execute, which are the primary vectors for XSS exploitation.`));
      }
    }

    if (!headers["x-content-type-options"]) {
      findings.push(finding("MEDIUM", "Security Headers", "Missing X-Content-Type-Options",
        "Without 'X-Content-Type-Options: nosniff', browsers may try to MIME-sniff the content type, potentially executing uploaded files as scripts. This enables certain XSS and drive-by-download attacks."));
      recommendations.push("RECOMMENDATION: Add 'X-Content-Type-Options: nosniff' to prevent MIME-type sniffing.");
    }

    if (!headers["x-frame-options"] && !(headers["content-security-policy"] || "").includes("frame-ancestors")) {
      findings.push(finding("MEDIUM", "Security Headers", "Missing X-Frame-Options (clickjacking risk)",
        "The site can be embedded in an iframe on any domain. An attacker can overlay invisible buttons on top of the framed page to trick users into performing unintended actions (clickjacking). Add: X-Frame-Options: DENY or use CSP frame-ancestors."));
      recommendations.push("RECOMMENDATION: Add 'X-Frame-Options: DENY' or 'SAMEORIGIN' to prevent clickjacking.");
    }

    if (!headers["referrer-policy"]) {
      findings.push(finding("LOW", "Security Headers", "Missing Referrer-Policy",
        "Without a Referrer-Policy, the browser sends the full URL (including query parameters with potentially sensitive tokens) as a Referer header when navigating to other sites. Set: Referrer-Policy: strict-origin-when-cross-origin"));
      recommendations.push("RECOMMENDATION: Set a 'Referrer-Policy' to control how much referrer information is shared.");
    }

    if (!headers["permissions-policy"]) {
      findings.push(finding("LOW", "Security Headers", "Missing Permissions-Policy",
        "Without a Permissions-Policy (formerly Feature-Policy), the browser allows all features (camera, microphone, geolocation, etc.) by default. If the site is framed, the embedding page inherits these permissions. Set: Permissions-Policy: camera=(), microphone=(), geolocation=()"));
      recommendations.push("RECOMMENDATION: Implement a 'Permissions-Policy' to restrict browser features.");
    }

    if (!headers["x-xss-protection"]) {
      findings.push(finding("INFO", "Security Headers", "Missing X-XSS-Protection",
        "The X-XSS-Protection header is deprecated in modern browsers (CSP is preferred), but setting 'X-XSS-Protection: 0' is recommended to prevent old browser XSS filter edge cases. Not a critical finding if CSP is properly configured."));
    }

    if (!headers["cross-origin-opener-policy"]) {
      findings.push(finding("LOW", "Security Headers", "Missing Cross-Origin-Opener-Policy (COOP)",
        "Without COOP, the page may share its browsing context with cross-origin popups, potentially enabling Spectre-type side-channel attacks. Set: Cross-Origin-Opener-Policy: same-origin"));
    }

    if (!headers["cross-origin-resource-policy"]) {
      findings.push(finding("LOW", "Security Headers", "Missing Cross-Origin-Resource-Policy (CORP)",
        "Without CORP, the site's resources can be loaded by any cross-origin page, which could leak information. Set: Cross-Origin-Resource-Policy: same-origin"));
    }

  } catch (e) {
    console.error("Fetch failed", e);
    findings.push(finding("CRITICAL", "Connectivity", "Failed to reach target",
      "Could not establish a connection to the target URL. The site may be down, have an invalid SSL certificate, or be blocking requests from this scanner's IP range."));
    recommendations.push("Ensure the site is reachable and has a valid SSL certificate.");
  }

  server = headers["server"] || "Unknown";

  return {
    url: targetUrl,
    targetIp,
    server,
    isScrapable,
    ddosProtected,
    headers,
    recommendations,
    findings,
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
      if (err instanceof Error && (
        err.message.includes("does not exist") ||
        err.message.includes("Invalid URL") ||
        err.message.includes("Only HTTP")
      )) {
        return res.status(400).json({ message: err.message });
      }
      console.error("Scan error:", err);
      res.status(500).json({ message: "Failed to perform scan" });
    }
  });

  return httpServer;
}
