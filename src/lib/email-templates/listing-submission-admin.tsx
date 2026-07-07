import * as React from "react";
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import type { TemplateEntry } from "./registry";

export interface ListingSubmissionAdminProps {
  authorName?: string;
  authorEmail?: string;
  neighborhood?: string;
  housingType?: string;
  summary?: string;
  availabilities?: string;
  listingId?: string;
  moderationUrl?: string;
}

const main: React.CSSProperties = {
  backgroundColor: "#ffffff",
  fontFamily: "Inter, Arial, sans-serif",
  color: "#1a1a1a",
};

const container: React.CSSProperties = {
  margin: "0 auto",
  padding: "32px 24px",
  maxWidth: "560px",
};

const heading: React.CSSProperties = {
  fontFamily: "Fraunces, Georgia, serif",
  fontSize: "24px",
  fontWeight: 500,
  margin: "0 0 16px",
};

const label: React.CSSProperties = {
  fontSize: "12px",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  color: "#6b7280",
  margin: "16px 0 4px",
};

const value: React.CSSProperties = {
  fontSize: "15px",
  margin: 0,
  lineHeight: "22px",
};

const idBox: React.CSSProperties = {
  backgroundColor: "#f5f5f4",
  borderRadius: "8px",
  padding: "12px 14px",
  fontSize: "13px",
  wordBreak: "break-all",
  margin: "8px 0 0",
  fontFamily: "monospace",
};

const footer: React.CSSProperties = {
  fontSize: "12px",
  color: "#6b7280",
  marginTop: "24px",
};

const button: React.CSSProperties = {
  backgroundColor: "#c2410c",
  color: "#ffffff",
  padding: "12px 20px",
  borderRadius: "999px",
  fontSize: "14px",
  fontWeight: 500,
  textDecoration: "none",
  display: "inline-block",
};

const Email = ({
  authorName,
  authorEmail,
  neighborhood,
  housingType,
  summary,
  availabilities,
  listingId,
  moderationUrl,
}: ListingSubmissionAdminProps) => (
  <Html lang="fr" dir="ltr">
    <Head />
    <Preview>Nouvelle annonce en attente de modération</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={heading}>Nouvelle annonce soumise</Heading>
        <Text style={value}>
          Une nouvelle annonce a été soumise et est en attente de modération.
        </Text>

        {moderationUrl ? (
          <Section style={{ margin: "20px 0 8px" }}>
            <Button href={moderationUrl} style={button}>
              Voir et modérer l&apos;annonce
            </Button>
          </Section>
        ) : null}

        <Text style={label}>Titre</Text>
        <Text style={value}>{summary ?? "—"}</Text>

        <Text style={label}>Prénom du propriétaire</Text>
        <Text style={value}>{authorName ?? "—"}</Text>

        <Text style={label}>Email du propriétaire</Text>
        <Text style={value}>{authorEmail ?? "—"}</Text>

        <Text style={label}>Quartier</Text>
        <Text style={value}>{neighborhood ?? "—"}</Text>

        <Text style={label}>Type de logement</Text>
        <Text style={value}>{housingType ?? "—"}</Text>

        <Text style={label}>Périodes de disponibilité</Text>
        <Text style={value}>{availabilities ?? "—"}</Text>

        <Text style={label}>ID de l&apos;annonce</Text>
        <Section style={idBox}>{listingId ?? "—"}</Section>

        <Hr style={{ margin: "24px 0", borderColor: "#e5e7eb" }} />
        <Text style={footer}>
          Cet email est envoyé automatiquement à chaque nouvelle soumission
          d&apos;annonce.
        </Text>
      </Container>
    </Body>
  </Html>
);

export const template = {
  component: Email,
  subject: (data: Record<string, unknown>) => {
    const summary = data.summary as string | undefined;
    return summary
      ? `Nouvelle annonce en attente : « ${summary} »`
      : "Nouvelle annonce en attente de modération";
  },
  displayName: "Nouvelle annonce (admin)",
  previewData: {
    authorName: "Camille",
    authorEmail: "camille@example.com",
    neighborhood: "Upper West Side",
    housingType: "Studio",
    summary: "Studio lumineux dans l'UWS",
    availabilities: "12 juil. 2026 – 20 juil. 2026",
    listingId: "00000000-0000-0000-0000-000000000000",
  },
} satisfies TemplateEntry;
