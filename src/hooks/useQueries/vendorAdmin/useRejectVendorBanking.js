import { useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "../../../lib/apiClient";
import { extractErrorMessage } from "../../../lib/utils";
import { useToast } from "../../../components/ui/Toast";

const rejectVendorBanking = async (vendorId, reason) => {
  const res = await apiClient.post(`/banking/${vendorId}/reject`, { reason });
  return res.data;
};

export const useRejectVendorBanking = (vendorId) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (reason) => rejectVendorBanking(vendorId, reason),
    onSuccess: () => {
      toast("Banking details rejected.");
      queryClient.invalidateQueries({ queryKey: ["vendor-banking", vendorId] });
    },
    onError: (err) => {
      toast(extractErrorMessage(err), { variant: "error" });
    },
  });
};
