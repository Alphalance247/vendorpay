import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { extractErrorMessage } from "../../../lib/utils";
import { useToast } from "../../../components/ui/Toast";

const BASE_URL =
  import.meta.env.VITE_BACKEND_URL || "https://str.ec2.alluvium.net/vendorpay";

const completeCompanySignup = async (payload) => {
  // const formData = new FormData();
  // Object.entries(payload).forEach(([key, value]) => {
  //   if (value === undefined || value === null || value === '') return;
  //   formData.append(key, value);
  // });

  const res = await axios.post(
    `${BASE_URL}/api/auth/complete-company-signup`,
    payload,
  );
  return res.data;
};

export const useCompleteCompanySignup = (onSuccess) => {
  const { toast } = useToast();

  return useMutation({
    mutationFn: completeCompanySignup,
    onSuccess: (data) => {
      onSuccess?.(data);
    },
    onError: (err) => {
      toast(extractErrorMessage(err), { variant: "error" });
    },
  });
};
