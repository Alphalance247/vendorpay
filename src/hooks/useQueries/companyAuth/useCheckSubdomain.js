import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { environment } from "../../../env/env.local";

const BASE_URL =
  import.meta.env.VITE_BACKEND_URL || environment.baseUrl.replace(/\/+$/, "");

const checkSubdomain = async (subdomain) => {
  const res = await axios.get(`${BASE_URL}/api/auth/check-subdomain`, {
    params: { subdomain },
  });
  return res.data;
};

export const useCheckSubdomain = (subdomain) => {
  return useQuery({
    queryKey: ["check-subdomain", subdomain],
    queryFn: () => checkSubdomain(subdomain),
    enabled: subdomain.length >= 3,
    retry: false,
  });
};
