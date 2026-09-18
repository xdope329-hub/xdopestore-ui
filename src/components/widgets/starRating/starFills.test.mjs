import assert from "node:assert/strict";
import test from "node:test";
import { clampRating, starFills } from "./starFills.js";

test("el promedio llena las estrellas de forma proporcional", () => {
  assert.deepEqual(starFills(4.3), [1, 1, 1, 1, 0.3]);
  assert.deepEqual(starFills(2.5), [1, 1, 0.5, 0, 0]);
  assert.deepEqual(starFills(5), [1, 1, 1, 1, 1]);
  assert.deepEqual(starFills("3"), [1, 1, 1, 0, 0]);
});

test("sin promedio (o inválido) todas las estrellas quedan vacías", () => {
  assert.deepEqual(starFills(0), [0, 0, 0, 0, 0]);
  assert.deepEqual(starFills(undefined), [0, 0, 0, 0, 0]);
  assert.deepEqual(starFills(null), [0, 0, 0, 0, 0]);
  assert.deepEqual(starFills("abc"), [0, 0, 0, 0, 0]);
  assert.deepEqual(starFills(-2), [0, 0, 0, 0, 0]);
});

test("los valores fuera de rango se acotan a 0..5", () => {
  assert.equal(clampRating(7), 5);
  assert.equal(clampRating(-1), 0);
  assert.deepEqual(starFills(9), [1, 1, 1, 1, 1]);
});

test("el promedio del API con muchos decimales se redondea a centésimas", () => {
  assert.deepEqual(starFills(4.333333), [1, 1, 1, 1, 0.33]);
  assert.deepEqual(starFills(3.666667), [1, 1, 1, 0.67, 0]);
});
