import * as React from "react";
import { render } from "react-email";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { TEMPLATES } from "@/lib/email-templates/registry";
import {
  EMAIL_SENDER_DOMAIN,
  INQUIRY_BCC_ADDRESS,
  INQUIRY_FROM_ADDRESS,
  INQUIRY_FROM_NAME,
  formatFrom,
} from "@/lib/email/config.server";

interface EnqueueOptions {
  templateName: string;
  to: string;
  templateData: Record<string, unknown>;
  replyTo?: string;
  idempotencyKey: string;
  /** When true, also enqueue a copy to INQUIRY_BCC_ADDRESS. */
  bcc?: boolean;
}

function randomToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function ensureUnsubscribeToken(email: string): Promise<string> {
  const normalized = email.toLowerCase();
  const { data: existing } = await supabaseAdmin
    .from("email_unsubscribe_tokens")
    .select("token, used_at")
    .eq("email", normalized)
    .maybeSingle();
  if (existing && !existing.used_at) return existing.token;
  const token = randomToken();
  await supabaseAdmin
    .from("email_unsubscribe_tokens")
    .upsert(
      { token, email: normalized },
      { onConflict: "email", ignoreDuplicates: true },
    );
  const { data: stored } = await supabaseAdmin
    .from("email_unsubscribe_tokens")
    .select("token")
    .eq("email", normalized)
    .maybeSingle();
  return stored?.token ?? token;
}

async function enqueueOne(params: {
  templateName: string;
  to: string;
  html: string;
  text: string;
  subject: string;
  replyTo?: string;
  idempotencyKey: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const { templateName, to, html, text, subject, replyTo, idempotencyKey } =
    params;

  const { data: suppressed } = await supabaseAdmin
    .from("suppressed_emails")
    .select("id")
    .eq("email", to.toLowerCase())
    .maybeSingle();
  if (suppressed) {
    await supabaseAdmin.from("email_send_log").insert({
      message_id: crypto.randomUUID(),
      template_name: templateName,
      recipient_email: to,
      status: "suppressed",
    });
    return { ok: false, error: "suppressed" };
  }

  const unsubscribeToken = await ensureUnsubscribeToken(to);
  const messageId = crypto.randomUUID();

  await supabaseAdmin.from("email_send_log").insert({
    message_id: messageId,
    template_name: templateName,
    recipient_email: to,
    status: "pending",
  });

  const { error } = await supabaseAdmin.rpc("enqueue_email", {
    queue_name: "transactional_emails",
    payload: {
      message_id: messageId,
      to,
      from: formatFrom(INQUIRY_FROM_NAME, INQUIRY_FROM_ADDRESS),
      sender_domain: EMAIL_SENDER_DOMAIN,
      subject,
      html,
      text,
      purpose: "transactional",
      label: templateName,
      idempotency_key: idempotencyKey,
      unsubscribe_token: unsubscribeToken,
      reply_to: replyTo,
      queued_at: new Date().toISOString(),
    },
  });

  if (error) {
    await supabaseAdmin.from("email_send_log").insert({
      message_id: messageId,
      template_name: templateName,
      recipient_email: to,
      status: "failed",
      error_message: error.message,
    });
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

/**
 * Render a registered template and enqueue it (with optional BCC copy).
 * Throws if the primary send fails to enqueue; BCC failures are logged but
 * do not block the primary send from being reported as successful.
 */
export async function sendTemplatedEmail(opts: EnqueueOptions): Promise<void> {
  const entry = TEMPLATES[opts.templateName];
  if (!entry) throw new Error(`Unknown template: ${opts.templateName}`);

  const element = React.createElement(entry.component, opts.templateData);
  const html = await render(element);
  const text = await render(element, { plainText: true });
  const subject =
    typeof entry.subject === "function"
      ? entry.subject(opts.templateData)
      : entry.subject;

  const primary = await enqueueOne({
    templateName: opts.templateName,
    to: opts.to,
    html,
    text,
    subject,
    replyTo: opts.replyTo,
    idempotencyKey: opts.idempotencyKey,
  });
  if (!primary.ok) {
    throw new Error(`Enqueue failed: ${primary.error}`);
  }

  if (opts.bcc && INQUIRY_BCC_ADDRESS && INQUIRY_BCC_ADDRESS !== opts.to) {
    const bccElement = React.createElement(entry.component, {
      ...opts.templateData,
      isBccCopy: true,
    });
    const bccHtml = await render(bccElement);
    const bccText = await render(bccElement, { plainText: true });
    const bccResult = await enqueueOne({
      templateName: `${opts.templateName}-bcc`,
      to: INQUIRY_BCC_ADDRESS,
      html: bccHtml,
      text: bccText,
      subject: `[BCC] ${subject}`,
      replyTo: opts.replyTo,
      idempotencyKey: `${opts.idempotencyKey}-bcc`,
    });
    if (!bccResult.ok) {
      console.warn("BCC copy failed to enqueue", { error: bccResult.error });
    }
  }
}
