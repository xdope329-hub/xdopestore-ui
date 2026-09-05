import StarRating from '@/components/widgets/starRating';
import { useState } from 'react';

const ProductRating = ({ classes = {}, totalRating, clickAble, setFieldValue, name }) => {
  const RatingStar = Array.from({ length: 5 }, (_, index) => index);
  const [rating, setRating] = useState(totalRating);
  const handleRate = (elem) => {
    setRating(elem);
    setFieldValue && name && setFieldValue(name, elem);
  };
  return (
    <>
      {clickAble ? (
        <ul className={`add-rating ${classes?.customClass ? classes?.customClass : ''}`}>
          {RatingStar &&
            RatingStar.map((elem, index) => (
              <li key={elem} onClick={() => handleRate(index + 1)}>
                {index + 1 <= rating ? <i className="ri-star-line fill"></i> : <i className="ri-star-line"></i>}
              </li>
            ))}
        </ul>
      ) : (
        // Solo lectura: estrellas llenas según el promedio real del producto
        // (4.3 → cuatro llenas y el 30 % de la quinta).
        <ul className={`rating ${classes?.customClass ? classes?.customClass : ''}`}>
          <StarRating rating={totalRating} tag="li" />
        </ul>
      )}
    </>
  );
};

export default ProductRating;
