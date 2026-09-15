import { useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "../../../lib/apiClient";
import { extractErrorMessage } from "../../../lib/utils";
import { useToast } from "../../../components/ui/Toast";

const deleteTeamMember = async (memberId) => {
  const res = await apiClient.delete(`/company/team/${memberId}`);
  return res.data;
};

export const useDeleteTeamMember = (onSuccess) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteTeamMember,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-members"] });
      onSuccess?.();
    },
    onError: (err) => {
      toast(extractErrorMessage(err), { variant: "error" });
    },
  });
};
