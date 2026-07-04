import * as React from "react";
import {
  Body,
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

export interface InquiryNotificationProps {
  visitorFirstName?: string;
  visitorEmail?: string;
  startDate?: string;
  endDate?: string;
  message?: string;
  listingSummary?: string;
  listingNeighborhood?: string;
  isBccCopy?: boolean;
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

const messageBox: React.CSSProperties = {
  backgroundColor: "#f5f5f4",
  borderRadius: "8px",
  padding: "16px",
  margin: "8px 0 0",
  fontSize: "15px",
  lineHeight: "22px",
  whiteSpace: "pre-wrap",
};

const footer: React.CSSProperties = {
  fontSize: "12px",
  color: "#6b7280",
  marginTop: "24px",
};

const bccBanner: React.CSSProperties = {
  backgroundColor: "#fef3c7",
  borderRadius: "6px",
  padding: "10px 12px",
  fontSize: "12px",
  color: "#78350f",
  marginBottom: "16px",
};

const Email = ({
  visitorFirstName,
  visitorEmail,
  startDate,
  endDate,
  message,
  listingSummary,
  listingNeighborhood,
  isBccCopy,
}: InquiryNotificationProps) => (
  <Html lang="fr" dir="ltr">
    <Head />
    <Preview>
      {visitorFirstName ?? "Un visiteur"} est intéressé par ton annonce
    </Preview>
    <Body style={main}>
      <Container style={container}>
        {isBccCopy ? (
          <Section style={bccBanner}>
            Copie BCC — cet email a également été envoyé au propriétaire de
            l&apos;annonce.
          </Section>
        ) : null}

        <Heading style={heading}>Nouvelle demande de contact</Heading>
        <Text style={value}>
          {visitorFirstName ?? "Un visiteur"} souhaite te contacter au sujet de
          ton annonce{listingSummary ? ` « ${listingSummary} »` : ""}
          {listingNeighborhood ? ` (${listingNeighborhood})` : ""}.
        </Text>

        <Text style={label}>Prénom</Text>
        <Text style={value}>{visitorFirstName ?? "—"}</Text>

        <Text style={label}>Email</Text>
        <Text style={value}>{visitorEmail ?? "—"}</Text>

        <Text style={label}>Dates souhaitées</Text>
        <Text style={value}>
          {startDate ?? "—"} → {endDate ?? "—"}
        </Text>

        <Text style={label}>Message</Text>
        <Text style={messageBox}>{message ?? "—"}</Text>

        <Hr style={{ margin: "24px 0", borderColor: "#e5e7eb" }} />
        <Text style={footer}>
          Pour répondre, il te suffit d&apos;utiliser le bouton
          &laquo;&nbsp;Répondre&nbsp;&raquo; de ta messagerie : ta réponse ira
          directement à {visitorFirstName ?? "ce visiteur"}.
        </Text>
      </Container>
    </Body>
  </Html>
);

export const template = {
  component: Email,
  subject: (data: Record<string, unknown>) => {
    const name = (data.visitorFirstName as string | undefined) ?? "Un visiteur";
    const summary = data.listingSummary as string | undefined;
    return summary
      ? `Nouvelle demande de ${name} pour « ${summary} »`
      : `Nouvelle demande de contact de ${name}`;
  },
  displayName: "Demande de contact (propriétaire)",
  previewData: {
    visitorFirstName: "Camille",
    visitorEmail: "camille@example.com",
    startDate: "12 juil. 2026",
    endDate: "20 juil. 2026",
    message:
      "Bonjour, je serai à NYC du 12 au 20 juillet et votre studio a l'air parfait pour mon séjour. Est-ce toujours disponible ?",
    listingSummary: "Studio lumineux dans l'UWS",
    listingNeighborhood: "Upper West Side",
  },
} satisfies TemplateEntry;
