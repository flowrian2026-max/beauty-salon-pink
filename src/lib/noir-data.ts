import { z } from "zod";
import campaign from "@/assets/noir-campaign.jpg";
import nails from "@/assets/nails.jpg";
import hair from "@/assets/hair.jpg";
import skin from "@/assets/skincare.jpg";
import manicureBefore from "@/assets/manicure-before.jpg";
import manicureAfter from "@/assets/manicure-after.png";
export const images = { campaign, nails, hair, skin, manicureBefore, manicureAfter };
export function comparisonSplit(clientX: number, left: number, width: number) {
  return width <= 0 ? 50 : Math.min(100, Math.max(0, ((clientX - left) / width) * 100));
}
export function migrateComparison(data: DemoState): DemoState {
  return data.before === skin && data.after === campaign
    ? { ...data, before: manicureBefore, after: manicureAfter }
    : data;
}
export const serviceSchema = z.object({
  id: z.string(),
  title: z.string().trim().min(1).max(70),
  description: z.string().trim().max(300),
  price: z.string().trim().min(1).max(40),
  duration: z.string().trim().min(1).max(40),
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
  date: z.string().min(1, "Choose a date"),
  time: z.string().min(1, "Choose a time"),
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
      price: "From 65",
      duration: "60–90 min",
      image: nails,
    },
    {
      id: "hair",
      title: "HAIR STYLING",
      description: "Effortless movement, striking silhouettes. Your next signature look.",
      price: "From 85",
      duration: "60–120 min",
      image: hair,
    },
    {
      id: "makeup",
      title: "MAKEUP",
      description: "From understated radiance to unapologetic expression.",
      price: "From 75",
      duration: "60 min",
      image: campaign,
    },
    {
      id: "skin",
      title: "SKINCARE",
      description: "A moment to reset. A ritual dedicated to your skin.",
      price: "From 90",
      duration: "75 min",
      image: skin,
    },
    {
      id: "manicure",
      title: "MANICURE",
      description: "Beautifully considered care, finished with precision.",
      price: "From 40",
      duration: "45 min",
      image: nails,
    },
    {
      id: "pedicure",
      title: "PEDICURE",
      description: "A restorative ritual with an impeccably polished finish.",
      price: "From 50",
      duration: "60 min",
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
  accent: "#FF2D95",
  before: manicureBefore,
  after: manicureAfter,
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
