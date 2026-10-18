/**
 * Interest-form schema. Mirrors backend/app/schemas.py exactly (field names, enums, rules).
 * If you change one, change the other.
 */
import { z } from "zod";
import { siteConfig } from "@/site.config";

export const INTERESTS = [
  { value: "mood", label: "Mood" },
  { value: "energy", label: "Energy" },
  { value: "sleep_routine", label: "Sleep routine" },
  { value: "focus", label: "Focus" },
  { value: "shift_work", label: "Shift work" },
  { value: "gifting", label: "Gifting" },
] as const;

export const USE_LOCATIONS = [
  { value: "home", label: "Home" },
  { value: "office", label: "Office" },
  { value: "both", label: "Both" },
] as const;

export const QUANTITIES = [
  { value: "1", label: "Just one" },
  { value: "2-5", label: "2–5" },
  { value: "bulk", label: "Corporate / bulk" },
] as const;

export const HEARD_FROM = [
  "Instagram",
  "Friend or family",
  "Google search",
  "YouTube",
  "WhatsApp",
  "LinkedIn",
  "News or blog",
  "Other",
] as const;

type Values<T extends readonly { value: string }[]> = T[number]["value"];
const interestValues = INTERESTS.map((i) => i.value) as [Values<typeof INTERESTS>, ...Values<typeof INTERESTS>[]];

/** Accepts "+91 98765 43210", "09876543210", "919876543210" etc. Returns 10 digits. */
export function normalisePhone(raw: string): string {
  let d = raw.replace(/\D/g, "");
  if (d.length === 12 && d.startsWith("91")) d = d.slice(2);
  else if (d.length === 11 && d.startsWith("0")) d = d.slice(1);
  return d;
}

const name = z
  .string()
  .trim()
  .min(2, "Please enter your full name.")
  .max(80, "That name is a little long. 80 characters at most.");

const phone = z
  .string()
  .trim()
  .min(1, "Please enter your mobile number.")
  .transform(normalisePhone)
  .refine((v) => /^[6-9]\d{9}$/.test(v), "Enter a 10-digit Indian mobile number starting with 6, 7, 8 or 9.");

const city = z.string().trim().min(2, "Which city are you in?").max(60);

const interests = z
  .array(z.enum(interestValues))
  .min(1, "Pick at least one.")
  .refine((v) => new Set(v).size === v.length);

const consent = z.literal(true, { error: "Please agree so we can contact you about early access." });

const hidden = {
  utm_source: z.string().max(300).optional(),
  utm_medium: z.string().max(300).optional(),
  utm_campaign: z.string().max(300).optional(),
  landing_page: z.string().max(300).optional(),
  referrer: z.string().max(300).optional(),
  company: z.string().max(0).optional(), // honeypot
};

export const shortLeadSchema = z.object({
  name,
  phone,
  city,
  interests,
  consent,
  whatsapp_opt_in: z.boolean(),
  ...hidden,
});

export const fullLeadSchema = shortLeadSchema.extend({
  email: z.email("Enter a valid email address.").trim().toLowerCase(),
  state: z.string().min(2, "Choose your state."),
  use_location: z.enum(["home", "office", "both"], { error: "Where would you use it?" }),
  quantity: z.enum(["1", "2-5", "bulk"], { error: "How many are you thinking of?" }),
  budget: z.enum(siteConfig.budgetRanges, { error: "Pick a budget range." }),
  heard_from: z.enum(HEARD_FROM, { error: "Let us know how you heard about us." }),
});

export type ShortLeadInput = z.input<typeof shortLeadSchema>;
export type FullLeadInput = z.input<typeof fullLeadSchema>;
export type FullLead = z.output<typeof fullLeadSchema>;
export type ShortLead = z.output<typeof shortLeadSchema>;

/** Fields validated on step 1 of the two-step form. */
export const STEP_ONE_FIELDS = ["name", "email", "phone", "city", "state"] as const;
