import { InfoPage } from "@/components/info-page";
import { settings } from "@/server/commerce";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "Conditions et confidentialité",
  alternates: { canonical: "/mentions-legales" },
};
export default async function Page() {
  const cfg = await settings();
  return (
    <InfoPage title="Conditions et confidentialité">
      <div style={{ whiteSpace: "pre-wrap" }}>
        {cfg.legalText ||
          "Les informations légales et conditions commerciales sont en cours de préparation. Les commandes ne sont pas encore ouvertes."}
      </div>
      <h2>Votre compte et vos données</h2>
      <p>
        Les comptes et commandes sont conservés dans la base de données de la
        boutique. Le panier et les favoris sont mémorisés sur votre appareil. Un
        cookie sécurisé permet de maintenir votre session. Les données de carte
        sont saisies sur la page sécurisée du prestataire de paiement.
      </p>
      <p>Pour toute demande relative à vos données, écrivez à {cfg.email}.</p>
    </InfoPage>
  );
}
