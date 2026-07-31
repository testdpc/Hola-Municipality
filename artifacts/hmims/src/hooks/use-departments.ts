import { useQuery } from "@tanstack/react-query";

const API_BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";

export interface Department {
  id: number;
  name: string;
  createdAt: string;
}

export function useDepartments() {
  return useQuery<Department[]>({
    queryKey: ["departments"],
    queryFn: async () => {
      const token = localStorage.getItem("hmims_token");
      const res = await fetch(`${API_BASE}/api/departments`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch departments");
      return res.json();
    },
  });
}
