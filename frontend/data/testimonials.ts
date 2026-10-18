export type Testimonial = {
  id: string;
  quote: string;
  name: string;
  role: string;
  city: string;
  placeholder: true;
  note: string;
};

// PLACEHOLDER — replace with real customer reviews before launch. Fake reviews are not allowed under ASCI guidelines.
export const testimonials: Testimonial[] = [
  {
    id: "placeholder-morning-routine",
    quote:
      "Sample: A short line about how the lamp fits into their morning routine, alongside chai or the newspaper — replace with a real review.",
    name: "Customer name",
    role: "Role / profession",
    city: "City",
    placeholder: true,
    note: "PLACEHOLDER — replace with real customer review",
  },
  {
    id: "placeholder-wfh-desk",
    quote:
      "Sample: A line about using the lamp at a work-from-home desk with little daylight — replace with a real review.",
    name: "Customer name",
    role: "Role / profession",
    city: "City",
    placeholder: true,
    note: "PLACEHOLDER — replace with real customer review",
  },
  {
    id: "placeholder-night-shift",
    quote:
      "Sample: A line about how a night-shift worker times the lamp at the start of their shift — replace with a real review.",
    name: "Customer name",
    role: "Role / profession",
    city: "City",
    placeholder: true,
    note: "PLACEHOLDER — replace with real customer review",
  },
  {
    id: "placeholder-winter-fog",
    quote:
      "Sample: A line about keeping a morning light routine through grey, foggy winter weeks — replace with a real review.",
    name: "Customer name",
    role: "Role / profession",
    city: "City",
    placeholder: true,
    note: "PLACEHOLDER — replace with real customer review",
  },
  {
    id: "placeholder-gift-parents",
    quote:
      "Sample: A line about gifting the lamp to parents and how they set it up at home — replace with a real review.",
    name: "Customer name",
    role: "Role / profession",
    city: "City",
    placeholder: true,
    note: "PLACEHOLDER — replace with real customer review",
  },
  {
    id: "placeholder-monsoon",
    quote: "Sample: A line about using the lamp on heavy, overcast monsoon mornings — replace with a real review.",
    name: "Customer name",
    role: "Role / profession",
    city: "City",
    placeholder: true,
    note: "PLACEHOLDER — replace with real customer review",
  },
];

export const featuredTestimonialId = "placeholder-morning-routine";
