"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { Controller, useForm, type FieldPath, type Resolver } from "react-hook-form";
import { ArrowRight, Loader2 } from "lucide-react";
import { Turnstile } from "@marsidev/react-turnstile";
import { INTERESTS, shortLeadSchema, type ShortLead, type ShortLeadInput } from "@/lib/lead-schema";
import { track } from "@/lib/analytics";
import { captureFirstTouch } from "@/lib/utm";
import { cn } from "@/lib/cn";
import { whatsappHref } from "@/lib/format";
import { CheckboxField, ChipGroup, TextField } from "./fields";
import { SuccessState } from "./SuccessState";
import { warmApi } from "@/lib/api";
import { submitLead } from "./submitLead";

const TURNSTILE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";

type Values = ShortLeadInput;

/**
 * Early-access form: name, mobile, city, interests, consent. Kept short on purpose; most visitors
 * arrive from an ad on a phone. Same schema rules as the backend (lib/lead-schema.ts ↔
 * backend/app/schemas.py) and posted as the "short" form to /api/leads, which writes the sheet.
 */
export function LeadForm({ className }: { className?: string }) {
  const formId = useId();
  const [status, setStatus] = useState("");
  const [formError, setFormError] = useState("");
  const [success, setSuccess] = useState<{ leadId: string; name: string } | null>(null);
  const [token, setToken] = useState("");
  // Bumping the key remounts the widget for a fresh token after a failed submit.
  const [turnstileKey, setTurnstileKey] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    captureFirstTouch();
    // The form loads as it nears the viewport, so this wakes a sleeping API well before submit.
    warmApi();
  }, []);

  const {
    register,
    control,
    handleSubmit,
    setError,
    setFocus,
    formState: { errors, isSubmitting },
  } = useForm<Values, unknown, ShortLead>({
    resolver: zodResolver(shortLeadSchema) as unknown as Resolver<Values, unknown, ShortLead>,
    mode: "onTouched",
    defaultValues: { interests: [], whatsapp_opt_in: false, company: "" },
  });

  const onFirstFocus = () => {
    if (started.current) return;
    started.current = true;
    track("form_start", { form: "short" });
  };

  const onSubmit = handleSubmit(async (values) => {
    setFormError("");
    if (TURNSTILE_KEY && !token) {
      setFormError("One moment: we’re checking you’re not a bot. Try again in a second.");
      return;
    }
    setStatus("Sending…");
    const result = await submitLead({ ...values, form: "short", turnstile_token: token || undefined });
    if (result.ok) {
      track("form_submit", { form: "short" });
      setStatus("You’re on the list.");
      setSuccess({ leadId: result.leadId, name: values.name });
      return;
    }
    setTurnstileKey((k) => k + 1);
    setToken("");
    if (result.kind === "fields") {
      const keys = Object.keys(result.fields) as FieldPath<Values>[];
      keys.forEach((k) => setError(k, { message: result.fields[k] }));
      if (keys[0]) setTimeout(() => setFocus(keys[0]), 0);
      setStatus("Please fix the highlighted fields.");
      return;
    }
    setFormError(result.message);
    setStatus(result.message);
  });

  if (success) {
    return (
      <div className={className}>
        <SuccessState name={success.name} leadId={success.leadId} />
        <p className="sr-only" role="status" aria-live="polite">
          {status}
        </p>
      </div>
    );
  }

  return (
    <form
      id={formId}
      onSubmit={onSubmit}
      onFocusCapture={onFirstFocus}
      noValidate
      aria-describedby={`${formId}-status`}
      className={cn("relative grid gap-6", className)}
    >
      {/* Honeypot: hidden from people, tempting to bots */}
      <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label>
          Company
          <input type="text" tabIndex={-1} autoComplete="off" {...register("company")} />
        </label>
      </div>

      <TextField
        label="Your name"
        autoComplete="name"
        placeholder="Full name"
        {...register("name")}
        error={errors.name?.message}
      />
      <div className="grid gap-6 sm:grid-cols-2">
        <TextField
          label="Mobile number"
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          prefix="+91"
          placeholder="98765 43210"
          {...register("phone")}
          error={errors.phone?.message}
        />
        <TextField
          label="City"
          autoComplete="address-level2"
          placeholder="e.g. Pune"
          {...register("city")}
          error={errors.city?.message}
        />
      </div>
      <Controller
        control={control}
        name="interests"
        render={({ field }) => (
          <ChipGroup
            legend="What would you like more of?"
            options={INTERESTS}
            value={(field.value as string[]) ?? []}
            onChange={field.onChange}
            onBlur={field.onBlur}
            error={errors.interests?.message}
          />
        )}
      />
      <div className="grid gap-4 border-t border-line pt-6">
        <CheckboxField {...register("whatsapp_opt_in")} label="Send me early-access updates on WhatsApp. Stop any time." />
        <CheckboxField
          {...register("consent")}
          error={errors.consent?.message}
          label={
            <>
              I agree to share these details so the team can contact me about early access.{" "}
              <span className="text-fg-muted">
                Used only for this, stored securely, never sold. Ask us to delete them any time.{" "}
                <Link href="/privacy" className="underline decoration-accent-fg underline-offset-2 hover-fine:text-fg">
                  Privacy policy
                </Link>
                .
              </span>
            </>
          }
        />
      </div>
      {TURNSTILE_KEY ? (
        <Turnstile
          key={turnstileKey}
          siteKey={TURNSTILE_KEY}
          onSuccess={setToken}
          onExpire={() => setToken("")}
          onError={() => setToken("")}
          options={{ appearance: "interaction-only", size: "flexible", theme: "light" }}
        />
      ) : null}
      <FormError message={formError} />
      <div className="grid gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="group/s relative inline-flex h-16 w-full cursor-pointer items-center justify-center gap-2.5 overflow-hidden rounded-pill bg-[linear-gradient(135deg,#ffc24d,#ff9a5a)] px-8 text-[1.0625rem] font-medium text-fg shadow-[0_1px_0_rgb(255_255_255/0.5)_inset,0_12px_30px_-10px_rgb(255_140_60/0.6)] transition-[scale,box-shadow] duration-[var(--dur-press)] ease-out active:scale-[0.98] disabled:cursor-progress disabled:opacity-85 hover-fine:shadow-[0_1px_0_rgb(255_255_255/0.5)_inset,0_16px_36px_-10px_rgb(255_140_60/0.75)]"
        >
          {isSubmitting ? (
            <>
              <Loader2 aria-hidden className="size-4 animate-spin" /> Sending…
            </>
          ) : (
            <>
              Join the waitlist
              <ArrowRight
                aria-hidden
                className="size-4 transition-transform duration-[var(--dur-ui)] ease-out group-hover/s:translate-x-0.5"
              />
            </>
          )}
        </button>
        <p className="text-center text-[0.8125rem] text-fg-muted">We’ll only contact you about the founding batch.</p>
      </div>

      <p id={`${formId}-status`} role="status" aria-live="polite" className="sr-only">
        {status}
      </p>
    </form>
  );
}

function FormError({ message }: { message: string }) {
  if (!message) return null;
  return (
    <div role="alert" className="rounded-sm border border-danger/40 bg-danger/[0.06] p-4 text-small text-fg">
      {message}{" "}
      <a
        href={whatsappHref("Hi! I tried to join early access on the website.")}
        target="_blank"
        rel="noopener noreferrer"
        className="font-medium underline underline-offset-2"
      >
        Message us on WhatsApp
      </a>
    </div>
  );
}
