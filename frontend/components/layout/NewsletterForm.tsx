"use client";

import { useId, useState, type FormEvent } from "react";
import { ArrowRight, Check } from "lucide-react";
import { cn } from "@/lib/cn";
import { apiUrl } from "@/lib/api";

type Status = "idle" | "submitting" | "done" | "error";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function NewsletterForm() {
  const id = useId();
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const email = String(data.get("email") ?? "").trim();
    if (data.get("company")) return; // honeypot
    if (!EMAIL.test(email)) {
      setStatus("error");
      setMessage("Please enter a valid email address.");
      return;
    }
    setStatus("submitting");
    setMessage("");
    try {
      const res = await fetch(apiUrl("/api/newsletter"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source: "footer", page: window.location.pathname }),
      });
      if (!res.ok) throw new Error(String(res.status));
      setStatus("done");
      setMessage("You're on the list. One calm email a month, at most.");
      form.reset();
    } catch {
      setStatus("error");
      setMessage("That didn't go through. Please try again in a moment.");
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate aria-describedby={`${id}-msg`}>
      <label htmlFor={`${id}-email`} className="text-small font-medium text-ink">
        Notes on light, once a month
      </label>
      <div className="relative mt-3 flex max-w-sm items-center">
        <input
          id={`${id}-email`}
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="you@example.com"
          aria-invalid={status === "error" || undefined}
          className={cn(
            "h-12 w-full rounded-pill border bg-paper pr-14 pl-5 text-ink placeholder:text-ink-muted/80",
            "transition-[border-color] duration-[var(--dur-micro)] ease-[ease] focus-visible:border-ink focus-visible:outline-none",
            status === "error" ? "border-danger" : "border-line-strong/70",
          )}
        />
        <input type="text" name="company" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />
        <button
          type="submit"
          disabled={status === "submitting"}
          aria-label="Subscribe"
          className="absolute right-1 grid size-10 cursor-pointer place-items-center rounded-pill bg-ink text-paper transition-[transform,translate,scale,rotate,background-color] duration-[var(--dur-press)] ease-out active:scale-[0.97] disabled:opacity-60 hover-fine:bg-[#33312d]"
        >
          {status === "done" ? (
            <Check aria-hidden className="size-4" strokeWidth={2} />
          ) : (
            <ArrowRight aria-hidden className="size-4" strokeWidth={2} />
          )}
        </button>
      </div>
      <p
        id={`${id}-msg`}
        role="status"
        aria-live="polite"
        className={cn("mt-2 min-h-5 text-[0.8125rem]", status === "error" ? "text-danger" : "text-ink-muted")}
      >
        {message}
      </p>
    </form>
  );
}
