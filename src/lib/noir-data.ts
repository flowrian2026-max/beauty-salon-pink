import { z } from "zod";
import campaign from "@/assets/noir-campaign.jpg";
import nails from "@/assets/nails.jpg";
import hair from "@/assets/hair.jpg";
import skin from "@/assets/skincare.jpg";
import manicureBefore from "@/assets/manicure-before.jpg";
import manicureAfter from "@/assets/manicure-after.png";
import makeupBefore from "@/assets/makeup-before.jpg";
import makeupAfter from "@/assets/makeup-after.jpg";
export const images = { campaign, nails, hair, skin, manicureBefore, manicureAfter, makeupBefore, makeupAfter };
export function comparisonSplit(clientX: number, left: number, width: number) {
  return width <= 0 ? 50 : Math.min(100, Math.max(0, ((clientX - left) / width) * 100));
}
export function migrateComparison(data: DemoState): DemoState {
  const legacy = (data.before === skin && data.after === campaign) || (data.before === manicureBefore && data.after === manicureAfter);
  return legacy
    ? { ...data, before: makeupBefore, after: makeupAfter }
    : data;
}
export const serviceSchema = z.object({
  id: z.string(),
  title: z.string().trim().min(1).max(70),
  description: z.string().trim().max(300),
  price: z.string().trim().max(40),
  duration: z.string().trim().max(40),
  image: z.string().max(3000000),
});
export type Service = z.infer<typeof serviceSchema>;
export const gallerySchema = z.object({
  id: z.string(),
  title: z.string().trim().min(1).max(100),
  category: z.enum(["NAILS", "HAIR", "MAKEUP", "SKINCARE"]),
  image: z.string().max(3000000),
});
export type GalleryItem = z.infer<typeof gallerySchema>;
export const bookingSchema = z.object({
  service: z.string().min(1, "Choose a service"),
  name: z.string().trim().min(2, "Enter your name").max(100),
  email: z.string().trim().email("Enter a valid email").max(255),
  phone: z.string().trim().max(30),
  date: z.string().regex(/^(\d{4}-\d{2}-\d{2})?$/, "Enter a valid date"),
  time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$|^$/, "Enter a valid time"),
  message: z.string().trim().max(1000, "Keep your message under 1,000 characters").default(""),
});
export const contactSchema = z.object({
  name: z.string().trim().min(2, "Enter your name").max(100),
  email: z.string().trim().email("Enter a valid email").max(255),
  message: z.string().trim().min(5, "Please add a message").max(1000),
});
export type Booking = z.infer<typeof bookingSchema> & { id: string };
export const defaults = {
  services: [
    {
      id: "nails",
      title: "NAIL ART",
      description:
        "Small details. A bold statement. Sculptural designs made for your individuality.",
      price: "",
      duration: "",
      image: nails,
    },
    {
      id: "hair",
      title: "HAIR STYLING",
      description: "Effortless movement, striking silhouettes. Your next signature look.",
      price: "",
      duration: "",
      image: hair,
    },
    {
      id: "makeup",
      title: "MAKEUP",
      description: "From understated radiance to unapologetic expression.",
      price: "",
      duration: "",
      image: campaign,
    },
    {
      id: "skin",
      title: "SKINCARE",
      description: "A moment to reset. A ritual dedicated to your skin.",
      price: "",
      duration: "",
      image: skin,
    },
    {
      id: "manicure",
      title: "MANICURE",
      description: "Beautifully considered care, finished with precision.",
      price: "",
      duration: "",
      image: nails,
    },
    {
      id: "pedicure",
      title: "PEDICURE",
      description: "A restorative ritual with an impeccably polished finish.",
      price: "",
      duration: "",
      image: skin,
    },
  ],
  gallery: [
    { id: "g1", title: "Chrome in bloom", category: "NAILS", image: nails },
    { id: "g2", title: "After dark", category: "MAKEUP", image: campaign },
    { id: "g3", title: "The art of movement", category: "HAIR", image: hair },
    { id: "g4", title: "Bare luminosity", category: "SKINCARE", image: skin },
  ] as GalleryItem[],
  bookings: [] as Booking[],
  contact: {
    address: "Address to be added",
    phone: "Phone to be added",
    email: "Email to be added",
    hours: "Opening hours to be added",
    instagram: "",
    tiktok: "",
  },
  accent: "#D694AE",
  before: makeupBefore,
  after: makeupAfter,
  story:
    "A space for self-expression. A different perspective on beauty. At NOIR PINK, creativity and considered detail come together to make every look distinctly yours.",
};
export const stateSchema = z.object({
  services: z.array(serviceSchema),
  gallery: z.array(gallerySchema),
  bookings: z.array(bookingSchema.extend({ id: z.string() })),
  contact: z.object({
    address: z.string().max(300),
    phone: z.string().max(100),
    email: z.string().max(255),
    hours: z.string().max(300),
    instagram: z.string().max(500),
    tiktok: z.string().max(500),
  }),
  accent: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  before: z.string().max(3000000),
  after: z.string().max(3000000),
  story: z.string().max(2000),
});
export type DemoState = z.infer<typeof stateSchema>;
export function migrateDemo(data: DemoState): DemoState {
  const legacy = ["From 65", "From 85", "From 75", "From 90", "From 40", "From 50"];
  const durations = ["60–90 min", "60–120 min", "60 min", "75 min", "45 min", "60 min"];
  const ids = ["nails", "hair", "makeup", "skin", "manicure", "pedicure"];
  return migrateComparison({ ...data, accent: data.accent === "#FF2D95" ? defaults.accent : data.accent,
    services: data.services.map(s => {
      const i = ids.indexOf(s.id);
      return i >= 0 ? { ...s, price: s.price === legacy[i] ? "" : s.price, duration: s.duration === durations[i] ? "" : s.duration } : s;
    }) });
}
export function businessEmail(value: string) {
  const parsed = z.string().trim().email().max(255).safeParse(value);
  return parsed.success ? parsed.data : undefined;
}
export function inquiryEmail(recipient: string, subject: string, body: string) {
  const email = businessEmail(recipient);
  if (!email || subject.length > 200 || body.length > 4000) return undefined;
  return `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
export function filterGallery(items: GalleryItem[], category: string) {
  return category === "ALL" ? items : items.filter((item) => item.category === category);
}
export function safeSocial(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.href : undefined;
  } catch {
    return undefined;
  }
}
export function pageHead(title: string, description: string) {
  return {
    meta: [
      { title: `${title} — NOIR PINK` },
      { name: "description", content: description },
      { property: "og:title", content: `${title} — NOIR PINK` },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  };
}
