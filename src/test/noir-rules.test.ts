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
  migrateDemo,
  businessEmail,
  inquiryEmail,
} from "@/lib/noir-data";
describe("NOIR PINK demo rules", () => {
  it("uses a matched manicure concept instead of unrelated skincare and portrait defaults", () => {
    expect(defaults.before).toBe(images.makeupBefore);
    expect(defaults.after).toBe(images.makeupAfter);
    expect(defaults.before).not.toBe(defaults.after);
  });
  it("upgrades the legacy mismatched pair without removing local bookings", () => {
    const old = { ...defaults, before: images.skin, after: images.campaign };
    expect(migrateComparison(old)).toEqual({ ...old, before: images.makeupBefore, after: images.makeupAfter });
    const nails = { ...defaults, before: images.manicureBefore, after: images.manicureAfter };
    expect(migrateComparison(nails).before).toBe(images.makeupBefore);
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
  for (const field of ["service", "name", "email"] as const)
    it(`requires booking ${field}`, () => {
      expect(bookingSchema.safeParse({ ...booking, [field]: "" }).success).toBe(false);
    });
  it("accepts a complete preferred appointment without optional phone", () =>
    expect(bookingSchema.safeParse(booking).success).toBe(true));
  it("allows an inquiry without a preferred date or time", () => {
    expect(bookingSchema.safeParse({ ...booking, date: "", time: "" }).success).toBe(true);
  });
  it("accepts an optional inquiry message", () => {
    expect(bookingSchema.parse({ ...booking, message: "A pink manicure, please." }).message).toBe("A pink manicure, please.");
    expect(bookingSchema.parse(booking).message).toBe("");
  });
  it("rejects messages longer than 1000 characters", () => {
    expect(bookingSchema.safeParse({ ...booking, message: "x".repeat(1001) }).success).toBe(false);
  });
  it("has no invented default prices or durations", () => {
    expect(defaults.services.every(s => s.price === "" && s.duration === "")).toBe(true);
  });
  it("removes legacy sample pricing while preserving edited pricing", () => {
    const nails = defaults.services.find(s => s.id === "nails");
    const hair = defaults.services.find(s => s.id === "hair");
    if (!nails || !hair) throw new Error("Required services missing");
    const state = { ...defaults, services: [{ ...nails, price: "From 65", duration: "60–90 min" }, { ...hair, price: "120 SEK", duration: "80 min" }] };
    const next = migrateDemo(state);
    expect(next.services[0]?.price).toBe("");
    expect(next.services[0]?.duration).toBe("");
    expect(next.services[1]?.price).toBe("120 SEK");
    expect(next.services[1]?.duration).toBe("80 min");
  });
  it("requires a valid configured business email for delivery", () => {
    expect(businessEmail("Email to be added")).toBeUndefined();
    expect(inquiryEmail("", "Inquiry", "Hello")).toBeUndefined();
    expect(businessEmail("salon@example.com")).toBe("salon@example.com");
  });
  it("encodes email inquiry details rather than injecting email fields", () => {
    expect(inquiryEmail("salon@example.com", "A & B", "Name: X\n&bcc=evil@example.com")).toBe("mailto:salon%40example.com?subject=A%20%26%20B&body=Name%3A%20X%0A%26bcc%3Devil%40example.com");
  });
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
