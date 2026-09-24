import { useQuery } from '@tanstack/react-query';
import apiClient from '../../../lib/apiClient';

const getCurrentUser = async () => {
  const res = await apiClient.get('/auth/me');
  return res.data;
};

export const useCurrentUser = (enabled = true) => {
  return useQuery({
    queryKey: ['current-user'],
    queryFn: getCurrentUser,
    enabled,
  });
};
