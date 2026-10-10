import { describe, it, expect } from "vitest";
import {
  bookingSchema,
  contactSchema,
  filterGallery,
  defaults,
  stateSchema,
  safeSocial,
  images,
  migrateComparison,
  comparisonSplit,
} from "@/lib/noir-data";
describe("NOIR PINK demo rules", () => {
  it("uses a matched manicure concept instead of unrelated skincare and portrait defaults", () => {
    expect(defaults.before).toBe(images.manicureBefore);
    expect(defaults.after).toBe(images.manicureAfter);
    expect(defaults.before).not.toBe(defaults.after);
  });
  it("upgrades the legacy mismatched pair without removing local bookings", () => {
    const old = { ...defaults, before: images.skin, after: images.campaign };
    expect(migrateComparison(old)).toEqual({ ...old, before: images.manicureBefore, after: images.manicureAfter });
  });
  it("preserves user-replaced comparison images", () => {
    const edited = { ...defaults, before: "custom-before", after: "custom-after" };
    expect(migrateComparison(edited)).toBe(edited);
  });
  it("reveals the correct position and clamps dragging to either edge", () => {
    expect(comparisonSplit(350, 100, 1000)).toBe(25);
    expect(comparisonSplit(50, 100, 1000)).toBe(0);
    expect(comparisonSplit(1200, 100, 1000)).toBe(100);
  });
  const booking = {
    service: "nails",
    name: "Demo Visitor",
    email: "demo@example.com",
    phone: "",
    date: "2026-10-11",
    time: "14:00",
  };
  for (const field of ["service", "name", "email", "date", "time"] as const)
    it(`requires booking ${field}`, () => {
      expect(bookingSchema.safeParse({ ...booking, [field]: "" }).success).toBe(false);
    });
  it("accepts a complete preferred appointment without optional phone", () =>
    expect(bookingSchema.safeParse(booking).success).toBe(true));
  it("rejects invalid contact email", () =>
    expect(
      contactSchema.safeParse({ name: "Demo", email: "invalid", message: "Hello there" }).success,
    ).toBe(false));
  it("requires a contact message", () =>
    expect(
      contactSchema.safeParse({ name: "Demo", email: "demo@example.com", message: "" }).success,
    ).toBe(false));
  it("filters gallery to matching category", () =>
    expect(filterGallery(defaults.gallery, "NAILS").map((g) => g.id)).toEqual(["g1"]));
  it("shows every gallery entry for ALL", () =>
    expect(filterGallery(defaults.gallery, "ALL")).toHaveLength(4));
  it("rejects an invalid editable accent", () =>
    expect(stateSchema.safeParse({ ...defaults, accent: "url(javascript:alert(1))" }).success).toBe(
      false,
    ));
  it("rejects executable social links", () =>
    expect(safeSocial("javascript:alert(1)")).toBeUndefined());
  it("accepts prototype defaults without any real bookings", () => {
    expect(stateSchema.safeParse(defaults).success).toBe(true);
    expect(defaults.bookings).toEqual([]);
  });
});
