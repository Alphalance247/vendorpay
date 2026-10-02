import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../../lib/apiClient';
import { extractErrorMessage } from '../../../lib/utils';
import { useToast } from '../../../components/ui/Toast';

const updateBanking = async (payload) => {
  const res = await apiClient.put('/banking/update', payload);
  return res.data;
};

export const useUpdateBanking = (onSuccess) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateBanking,
    onSuccess: () => {
      toast('Banking details submitted for review.');
      queryClient.invalidateQueries({ queryKey: ['banking'] });
      onSuccess?.();
    },
    onError: (err) => {
      toast(extractErrorMessage(err), { variant: 'error' });
    },
  });
};
