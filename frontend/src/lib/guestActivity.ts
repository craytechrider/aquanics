import api from "../app/lib/api";

export type GuestActivity =
  | "Viewed Home Page"
  | "Viewed Public Guide"
  | "Viewed Public Information"
  | "Attempted Admin Access";

export async function logGuestActivity(
  activity: GuestActivity,
  details?: string,
): Promise<void> {
  try {
    const response = await api.post("/guest-activity", {
      activity,
      details,
    });

    console.log("Guest activity saved:", response.data);
  } catch (error) {
    console.error("Guest activity failed:", error);
  }
}
