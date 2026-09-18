import assert from "node:assert/strict";
import test from "node:test";
import { progressPercent, resolveAutoplaySeconds, shouldAutoplay } from "./homeSliderRules.js";

test("sin valor configurado se usan 5 segundos", () => {
  assert.equal(resolveAutoplaySeconds(undefined), 5);
  assert.equal(resolveAutoplaySeconds(null), 5);
  assert.equal(resolveAutoplaySeconds(""), 5);
  assert.equal(resolveAutoplaySeconds("abc"), 5);
});

test("el admin fija los segundos (número o texto del formulario)", () => {
  assert.equal(resolveAutoplaySeconds(8), 8);
  assert.equal(resolveAutoplaySeconds("3"), 3);
  assert.equal(resolveAutoplaySeconds("2.5"), 2.5);
});

test("0 desactiva el auto-desplazamiento y los extremos se acotan", () => {
  assert.equal(resolveAutoplaySeconds(0), 0);
  assert.equal(resolveAutoplaySeconds("0"), 0);
  assert.equal(resolveAutoplaySeconds("-4"), 0);
  assert.equal(resolveAutoplaySeconds(0.2), 1);
  assert.equal(resolveAutoplaySeconds(999), 120);
});

test("solo se auto-desplaza con más de un banner y un intervalo válido", () => {
  assert.equal(shouldAutoplay(3, 5), true);
  assert.equal(shouldAutoplay(1, 5), false);
  assert.equal(shouldAutoplay(0, 5), false);
  assert.equal(shouldAutoplay(3, 0), false);
});

test("la barra avanza en proporción al tiempo transcurrido", () => {
  assert.equal(progressPercent(0, 5), 0);
  assert.equal(progressPercent(2500, 5), 50);
  assert.equal(progressPercent(9000, 5), 100);
  assert.equal(progressPercent(-10, 5), 0);
  assert.equal(progressPercent(1000, 0), 0);
});
