import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * SPA navigation keeps the old scroll position by default, which left pages
 * like /preorder opening mid-scroll after clicking a link from the footer.
 * Restore the top on pathname changes, but let in-page #anchors through.
 */
export default function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) return;
    window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });
  }, [pathname, hash]);

  return null;
}
