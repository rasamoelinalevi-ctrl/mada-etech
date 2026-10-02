"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="container page-content">
      <h1>La page est momentanément indisponible.</h1>
      <p>
        Votre commande peut avoir été enregistrée. Consultez votre compte avant
        de réessayer.
      </p>
      <button className="button dark" onClick={reset}>
        Réessayer
      </button>
    </main>
  );
}
