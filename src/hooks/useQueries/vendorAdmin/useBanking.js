import { useQuery } from "@tanstack/react-query";
import apiClient from "../../../lib/apiClient";

const getBanking = async () => {
  const res = await apiClient.get("/banking/");
  return res.data;
};

export const useBanking = (enabled = true) => {
  return useQuery({
    queryKey: ["banking"],
    queryFn: getBanking,
    enabled,
    retry: false,
  });
};
