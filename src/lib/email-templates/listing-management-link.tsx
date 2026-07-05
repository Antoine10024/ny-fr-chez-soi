import * as React from "react";
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Text,
} from "@react-email/components";
import type { TemplateEntry } from "./registry";

export interface ListingManagementLinkProps {
  authorName?: string;
  listingSummary?: string;
  manageUrl?: string;
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

const paragraph: React.CSSProperties = {
  fontSize: "15px",
  lineHeight: "22px",
  margin: "0 0 16px",
};

const button: React.CSSProperties = {
  backgroundColor: "#1a1a1a",
  color: "#ffffff",
  padding: "12px 20px",
  borderRadius: "8px",
  fontSize: "15px",
  textDecoration: "none",
  display: "inline-block",
};

const linkBox: React.CSSProperties = {
  backgroundColor: "#f5f5f4",
  borderRadius: "8px",
  padding: "12px 14px",
  fontSize: "13px",
  wordBreak: "break-all",
  margin: "12px 0 0",
};

const footer: React.CSSProperties = {
  fontSize: "12px",
  color: "#6b7280",
  marginTop: "24px",
};

const Email = ({
  authorName,
  listingSummary,
  manageUrl,
}: ListingManagementLinkProps) => (
  <Html lang="fr" dir="ltr">
    <Head />
    <Preview>Ton lien de gestion pour ton annonce sur NY Fr Chez Soi</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={heading}>Ton annonce a bien été enregistrée</Heading>
        <Text style={paragraph}>
          {authorName ? `Bonjour ${authorName},` : "Bonjour,"}
        </Text>
        <Text style={paragraph}>
          Merci d&apos;avoir publié ton annonce
          {listingSummary ? ` « ${listingSummary} »` : ""}. Elle est en cours
          de vérification et sera publiée sur le site après validation.
        </Text>
        <Text style={paragraph}>
          Voici ton lien secret de gestion. Garde-le précieusement : il te
          permettra plus tard de modifier ou de supprimer ton annonce. Ne le
          partage avec personne.
        </Text>

        {manageUrl ? (
          <>
            <Button href={manageUrl} style={button}>
              Gérer mon annonce
            </Button>
            <Text style={linkBox}>
              <Link href={manageUrl} style={{ color: "#1a1a1a" }}>
                {manageUrl}
              </Link>
            </Text>
          </>
        ) : null}

        <Hr style={{ margin: "24px 0", borderColor: "#e5e7eb" }} />
        <Text style={footer}>
          Si tu n&apos;es pas à l&apos;origine de cette annonce, tu peux
          ignorer cet email.
        </Text>
      </Container>
    </Body>
  </Html>
);

export const template = {
  component: Email,
  subject: (data: Record<string, unknown>) => {
    const summary = data.listingSummary as string | undefined;
    return summary
      ? `Ton lien de gestion pour « ${summary} »`
      : "Ton lien de gestion pour ton annonce";
  },
  displayName: "Lien de gestion d'annonce (propriétaire)",
  previewData: {
    authorName: "Camille",
    listingSummary: "Studio lumineux dans l'UWS",
    manageUrl: "https://example.com/manage/00000000-0000-0000-0000-000000000000",
  },
} satisfies TemplateEntry;
