import type { UserPublic } from "../types";

export function userDisplayName(user: UserPublic): string {
  const fromParts = [user.first_name, user.last_name].filter(Boolean).join(" ").trim();
  if (fromParts) return fromParts;
  if (user.display_name?.trim()) return user.display_name.trim();
  const local = user.email.split("@")[0];
  return local || "ArewaPay";
}
