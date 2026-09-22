import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { extractErrorMessage } from "../../../lib/utils";
import { useToast } from "../../../components/ui/Toast";

const BASE_URL =
  import.meta.env.VITE_BACKEND_URL || "https://str.ec2.alluvium.net/vendorpay";

const registerCompany = async (payload) => {
  const res = await axios.post(
    `${BASE_URL}/api/auth/register-company`,
    payload,
  );
  return res.data;
};

export const useRegisterCompany = (onSuccess) => {
  const { toast } = useToast();

  return useMutation({
    mutationFn: registerCompany,
    onSuccess: () => {
      onSuccess?.();
      toast("Email sent successfully!", { variant: "success" });
    },
    onError: (err) => {
      toast(extractErrorMessage(err), { variant: "error" });
    },
  });
};
