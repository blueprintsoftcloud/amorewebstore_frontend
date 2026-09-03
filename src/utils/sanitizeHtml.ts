import DOMPurify from "dompurify";

// Render-time defense in depth for any HTML sourced from the backend and rendered via
// dangerouslySetInnerHTML (currently: product.description on ProductDetailPage). The
// backend already sanitizes on write (see backend/src/utils/sanitizeHtml.ts), but this
// stops it from ever reaching the DOM even if some other path reintroduces raw HTML.
export const sanitizeHtml = (html: string | null | undefined): string => {
  if (!html) return "";
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ["p", "br", "b", "strong", "i", "em", "u", "ul", "ol", "li", "h1", "h2", "h3", "h4", "span", "div", "a"],
    ALLOWED_ATTR: ["href", "target", "rel"],
  });
};
