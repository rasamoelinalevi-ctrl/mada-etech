"use client";
export default function GlobalError({ reset }: { reset: () => void }) {
  return (
    <html lang="fr">
      <body>
        <main>
          <h1>Boutique momentanément indisponible</h1>
          <p>
            Nous ne pouvons pas charger le catalogue. Réessayez dans quelques
            instants.
          </p>
          <button onClick={reset}>Réessayer</button>
        </main>
      </body>
    </html>
  );
}
