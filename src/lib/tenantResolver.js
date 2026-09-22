// Host-based tenant resolution. Stands in for a future `GET /tenants/{slug}`
// backend check — swap DUMMY_TENANTS for that call once a real registry exists.

const ROOT_DOMAINS = ["vendorpay.alluvium.net", "localhost"];

export const DUMMY_TENANTS = {
  acme: { name: "Acme Corp" },
  globex: { name: "Globex Inc" },
  bestbraininc: { name: "Best Brain Inc" },
  newvendor: { name: "New Vendor" },
};

export function parseHost(hostname) {
  for (const root of ROOT_DOMAINS) {
    if (hostname === root) return { slug: null, rootDomain: root };
    if (hostname.endsWith(`.${root}`)) {
      return { slug: hostname.slice(0, -(root.length + 1)), rootDomain: root };
    }
  }
  return { slug: null, rootDomain: hostname };
}

export function resolveTenant(hostname = window.location.hostname) {
  const { slug, rootDomain } = parseHost(hostname);

  if (!slug) return { status: "none", rootDomain };

  const tenant = DUMMY_TENANTS[slug];
  return tenant
    ? { status: "found", tenant, slug, rootDomain }
    : { status: "not_found", slug, rootDomain };
}
