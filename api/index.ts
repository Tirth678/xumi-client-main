import "dotenv/config";
import type { IncomingMessage, ServerResponse } from "node:http";
import app from "../apps/backend/src/app";

export default function handler(request: IncomingMessage, response: ServerResponse) {
  const incoming = request.url ?? "/";
  const url = new URL(incoming, "http://localhost");

  let targetPath = "";

  const pathParam = url.searchParams.get("path");
  if (pathParam !== null && pathParam !== undefined) {
    url.searchParams.delete("path");
    targetPath = `/api/${pathParam.replace(/^\/+/, "")}`;
  } else {
    const matchedPath = request.headers["x-matched-path"];
    if (typeof matchedPath === "string" && matchedPath.startsWith("/api/") && !matchedPath.startsWith("/api/index")) {
      targetPath = matchedPath;
    } else if (url.pathname.startsWith("/api/index")) {
      const sub = url.pathname.replace(/^\/api\/index\/?/, "");
      targetPath = `/api/${sub}`;
    } else if (url.pathname.startsWith("/api/")) {
      targetPath = url.pathname;
    } else {
      targetPath = `/api${url.pathname === "/" ? "" : url.pathname}`;
    }
  }

  if (targetPath.length > 1 && targetPath.endsWith("/")) {
    targetPath = targetPath.slice(0, -1);
  }

  const query = url.searchParams.toString();
  request.url = `${targetPath}${query ? `?${query}` : ""}`;
  return app(request, response);
}
