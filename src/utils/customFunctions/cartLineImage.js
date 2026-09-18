/**
 * Imagen de una línea del carrito (drawer del header, página del carrito,
 * resumen del checkout): la foto de la variación elegida (color/talla) y,
 * si no tiene, la miniatura del producto. Pura: testeable con `node --test`.
 *
 * Un id sin poblar (texto) o un objeto sin `original_url` no cuentan como
 * imagen: antes, un carrito de invitado guardado con ese dato mostraba el
 * placeholder en vez de la miniatura.
 */
const usable = (image) => (image && typeof image === "object" && image.original_url ? image : null);

export const getCartLineImage = (line) => usable(line?.variation?.variation_image) || usable(line?.product?.product_thumbnail) || null;

export const getCartLineImageUrl = (line, fallback = "") => getCartLineImage(line)?.original_url || fallback;
