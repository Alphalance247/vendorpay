import { useMutation } from "@tanstack/react-query";
import { extractErrorMessage } from "../../../lib/utils";
import { useToast } from "../../../components/ui/Toast";
import axios from "axios";

// const BASE_URL = "https://str.ec2.alluvium.net/vendorpay";

const verifyCompanyOtp = async (payload) => {
  const res = await axios.post(
    `https://str.ec2.alluvium.net/vendorpay/api/auth/verify-company-otp`,
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
