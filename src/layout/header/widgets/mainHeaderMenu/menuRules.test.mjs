import assert from "node:assert/strict";
import test from "node:test";
import { isHiddenPath, visibleMenuItems } from "./menuRules.js";

test("el enlace Blog se oculta porque la tienda no tiene blog", () => {
  assert.equal(isHiddenPath("/blogs"), true);
  assert.equal(isHiddenPath("blogs"), true);
  assert.equal(isHiddenPath("/Blogs/"), true);
  assert.equal(isHiddenPath("/blog/mi-entrada"), true);
  assert.equal(isHiddenPath("/blogs?page=2"), true);
});

test("el resto del menú se conserva", () => {
  assert.equal(isHiddenPath("/"), false);
  assert.equal(isHiddenPath("/collections?category=mujer"), false);
  assert.equal(isHiddenPath("/blogger-tips"), false);
  assert.equal(isHiddenPath(undefined), false);
  assert.equal(isHiddenPath(""), false);
});

test("se filtra el árbol completo, hijos incluidos, sin mutar el original", () => {
  const menu = [
    { title: "Inicio", path: "/" },
    { title: "Mujer", path: "/collections?category=mujer", child: [{ title: "Vestidos", path: "/collections?category=vestidos" }, { title: "Blog mujer", path: "/blogs/mujer" }] },
    { title: "Blog", path: "/blogs" },
    { title: "Más", link_type: "sub", item: [{ title: "Contacto", path: "/contact-us" }, { title: "Blog", path: "blog" }] },
  ];
  const out = visibleMenuItems(menu);
  assert.deepEqual(out.map((m) => m.title), ["Inicio", "Mujer", "Más"]);
  assert.deepEqual(out[1].child.map((m) => m.title), ["Vestidos"]);
  assert.deepEqual(out[2].item.map((m) => m.title), ["Contacto"]);
  assert.equal(menu.length, 4);
  assert.equal(menu[1].child.length, 2);
});

test("entradas sin path (desplegables) se conservan y entradas inválidas se ignoran", () => {
  assert.deepEqual(visibleMenuItems([{ title: "Tienda", link_type: "sub" }, null]).map((m) => m.title), ["Tienda"]);
  assert.deepEqual(visibleMenuItems(undefined), []);
});
