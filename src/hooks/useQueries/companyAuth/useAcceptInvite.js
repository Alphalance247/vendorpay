import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { extractErrorMessage } from "../../../lib/utils";
import { useToast } from "../../../components/ui/Toast";
import { environment } from "../../../env/env.local";
import { currentTenantBaseUrl } from "../../../lib/tenantResolver";

const BASE_URL =
  import.meta.env.VITE_BACKEND_URL || environment.baseUrl.replace(/\/+$/, "");

// Same reasoning as useInviteDetails — the accept-invite POST must land on
// the inviting company's own subdomain, extracted from the current URL.
const acceptInvite = async (payload) => {
  const res = await axios.post(
    `${currentTenantBaseUrl(BASE_URL)}/api/auth/accept-invite`,
    payload,
  );
  return res.data;
};

export const useAcceptInvite = (onSuccess) => {
  const { toast } = useToast();

  return useMutation({
    mutationFn: acceptInvite,
    onSuccess: (data) => {
      onSuccess?.(data);
    },
    onError: (err) => {
      toast(extractErrorMessage(err), { variant: "error" });
    },
  });
};
