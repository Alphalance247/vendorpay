// VITE_BACKEND_URL is baked in at build time (see Dockerfile). It is the
// canonical root host for the deployment — e.g. https://vpay.goalluvium.net/
// on dev, https://vendorspay.com/ on prod — and every company workspace
// lives on a subdomain of it. The dev host is only the fallback for local
// runs with no override.
export const environment = {
  baseUrl: import.meta.env.VITE_BACKEND_URL || "https://vpay.goalluvium.net/",
};
