/** Formats dates consistently with the storefront's Indian English locale. */
export const formatDate = (iso: string): string =>
  new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
