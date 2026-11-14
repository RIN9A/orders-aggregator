import { describe, expect, it } from "vitest";
import { apiOrder, dailyTotals, postWebhook, setupTestApp } from "./helpers.js";

const ctx = setupTestApp();

describe("GET /customers/:id/daily-totals: скидки", () => {
  it("считает gross, net и discount по amountPaid", async () => {
    await postWebhook(
      ctx.app,
      apiOrder({
        amount: 2500,
        discountPercent: 16.5,
        amountPaid: 2087.5,
        createdAt: "2026-02-10T10:00:00Z",
      }),
    );

    const res = await dailyTotals(ctx.app, "c_1", "2026-02-10", "2026-02-10");

    console.log("TOTALS:", res.statusCode, res.json());

    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual([
      {
        date: "2026-02-10",
        total: 2500,
        gross: 2500,
        discount: 412.5,
        net: 2087.5,
      },
    ]);
  });

  it("суммирует gross, net и discount за несколько заказов", async () => {
    await postWebhook(
      ctx.app,
      apiOrder({
        amount: 1000,
        amountPaid: 800,
        createdAt: "2026-02-10T10:00:00Z",
      }),
    );

    await postWebhook(
      ctx.app,
      apiOrder({
        amount: 2000,
        amountPaid: 1600,
        createdAt: "2026-02-10T11:00:00Z",
      }),
    );

    const res = await dailyTotals(ctx.app, "c_1", "2026-02-10", "2026-02-10");

    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual([
      {
        date: "2026-02-10",
        total: 3000,
        gross: 3000,
        discount: 600,
        net: 2400,
      },
    ]);
  });

  it("без скидки gross равен net, а discount равен нулю", async () => {
    await postWebhook(
      ctx.app,
      apiOrder({
        amount: 1000,
        discountPercent: 0,
        amountPaid: 1000,
        createdAt: "2026-02-10T10:00:00Z",
      }),
    );

    const res = await dailyTotals(ctx.app, "c_1", "2026-02-10", "2026-02-10");

    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual([
      {
        date: "2026-02-10",
        total: 1000,
        gross: 1000,
        discount: 0,
        net: 1000,
      },
    ]);
  });
});

describe("GET /customers/:id/daily-totals: таймзона и DST", () => {
  it("группирует заказы по локальной дате клиента с учетом перехода на летнее время", async () => {
    ctx.api.customers.set("c_dst", "Europe/Berlin");

    await postWebhook(
      ctx.app,
      apiOrder({
        customerId: "c_dst",
        amount: 100,
        amountPaid: 100,
        createdAt: "2026-03-28T22:30:00Z",
      }),
    );

    await postWebhook(
      ctx.app,
      apiOrder({
        customerId: "c_dst",
        amount: 200,
        amountPaid: 200,
        createdAt: "2026-03-29T23:30:00Z",
      }),
    );

    const res = await dailyTotals(ctx.app, "c_dst", "2026-03-28", "2026-03-30");

    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual([
      {
        date: "2026-03-28",
        total: 100,
        gross: 100,
        discount: 0,
        net: 100,
      },
      {
        date: "2026-03-29",
        total: 0,
        gross: 0,
        discount: 0,
        net: 0,
      },
      {
        date: "2026-03-30",
        total: 200,
        gross: 200,
        discount: 0,
        net: 200,
      },
    ]);
  });

  it("заказ вскоре после полуночи относится к правильному локальному дню", async () => {
    ctx.api.customers.set("c_dst", "Europe/Berlin");

    await postWebhook(
      ctx.app,
      apiOrder({
        customerId: "c_dst",
        amount: 300,
        amountPaid: 300,
        createdAt: "2026-03-30T22:30:00Z",
      }),
    );

    const res = await dailyTotals(ctx.app, "c_dst", "2026-03-30", "2026-03-31");

    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual([
      {
        date: "2026-03-30",
        total: 0,
        gross: 0,
        discount: 0,
        net: 0,
      },
      {
        date: "2026-03-31",
        total: 300,
        gross: 300,
        discount: 0,
        net: 300,
      },
    ]);
  });
});
