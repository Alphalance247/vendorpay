import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { environment } from "../../../env/env.local";
import { currentTenantBaseUrl } from "../../../lib/tenantResolver";

const BASE_URL =
  import.meta.env.VITE_BACKEND_URL || environment.baseUrl.replace(/\/+$/, "");

// An invite link always lands on the inviting company's own subdomain (e.g.
// bestbraininc.vpay.goalluvium.net/accept-invite?token=...) — scope the call
// to that subdomain so the backend knows which company this invite belongs to.
const getInviteDetails = async (token) => {
  const res = await axios.get(
    `${currentTenantBaseUrl(BASE_URL)}/api/auth/invite/${token}`,
  );
  return res.data;
};

export const useInviteDetails = (token) => {
  return useQuery({
    queryKey: ["invite-details", token],
    queryFn: () => getInviteDetails(token),
    enabled: token.length > 0,
    retry: false,
  });
};
