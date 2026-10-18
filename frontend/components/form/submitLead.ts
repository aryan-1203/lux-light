import { apiUrl } from "@/lib/api";
import { getFirstTouch } from "@/lib/utm";
import type { FullLead, ShortLead } from "@/lib/lead-schema";

export type SubmitResult =
  | { ok: true; leadId: string; updated: boolean; queued: boolean }
  | { ok: false; kind: "fields"; fields: Record<string, string> }
  | { ok: false; kind: "verification" | "rate" | "network" | "server"; message: string };

type Payload = (ShortLead | FullLead) & { form: "short" | "full"; turnstile_token?: string };

/** POST /api/leads. Maps the backend's error shapes onto form-friendly results. */
export async function submitLead(data: Payload): Promise<SubmitResult> {
  const body = { ...getFirstTouch(), ...data };
  let res: Response;
  try {
    res = await fetch(apiUrl("/api/leads"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    return {
      ok: false,
      kind: "network",
      message: "We couldn’t reach our server. Check your connection, or message us on WhatsApp instead.",
    };
  }

  if (res.status === 200 || res.status === 202) {
    const json = (await res.json().catch(() => ({}))) as { lead_id?: string; updated?: boolean; queued?: boolean };
    return { ok: true, leadId: json.lead_id ?? "", updated: Boolean(json.updated), queued: Boolean(json.queued) };
  }
  if (res.status === 422) {
    const json = (await res.json().catch(() => ({}))) as { detail?: { loc?: (string | number)[]; msg?: string }[] };
    const fields: Record<string, string> = {};
    for (const d of json.detail ?? []) {
      const key = String(d.loc?.[d.loc.length - 1] ?? "");
      if (key && !fields[key]) fields[key] = cleanMessage(d.msg);
    }
    return { ok: false, kind: "fields", fields };
  }
  if (res.status === 400) {
    return { ok: false, kind: "verification", message: "We couldn’t confirm you’re human. Please try again." };
  }
  if (res.status === 429) {
    return { ok: false, kind: "rate", message: "That’s a few too many tries. Please wait a minute and submit again." };
  }
  return {
    ok: false,
    kind: "server",
    message: "Something went wrong on our side. Please try again, or message us on WhatsApp.",
  };
}

function cleanMessage(msg?: string) {
  if (!msg) return "Please check this field.";
  return msg.replace(/^Value error, /, "");
}
