import StarRating from "@/components/widgets/starRating";
import { useState } from "react";
import { RiStarFill, RiStarLine } from "react-icons/ri";

const RatingBox = ({ classes = {}, totalRating, clickAble, setFieldValue, name }) => {
  const RatingStar = Array.from({ length: 5 }, (_, index) => index);
  const [rating, setRating] = useState(totalRating);
  const handleRate = (elem) => {
    setRating(elem);
    setFieldValue && name && setFieldValue(name, elem);
  };
  return (
    <>
      {clickAble ? (
        <div className={`product-rating ${classes?.customClass ? classes?.customClass : ""}`}>
          {RatingStar &&
            RatingStar.map((elem, index) => (
              <li key={elem} onClick={() => handleRate(index + 1)}>
                {index + 1 <= rating ? <RiStarFill style={{ color: "var(--theme-color2, #ffa200)" }} size="17" /> : <RiStarLine size="17" />}
              </li>
            ))}
        </div>
      ) : (
        // Solo lectura: estrellas llenas según el promedio real (4.3 → cuatro
        // llenas y el 30 % de la quinta), no solo las enteras.
        <div className={`rating ${classes?.customClass ? classes?.customClass : ""}`}>
          <StarRating rating={totalRating} svg />
        </div>
      )}
    </>
  );
};

export default RatingBox;
