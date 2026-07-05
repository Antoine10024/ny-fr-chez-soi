import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";

type State =
  | { kind: "loading" }
  | { kind: "invalid" }
  | { kind: "already" }
  | { kind: "confirm" }
  | { kind: "submitting" }
  | { kind: "done" }
  | { kind: "error"; message: string };

function UnsubscribePage() {
  const [state, setState] = React.useState<State>({ kind: "loading" });
  const [token, setToken] = React.useState<string | null>(null);

  React.useEffect(() => {
    const t = new URLSearchParams(window.location.search).get("token");
    setToken(t);
    if (!t) {
      setState({ kind: "invalid" });
      return;
    }
    fetch(`/email/unsubscribe?token=${encodeURIComponent(t)}`)
      .then(async (r) => {
        const body = await r.json().catch(() => ({}));
        if (!r.ok) {
          setState({ kind: "invalid" });
          return;
        }
        if (body.valid === false && body.reason === "already_unsubscribed") {
          setState({ kind: "already" });
          return;
        }
        if (body.valid === true) {
          setState({ kind: "confirm" });
          return;
        }
        setState({ kind: "invalid" });
      })
      .catch(() => setState({ kind: "invalid" }));
  }, []);

  const confirm = async () => {
    if (!token) return;
    setState({ kind: "submitting" });
    try {
      const r = await fetch("/email/unsubscribe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const body = await r.json().catch(() => ({}));
      if (!r.ok) {
        setState({ kind: "error", message: "Impossible de traiter la demande." });
        return;
      }
      if (body.success) {
        setState({ kind: "done" });
      } else if (body.reason === "already_unsubscribed") {
        setState({ kind: "already" });
      } else {
        setState({ kind: "error", message: "Impossible de traiter la demande." });
      }
    } catch {
      setState({ kind: "error", message: "Erreur réseau." });
    }
  };

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col justify-center px-4 py-12 text-center">
      <h1 className="font-serif text-3xl">Se désinscrire</h1>
      {state.kind === "loading" && (
        <p className="mt-4 text-sm text-muted-foreground">Vérification du lien…</p>
      )}
      {state.kind === "invalid" && (
        <p className="mt-4 text-sm text-muted-foreground">
          Ce lien de désinscription est invalide ou a expiré.
        </p>
      )}
      {state.kind === "already" && (
        <p className="mt-4 text-sm text-muted-foreground">
          Cette adresse est déjà désinscrite. Tu ne recevras plus d&apos;emails de Logements NYC.
        </p>
      )}
      {state.kind === "confirm" && (
        <>
          <p className="mt-4 text-sm text-muted-foreground">
            Confirme la désinscription pour ne plus recevoir d&apos;emails de Logements NYC à cette adresse.
          </p>
          <button
            onClick={confirm}
            className="mt-6 inline-flex items-center justify-center self-center rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
          >
            Confirmer la désinscription
          </button>
        </>
      )}
      {state.kind === "submitting" && (
        <p className="mt-4 text-sm text-muted-foreground">Traitement en cours…</p>
      )}
      {state.kind === "done" && (
        <p className="mt-4 text-sm text-muted-foreground">
          Désinscription confirmée. Tu ne recevras plus d&apos;emails de Logements NYC à cette adresse.
        </p>
      )}
      {state.kind === "error" && (
        <p className="mt-4 text-sm text-destructive">{state.message}</p>
      )}
    </div>
  );
}

export const Route = createFileRoute("/unsubscribe")({
  component: UnsubscribePage,
});
