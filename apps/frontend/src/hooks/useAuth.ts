import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../api/client";
import type { UserPublic } from "../types";

export function useMe() {
  return useQuery({
    queryKey: ["me"],
    queryFn: () => apiFetch<{ user: UserPublic }>("/auth/me"),
    retry: false,
  });
}
