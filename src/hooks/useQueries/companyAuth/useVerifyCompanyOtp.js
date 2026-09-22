import { useMutation } from "@tanstack/react-query";
import { extractErrorMessage } from "../../../lib/utils";
import { useToast } from "../../../components/ui/Toast";
import axios from "axios";
import { environment } from "../../../env/env.local";

const BASE_URL =
  import.meta.env.VITE_BACKEND_URL || environment.baseUrl.replace(/\/+$/, "");

const verifyCompanyOtp = async (payload) => {
  const res = await axios.post(
    `${BASE_URL}/api/auth/verify-company-otp`,
    payload,
  );
  return res.data;
};

export const useVerifyCompanyOtp = (onSuccess) => {
  const { toast } = useToast();

  return useMutation({
    mutationFn: verifyCompanyOtp,
    onSuccess: () => {
      onSuccess?.();
    },
    onError: (err) => {
      toast(extractErrorMessage(err), { variant: "error" });
    },
  });
};
