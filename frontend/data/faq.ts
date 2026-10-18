/**
 * FAQ content. Answers are plain text (no markdown).
 * Wellness language only — never claim the lamp treats, cures, prevents or diagnoses anything.
 */

export type FaqItem = { q: string; a: string };
export type FaqGroup = { id: string; title: string; items: FaqItem[] };

export const faqGroups: FaqGroup[] = [
  {
    id: "lamp",
    title: "The lamp",
    items: [
      {
        q: "What is the lamp?",
        a: "A slim, portable bright light lamp that gives up to 10,000 lux at the recommended distance. It is designed to support mood, energy and a regular daily routine, especially on days you spend mostly indoors.",
      },
      {
        q: "What does 10,000 lux mean?",
        a: "Lux measures how much light reaches you. 10,000 lux is roughly the level of a bright overcast morning outdoors, and many times brighter than typical indoor lighting. The figure applies at the recommended distance, and the light drops off as you move further away.",
      },
      {
        q: "Is it UV-free?",
        a: "Yes. The lamp uses UV-free LEDs, so it does not expose your skin or eyes to ultraviolet light. This also means it does not produce vitamin D the way sunlight does.",
      },
      {
        q: "What settings does it have?",
        a: "Three colour temperatures (warm about 2700K, neutral about 4000K and cool about 6500K), several brightness levels, and an auto-off timer you can set from 15 to 60 minutes.",
      },
    ],
  },
  {
    id: "using",
    title: "Using it",
    items: [
      {
        q: "How do I use it?",
        a: "Place the lamp off to one side and sit about 8 to 24 inches (20 to 60 cm) away. Leave it on for 20 to 30 minutes while you have breakfast, read or work. You do not need to look at it, and you should never stare into it.",
      },
      {
        q: "When is the best time to use it?",
        a: "Ideally in the morning, soon after you wake up. Avoid bright light late in the evening, as it can make it harder to wind down. If you work nights, use it near the start of your shift instead.",
      },
      {
        q: "Which colour mode should I choose?",
        a: "Cool or neutral suits morning sessions. Warm is gentler for reading or desk work earlier in the day. In the evening, switch the lamp off and use your usual dim room lights.",
      },
      {
        q: "How soon will I notice a difference?",
        a: "It varies from person to person. Many people find a regular morning routine helps them feel more alert, but consistency matters more than any single session. Give it a steady week or two at a similar time each day.",
      },
    ],
  },
  {
    id: "safety",
    title: "Safety",
    items: [
      {
        q: "Who should check with a doctor first?",
        a: "Please talk to a doctor before using the lamp if you have bipolar disorder, an eye condition such as a retinal condition, glaucoma or cataracts, or take medication that makes you sensitive to light. The same applies if you are pregnant, get light-triggered migraines, or are unsure for any reason.",
      },
      {
        q: "Is it a medical device?",
        a: "No. It is a wellness product that supports mood, energy and routine. It is not designed to diagnose, treat or prevent any condition. If you are considering light for a health reason, please speak to a doctor first.",
      },
      {
        q: "Are there any side effects?",
        a: "Most people notice nothing, or only mild effects at first. Watch for headaches, eye strain, irritability or feeling restless and wired. If any of these happen, stop using the lamp and talk to a doctor.",
      },
      {
        q: "Can children use it?",
        a: "The lamp is designed for adults. Please do not use it with children.",
      },
    ],
  },
  {
    id: "access",
    title: "Early access & delivery",
    items: [
      {
        q: "What does early access mean?",
        a: "It is a simple way to tell us you are interested in the founding batch. You will be among the first to hear when the lamp is ready, and you will be offered founding-batch pricing.",
      },
      {
        q: "Is signing up a commitment to buy?",
        a: "No. Early access is a non-binding expression of interest. There is no obligation on either side, and you can ask us to remove your details at any time.",
      },
      {
        q: "Do I need to pay anything now?",
        a: "No. We do not take any payment when you join early access. If we invite you to buy later, we will share the full price and terms before you pay.",
      },
      {
        q: "When will it ship?",
        a: "We are still testing the founding batch. We will share timelines on WhatsApp, or by email if you prefer, as soon as they are confirmed.",
      },
      {
        q: "Which cities do you deliver to?",
        a: "We are planning pan-India delivery. If there are any limits for the founding batch, we will tell you before you order.",
      },
      {
        q: "Is there a warranty?",
        a: "Warranty details will be confirmed before launch and shared with you before you buy. [Placeholder: final warranty terms to be added.]",
      },
      {
        q: "What is the returns policy?",
        a: "Our returns policy will be published before launch and shared with you before you buy. It will always respect your rights under Indian consumer protection law.",
      },
    ],
  },
];

/** Six picks for the Home page, as "groupId:index". */
export const homeFaqIds: string[] = ["lamp:1", "using:0", "using:1", "safety:0", "access:1", "access:3"];
