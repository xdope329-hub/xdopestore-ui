import { RiStarFill, RiStarLine } from "react-icons/ri";
import { starFills } from "./starFills";

/**
 * Estrellas de solo lectura llenas según el promedio real del producto
 * (4.3 → cuatro llenas y el 30 % de la quinta). Cada estrella apila la
 * estrella vacía (gris) y, encima, la estrella llena de color recortada a la
 * fracción (estilos en src/index.scss, `.star-rating-item`).
 *
 * - `svg`: iconos de react-icons (RatingBox); por defecto usa la fuente
 *   remixicon (`<i>`), que es lo que estilizan `.rating i` / `.rating i.fill`.
 * - `tag`: elemento de cada estrella (`li` dentro de `ul.rating`, `span` en
 *   el resto).
 */
const FILL_STYLE = { color: "var(--theme-color2, #ffa200)" };

const Star = ({ svg, filled }) => {
  if (svg) return filled ? <RiStarFill size="17" className="fill" style={FILL_STYLE} /> : <RiStarLine size="17" />;
  return <i className={filled ? "ri-star-fill fill" : "ri-star-line"} />;
};

const StarRating = ({ rating, tag: Tag = "span", svg = false }) => (
  <>
    {starFills(rating).map((fill, index) => (
      <Tag key={index} className="star-rating-item" aria-hidden="true">
        <span className="star-rating-base">
          <Star svg={svg} />
        </span>
        {fill > 0 && (
          <span className="star-rating-fill" style={{ width: `${fill * 100}%` }}>
            <Star svg={svg} filled />
          </span>
        )}
      </Tag>
    ))}
  </>
);

export default StarRating;
