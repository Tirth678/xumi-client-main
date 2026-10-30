import { refreshAccessToken } from "@/lib/neonAuth";

/** Sends a bearer-authenticated JSON request and retries once after a 401. */
export const authorizedFetch = async (
  url: string,
  token: string,
  init?: RequestInit,
): Promise<Response> => {
  const request = (accessToken: string) =>
    fetch(url, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...init?.headers,
        Authorization: `Bearer ${accessToken}`,
      },
    });

  let response = await request(token);
  if (response.status === 401) {
    const refreshedToken = await refreshAccessToken();
    if (refreshedToken) response = await request(refreshedToken);
  }

  return response;
};

export const parseJsonResponse = async <T>(response: Response): Promise<T> => {
  const body = await response.json().catch(() => ({})) as { error?: string };
  if (!response.ok) throw new Error(body.error || "The request failed. Please try again.");
  return body as T;
};
