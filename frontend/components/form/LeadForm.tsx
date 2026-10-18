"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, m, useReducedMotion } from "motion/react";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { Controller, useForm, type FieldPath, type Resolver } from "react-hook-form";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { Turnstile } from "@marsidev/react-turnstile";
import { siteConfig } from "@/site.config";
import { INDIAN_STATES } from "@/data/india";
import {
  HEARD_FROM,
  INTERESTS,
  QUANTITIES,
  STEP_ONE_FIELDS,
  USE_LOCATIONS,
  fullLeadSchema,
  shortLeadSchema,
  type FullLead,
  type FullLeadInput,
} from "@/lib/lead-schema";
import { track } from "@/lib/analytics";
import { captureFirstTouch } from "@/lib/utm";
import { duration, ease, exitOf, spring } from "@/lib/motion";
import { cn } from "@/lib/cn";
import { whatsappHref } from "@/lib/format";
import { CheckboxField, ChipGroup, RadioCards, SelectField, TextField } from "./fields";
import { SuccessState } from "./SuccessState";
import { submitLead } from "./submitLead";

const TURNSTILE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";

type Variant = "short" | "full";
type Values = FullLeadInput;

/**
 * Early-access form. "full" is the two-step form on /early-access (about you → your interest);
 * "short" is the compact Home version (name, phone, city, interest). Same schema rules as the backend.
 */
export function LeadForm({ variant, className }: { variant: Variant; className?: string }) {
  const formId = useId();
  const reduce = useReducedMotion();
  const [step, setStep] = useState<1 | 2>(1);
  const [status, setStatus] = useState("");
  const [formError, setFormError] = useState("");
  const [success, setSuccess] = useState<{ leadId: string; name: string } | null>(null);
  const [token, setToken] = useState("");
  // Bumping the key remounts the widget for a fresh token after a failed submit.
  const [turnstileKey, setTurnstileKey] = useState(0);
  const started = useRef(false);

  useEffect(() => captureFirstTouch(), []);

  const schema = variant === "full" ? fullLeadSchema : shortLeadSchema;
  const {
    register,
    control,
    handleSubmit,
    trigger,
    setError,
    setFocus,
    formState: { errors, isSubmitting },
  } = useForm<Values, unknown, FullLead>({
    resolver: zodResolver(schema) as unknown as Resolver<Values, unknown, FullLead>,
    mode: "onTouched",
    defaultValues: { interests: [], whatsapp_opt_in: false, company: "" },
  });

  const onFirstFocus = () => {
    if (started.current) return;
    started.current = true;
    track("form_start", { form: variant });
  };

  const next = async () => {
    const ok = await trigger([...STEP_ONE_FIELDS], { shouldFocus: true });
    if (!ok) {
      setStatus("Please fix the highlighted fields.");
      return;
    }
    setStatus("Step 2 of 2: your interest.");
    setStep(2);
  };

  const onSubmit = handleSubmit(async (values) => {
    setFormError("");
    if (TURNSTILE_KEY && !token) {
      setFormError("One moment: we’re checking you’re not a bot. Try again in a second.");
      return;
    }
    setStatus("Sending…");
    const result = await submitLead({ ...values, form: variant, turnstile_token: token || undefined });
    if (result.ok) {
      track("form_submit", { form: variant });
      setStatus("You’re on the list.");
      setSuccess({ leadId: result.leadId, name: values.name });
      return;
    }
    setTurnstileKey((k) => k + 1);
    setToken("");
    if (result.kind === "fields") {
      const keys = Object.keys(result.fields) as FieldPath<Values>[];
      keys.forEach((k) => setError(k, { message: result.fields[k] }));
      if (variant === "full" && keys.some((k) => (STEP_ONE_FIELDS as readonly string[]).includes(k))) setStep(1);
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

  const stepMotion = reduce
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : {
        initial: { opacity: 0, transform: "translateX(16px)" },
        animate: { opacity: 1, transform: "translateX(0px)" },
        exit: {
          opacity: 0,
          transform: "translateX(-16px)",
          transition: { duration: exitOf(duration.ui), ease: ease.out },
        },
      };

  const interestsField = (
    <Controller
      control={control}
      name="interests"
      render={({ field }) => (
        <ChipGroup
          legend={variant === "full" ? "What interests you most?" : "What would you use it for?"}
          options={INTERESTS}
          value={(field.value as string[]) ?? []}
          onChange={field.onChange}
          onBlur={field.onBlur}
          error={errors.interests?.message}
        />
      )}
    />
  );

  const consentFields = (
    <div className="space-y-4">
      <CheckboxField
        {...register("whatsapp_opt_in")}
        label="Send me early-access updates on WhatsApp. You can stop them any time."
      />
      <CheckboxField
        {...register("consent")}
        error={errors.consent?.message}
        label={
          <>
            I agree to share these details so the team can contact me about early access.{" "}
            <span className="text-ink-muted">
              We collect your name, contact details, city and preferences only for this purpose, store them securely and
              never sell them. You can ask us to delete them at any time.{" "}
              <Link href="/privacy" className="underline decoration-sun-600 underline-offset-2 hover-fine:text-sun-800">
                Privacy policy
              </Link>
              .
            </span>
          </>
        }
      />
    </div>
  );

  const submitButton = (
    <button
      type="submit"
      disabled={isSubmitting}
      className="inline-flex h-[52px] w-full cursor-pointer items-center justify-center gap-2 rounded-pill bg-ink px-7 text-base font-semibold text-paper transition-[scale,background-color] duration-[var(--dur-press)] ease-out active:scale-[0.97] disabled:cursor-progress disabled:opacity-80 sm:w-auto hover-fine:bg-[#33312d]"
    >
      {isSubmitting ? (
        <>
          <Loader2 aria-hidden className="size-4 animate-spin" /> Sending…
        </>
      ) : (
        <>
          Join early access <ArrowRight aria-hidden className="size-4" />
        </>
      )}
    </button>
  );

  const turnstile = TURNSTILE_KEY ? (
    <Turnstile
      key={turnstileKey}
      siteKey={TURNSTILE_KEY}
      onSuccess={setToken}
      onExpire={() => setToken("")}
      onError={() => setToken("")}
      options={{ appearance: "interaction-only", size: "flexible", theme: "light" }}
    />
  ) : null;

  return (
    <form
      id={formId}
      onSubmit={onSubmit}
      onFocusCapture={onFirstFocus}
      noValidate
      aria-describedby={`${formId}-status`}
      className={cn("relative", className)}
    >
      {/* Honeypot: hidden from people, tempting to bots */}
      <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label>
          Company
          <input type="text" tabIndex={-1} autoComplete="off" {...register("company")} />
        </label>
      </div>

      {variant === "full" && <StepProgress step={step} />}

      {variant === "short" ? (
        <div className="grid gap-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <TextField
              label="Full name"
              autoComplete="name"
              placeholder="Your name"
              {...register("name")}
              error={errors.name?.message}
            />
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
          </div>
          <TextField
            label="City"
            autoComplete="address-level2"
            placeholder="Pune"
            {...register("city")}
            error={errors.city?.message}
          />
          {interestsField}
          {consentFields}
          {turnstile}
          <FormError message={formError} />
          <div>{submitButton}</div>
        </div>
      ) : (
        <AnimatePresence mode="wait" initial={false}>
          {step === 1 ? (
            <m.fieldset
              key="s1"
              {...stepMotion}
              transition={{ duration: duration.ui, ease: ease.out }}
              className="grid gap-5"
            >
              <legend className="sr-only">About you</legend>
              <TextField
                label="Full name"
                autoComplete="name"
                placeholder="Your name"
                {...register("name")}
                error={errors.name?.message}
              />
              <div className="grid gap-5 sm:grid-cols-2">
                <TextField
                  label="Email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  {...register("email")}
                  error={errors.email?.message}
                />
                <TextField
                  label="Mobile number"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel-national"
                  prefix="+91"
                  placeholder="98765 43210"
                  hint="We’ll reply on WhatsApp if you opt in."
                  {...register("phone")}
                  error={errors.phone?.message}
                />
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <TextField
                  label="City"
                  autoComplete="address-level2"
                  placeholder="Pune"
                  {...register("city")}
                  error={errors.city?.message}
                />
                <SelectField
                  label="State"
                  options={INDIAN_STATES}
                  placeholder="Choose your state"
                  {...register("state")}
                  error={errors.state?.message}
                />
              </div>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={next}
                  className="inline-flex h-[52px] w-full cursor-pointer items-center justify-center gap-2 rounded-pill bg-ink px-7 text-base font-semibold text-paper transition-[scale,background-color] duration-[var(--dur-press)] ease-out active:scale-[0.97] sm:w-auto hover-fine:bg-[#33312d]"
                >
                  Continue <ArrowRight aria-hidden className="size-4" />
                </button>
              </div>
            </m.fieldset>
          ) : (
            <m.fieldset
              key="s2"
              {...stepMotion}
              transition={{ duration: duration.ui, ease: ease.out }}
              className="grid gap-7"
            >
              <legend className="sr-only">Your interest</legend>
              {interestsField}
              <Controller
                control={control}
                name="use_location"
                render={({ field }) => (
                  <RadioCards
                    legend="Where would you use it?"
                    name={field.name}
                    options={USE_LOCATIONS}
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    error={errors.use_location?.message}
                  />
                )}
              />
              <Controller
                control={control}
                name="quantity"
                render={({ field }) => (
                  <RadioCards
                    legend="How many?"
                    name={field.name}
                    options={QUANTITIES}
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    error={errors.quantity?.message}
                  />
                )}
              />
              <div className="grid gap-5 sm:grid-cols-2">
                <SelectField
                  label="Expected budget"
                  options={siteConfig.budgetRanges}
                  placeholder="Choose a range"
                  {...register("budget")}
                  error={errors.budget?.message}
                />
                <SelectField
                  label="How did you hear about us?"
                  options={HEARD_FROM}
                  placeholder="Choose one"
                  {...register("heard_from")}
                  error={errors.heard_from?.message}
                />
              </div>
              {consentFields}
              {turnstile}
              <FormError message={formError} />
              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center">
                <button
                  type="button"
                  onClick={() => {
                    setStep(1);
                    setStatus("Step 1 of 2: about you.");
                  }}
                  className="inline-flex h-[52px] cursor-pointer items-center justify-center gap-2 rounded-pill px-5 text-base font-semibold text-ink transition-[scale,background-color] duration-[var(--dur-press)] ease-out active:scale-[0.97] hover-fine:bg-ink/[0.05]"
                >
                  <ArrowLeft aria-hidden className="size-4" /> Back
                </button>
                {submitButton}
              </div>
            </m.fieldset>
          )}
        </AnimatePresence>
      )}

      <p id={`${formId}-status`} role="status" aria-live="polite" className="sr-only">
        {status}
      </p>
    </form>
  );
}

function StepProgress({ step }: { step: 1 | 2 }) {
  return (
    <div className="mb-8">
      <div className="mb-3 flex items-baseline justify-between font-mono text-label tracking-[0.08em] uppercase">
        <span className="text-ink">{step === 1 ? "About you" : "Your interest"}</span>
        <span className="tabular text-ink-muted">Step {step} of 2</span>
      </div>
      <div
        className="h-1 overflow-hidden rounded-full bg-ink/[0.08]"
        role="progressbar"
        aria-label="Form progress"
        aria-valuemin={1}
        aria-valuemax={2}
        aria-valuenow={step}
      >
        <m.div
          className="h-full origin-left rounded-full bg-[linear-gradient(90deg,var(--sun-400),var(--sun-600))]"
          initial={false}
          animate={{ transform: `scaleX(${step / 2})` }}
          transition={spring.ui}
        />
      </div>
    </div>
  );
}

function FormError({ message }: { message: string }) {
  if (!message) return null;
  return (
    <div role="alert" className="rounded-sm border border-danger/30 bg-danger/[0.04] p-4 text-small text-ink">
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
