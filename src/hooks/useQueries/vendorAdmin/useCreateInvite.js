import { useMutation } from '@tanstack/react-query';
import apiClient from '../../../lib/apiClient';
import { extractErrorMessage } from '../../../lib/utils';
import { useToast } from '../../../components/ui/Toast';

const createInvite = async (payload) => {
  const res = await apiClient.post('/auth/admin/create', payload);
  return res.data;
};

export const useCreateInvite = (onSuccess) => {
  const { toast } = useToast();

  return useMutation({
    mutationFn: createInvite,
    onSuccess: () => {
      toast('Invite sent successfully.');
      onSuccess?.();
    },
    onError: (err) => {
      toast(extractErrorMessage(err), { variant: 'error' });
    },
  });
};
