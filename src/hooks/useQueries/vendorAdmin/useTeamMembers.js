import { useQuery } from '@tanstack/react-query';
import apiClient from '../../../lib/apiClient';

const getTeamMembers = async () => {
  const res = await apiClient.get('/company/team');
  return res.data;
};

export const useTeamMembers = () => {
  return useQuery({
    queryKey: ['team-members'],
    queryFn: getTeamMembers,
  });
};
