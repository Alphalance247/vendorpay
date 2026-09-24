import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { environment } from "../env/env.local";

const BASE_URL =
  import.meta.env.VITE_BACKEND_URL || environment.baseUrl.replace(/\/+$/, "");

// The frontend's own subdomain root, derived from the same canonical base
// URL — "localhost" is kept alongside it for local dev, where the app isn't
// served from that domain at all.
const ROOT_DOMAINS = [new URL(environment.baseUrl).hostname, "localhost"];

export function parseHost(hostname) {
  for (const root of ROOT_DOMAINS) {
    if (hostname === root) return { slug: null, rootDomain: root };
    if (hostname.endsWith(`.${root}`)) {
      return { slug: hostname.slice(0, -(root.length + 1)), rootDomain: root };
    }
  }
  return { slug: null, rootDomain: hostname };
}

// Rewrites a base URL's hostname to be prefixed with a company slug, e.g.
// withSubdomain('https://vpay.goalluvium.net', 'bestbraininc') ->
// 'https://bestbraininc.vpay.goalluvium.net'. Returns the base URL unchanged
// when there's no slug to apply.
export function withSubdomain(baseUrl, slug) {
  if (!slug) return baseUrl;

  try {
    const url = new URL(baseUrl);
    url.hostname = `${slug}.${url.hostname}`;
    return url.toString().replace(/\/$/, "");
  } catch {
    return baseUrl;
  }
}

// Scopes a base URL to whatever company subdomain the browser is currently
// on — e.g. an invite link landing on bestbraininc.vpay.goalluvium.net —
// so a pre-auth call (no stored session/company_slug yet) still reaches the
// right company's API host. Falls back to the plain base URL off-subdomain.
export function currentTenantBaseUrl(baseUrl, hostname = window.location.hostname) {
  const { slug } = parseHost(hostname);
  return withSubdomain(baseUrl, slug);
}

// Reuses the same subdomain-availability check the signup wizard uses to
// claim a slug — inverted here, since "available" during signup means "no
// workspace exists there yet," which is exactly what tenant resolution needs.
async function checkTenantExists(slug) {
  try {
    const res = await axios.get(`${BASE_URL}/api/auth/check-subdomain`, {
      params: { subdomain: slug },
    });
    const body = res.data;
    const available =
      typeof body?.available === "boolean"
        ? body.available
        : typeof body?.is_available === "boolean"
          ? body.is_available
          : true;
    return !available;
  } catch {
    // Fail open: a transient network/API error shouldn't lock a real
    // workspace out behind "Workspace unavailable" — let the app render
    // normally and any real problem surface through the actual API calls.
    return true;
  }
}

// A working session already proves the workspace is real (there's no way to
// hold tokens for a company that doesn't exist), so the existence check only
// actually needs to run for an anonymous visit — skipping it otherwise keeps
// every already-logged-in reload from paying for a network round trip it
// doesn't need.
export function useTenantResolution(hostname = window.location.hostname) {
  const { slug, rootDomain } = parseHost(hostname);
  const hasSession = !!slug && !!localStorage.getItem("access_token");
  const shouldCheck = !!slug && !hasSession;

  const query = useQuery({
    queryKey: ["tenant-exists", slug],
    queryFn: () => checkTenantExists(slug),
    enabled: shouldCheck,
    retry: false,
    staleTime: Infinity,
  });

  if (!slug) return { status: "none", slug, rootDomain };
  if (hasSession) return { status: "found", slug, rootDomain };
  if (query.isPending) return { status: "checking", slug, rootDomain };
  return { status: query.data ? "found" : "not_found", slug, rootDomain };
}
