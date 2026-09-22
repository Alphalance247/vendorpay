import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { extractErrorMessage } from "../../../lib/utils";
import { useToast } from "../../../components/ui/Toast";

const BASE_URL =
  import.meta.env.VITE_BACKEND_URL ||
  "https://betbraininc.str.ec2.alluvium.net/vendorpay";

const acceptInvite = async (payload) => {
  const res = await axios.post(`${BASE_URL}/api/auth/accept-invite`, payload);
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
