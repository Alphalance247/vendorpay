import { useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "../../../lib/apiClient";
import { extractErrorMessage } from "../../../lib/utils";
import { useToast } from "../../../components/ui/Toast";

const verifyVendorBanking = async (vendorId) => {
  const res = await apiClient.post(`/banking/${vendorId}/verify`);
  return res.data;
};

export const useVerifyVendorBanking = (vendorId) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => verifyVendorBanking(vendorId),
    onSuccess: () => {
      toast("Banking details approved.");
      queryClient.invalidateQueries({ queryKey: ["vendor-banking", vendorId] });
    },
    onError: (err) => {
      toast(extractErrorMessage(err), { variant: "error" });
    },
  });
};
