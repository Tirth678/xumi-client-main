import "dotenv/config";
import type { IncomingMessage, ServerResponse } from "node:http";
import app from "../apps/backend/src/app.js";

export default function handler(request: IncomingMessage, response: ServerResponse) {
  const incoming = request.url ?? "/";
  const url = new URL(incoming, "http://localhost");

  let targetPath = "";

  const pathParam = url.searchParams.get("path");
  if (pathParam !== null && pathParam !== undefined) {
    url.searchParams.delete("path");
    targetPath = `/api/${pathParam.replace(/^\/+/, "")}`;
  } else {
    const matchedHeader =
      (request.headers["x-matched-path"] as string) ||
      (request.headers["x-vercel-matched-path"] as string) ||
      (request.headers["x-forwarded-uri"] as string) ||
      (request.headers["x-original-url"] as string);

    if (typeof matchedHeader === "string" && matchedHeader.startsWith("/api/")) {
      const parsedMatched = new URL(matchedHeader, "http://localhost");
      if (!parsedMatched.pathname.startsWith("/api/index")) {
        targetPath = parsedMatched.pathname;
      }
    }

    if (!targetPath) {
      if (url.pathname.startsWith("/api/index")) {
        const sub = url.pathname.replace(/^\/api\/index\/?/, "");
        targetPath = `/api/${sub}`;
      } else if (url.pathname.startsWith("/api/")) {
        targetPath = url.pathname;
      } else {
        targetPath = `/api${url.pathname === "/" ? "" : url.pathname}`;
      }
    }
  }

  if (targetPath.length > 1 && targetPath.endsWith("/")) {
    targetPath = targetPath.slice(0, -1);
  }

  const query = url.searchParams.toString();
  request.url = `${targetPath}${query ? `?${query}` : ""}`;
  return app(request, response);
}
