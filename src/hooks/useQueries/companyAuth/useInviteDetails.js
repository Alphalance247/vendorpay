import { useQuery } from "@tanstack/react-query";
import axios from "axios";

const BASE_URL =
  import.meta.env.VITE_BACKEND_URL || "https://str.ec2.alluvium.net/vendorpay";

const getInviteDetails = async (token) => {
  const res = await axios.get(`${BASE_URL}/api/auth/invite/${token}`);
  return res.data;
};

export const useInviteDetails = (token) => {
  return useQuery({
    queryKey: ["invite-details", token],
    queryFn: () => getInviteDetails(token),
    enabled: token.length > 0,
    retry: false,
  });
};
