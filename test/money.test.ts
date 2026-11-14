import { describe, expect, it } from "vitest";
import { fromKop, parseDiscountPercent, parseRub, toKop } from "../src/utils/money.js";

describe("parseRub", () => {
  it("принимает число и строку с числом", () => {
    expect(parseRub(2500)).toBe(2500);
    expect(parseRub("2500.00")).toBe(2500);
    expect(parseRub(" 99 ")).toBe(99);
  });

  it("отклоняет мусор и отрицательные суммы", () => {
    expect(() => parseRub("abc")).toThrow();
    expect(() => parseRub(null)).toThrow();
    expect(() => parseRub(-1)).toThrow();
  });
});

describe("toKop / fromKop", () => {
  it("рубли в копейки", () => {
    expect(toKop(2500)).toBe(250000);
    expect(toKop(99)).toBe(9900);
  });

  it("отбрасывает доли копейки", () => {
    expect(toKop(10.999)).toBe(1099);
  });

  it("копейки в рубли", () => {
    expect(fromKop(250000)).toBe(2500);
    expect(fromKop(1099)).toBe(10.99);
  });
});

describe("perseDiscountPercent", () => {
  it("принимает число и строку с числом", () => {
    expect(parseDiscountPercent(0)).toBe(0);
    expect(parseDiscountPercent(16.5)).toBe(16.5);
    expect(parseDiscountPercent("12.5")).toBe(12.5);
    expect(parseDiscountPercent(" 10 ")).toBe(10);
  });

  it("отклоняет некорректные значения", () => {
    expect(() => parseDiscountPercent("abc")).toThrow();
    expect(() => parseDiscountPercent(null)).toThrow();
    expect(() => parseDiscountPercent(-1)).toThrow();
    expect(() => parseDiscountPercent(101)).toThrow();
  });
});
