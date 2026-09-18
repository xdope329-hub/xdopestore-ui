export const SITE_NAME = "XDOPE";
export const SITE_TITLE = "XDOPE | Hoodies y diseños originales";
export const SITE_DESCRIPTION = "Descubre hoodies y diseños originales en XDOPE. Compra en línea con envíos en Colombia.";

export const brandText = (value, fallback) =>
  typeof value === "string" && value.trim() && !/multikart/i.test(value) ? value.trim() : fallback;
