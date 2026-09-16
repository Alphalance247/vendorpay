import { useMutation } from "@tanstack/react-query";
import apiClient from "../../../lib/apiClient";
import { extractErrorMessage } from "../../../lib/utils";
import { useToast } from "../../../components/ui/Toast";

const resendInvite = async (inviteId) => {
  const res = await apiClient.post(`/company/team/${inviteId}/resend`);
  return res.data;
};

export const useResendInvite = () => {
  const { toast } = useToast();

  return useMutation({
    mutationFn: resendInvite,
    onError: (err) => {
      toast(extractErrorMessage(err), { variant: "error" });
    },
  });
};
