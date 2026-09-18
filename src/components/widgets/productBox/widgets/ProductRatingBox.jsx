import StarRating from "@/components/widgets/starRating";

// Estrellas de la tarjeta de producto llenas según el promedio real (4.3 →
// cuatro llenas y el 30 % de la quinta). Antes cualquier promedio por encima
// de 4 pintaba las cinco estrellas enteras.
const ProductRatingBox = ({ ratingCount }) => <StarRating rating={ratingCount} />;

export default ProductRatingBox;
