import type { IncomingMessage, ServerResponse } from "node:http";
import app from "../apps/backend/src/app";

export default function handler(request: IncomingMessage, response: ServerResponse) {
  const url = new URL(request.url ?? "/", "http://localhost");
  const path = url.searchParams.get("path") ?? "";
  url.searchParams.delete("path");
  const query = url.searchParams.toString();
  request.url = `/api/${path}${query ? `?${query}` : ""}`;
  return app(request, response);
}
