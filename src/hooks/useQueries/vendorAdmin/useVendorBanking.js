import { useQuery } from '@tanstack/react-query';
import apiClient from '../../../lib/apiClient';

const getVendorBanking = async (vendorId) => {
  const res = await apiClient.get(`/banking/${vendorId}`);
  return res.data;
};

export const useVendorBanking = (vendorId, enabled = true) => {
  return useQuery({
    queryKey: ['vendor-banking', vendorId],
    queryFn: () => getVendorBanking(vendorId),
    enabled: enabled && !!vendorId,
    retry: false,
  });
};
