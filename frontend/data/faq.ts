/**
 * FAQ content. Answers are plain text (no markdown).
 * Wellness language only: never claim the lamp treats, cures, prevents or diagnoses anything.
 * Usage and safety answers follow the sources in data/science.ts (Yale, UBC/Edmonds, FPnotebook).
 */

export type FaqItem = { q: string; a: string };
export type FaqGroup = { id: string; title: string; items: FaqItem[] };

export const faqGroups: FaqGroup[] = [
  {
    id: "lamp",
    title: "The lamp",
    items: [
      {
        q: "What is it?",
        a: "A desk light panel that gives 10,000 lux at the recommended distance, on an adjustable arm and a steady base. It is designed to make your mornings brighter, especially on days you spend mostly indoors.",
      },
      {
        q: "What does 10,000 lux actually mean?",
        a: "Lux measures how much light reaches a surface, in this case your eyes. A typical home sits around 50 to 200 lux and an office around 200 to 400. 10,000 lux is the level used in most light therapy research. The figure only holds at the stated distance: the light drops quickly as you move further away.",
      },
      {
        q: "Is it UV-free?",
        a: "Yes. The diffuser filters UV, so it does not expose your skin or eyes to ultraviolet light. It also means it does not make vitamin D the way sunlight does.",
      },
    ],
  },
  {
    id: "using",
    title: "Using it",
    items: [
      {
        q: "How do I use it?",
        a: "Set it slightly above eye level and angled down, a little to one side, at the distance in the quick-start guide. Then carry on with breakfast, reading or work for about 30 minutes. You do not need to look at it, and you should not stare into it.",
      },
      {
        q: "When is the best time?",
        a: "In the morning, soon after you wake, at about the same time every day including weekends. Avoid bright light late in the evening, as it can make it harder to fall asleep.",
      },
      {
        q: "How soon will I notice anything?",
        a: "It varies from person to person, and consistency matters more than any single session. Give a steady routine a week or two at a similar time each day.",
      },
    ],
  },
  {
    id: "safety",
    title: "Safety",
    items: [
      {
        q: "Who should check with a doctor first?",
        a: "Please talk to a doctor first if you have bipolar disorder, an eye or retinal condition, diabetes, or take medication that makes you sensitive to light, and see an eye doctor first if you are over 65. If you have felt low most days, or have any thoughts of self-harm, please speak to a doctor rather than relying on a lamp.",
      },
      {
        q: "Is it a medical device?",
        a: "No. It is a wellness product. It is not designed to diagnose, treat, cure or prevent any condition. The research on this page studied bright light therapy in general, not this lamp.",
      },
      {
        q: "Are there side effects?",
        a: "Most people notice nothing, or mild effects at first, such as a headache, eye strain or feeling a little edgy. These usually ease by sitting a little further away or shortening sessions. If they don't, stop and talk to a doctor.",
      },
    ],
  },
  {
    id: "access",
    title: "Early access",
    items: [
      {
        q: "Is joining early access a commitment to buy?",
        a: "No. It is a free, non-binding way to say you are interested. You will hear first when the founding batch is ready and be offered founding-batch pricing. You can ask us to remove your details at any time.",
      },
      {
        q: "Do I pay anything now?",
        a: "No. We do not take any payment when you join. If we invite you to buy later, we will share the full price, warranty and returns terms before you pay.",
      },
      {
        q: "When will it ship, and where?",
        a: "We are still testing the founding batch and planning pan-India delivery. We will share confirmed timelines on WhatsApp or by phone as soon as we have them.",
      },
    ],
  },
];
