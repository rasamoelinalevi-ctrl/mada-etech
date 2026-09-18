import { InfoPage } from "@/components/info-page";
import { settings } from "@/server/commerce";
import { money } from "@/lib/data";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "Livraison et retours",
  alternates: { canonical: "/livraison" },
};
export default async function Page() {
  const cfg = await settings();
  return (
    <InfoPage title="Livraison et retours">
      <h2>Zones desservies</h2>
      {cfg.zones?.map((z) => (
        <p key={z.city}>
          {z.city} : {money(z.fee)}
        </p>
      ))}
      <p>Livraison offerte dès {money(cfg.freeShipping)} après réduction.</p>
      <h2>Conditions et retours</h2>
      <div style={{ whiteSpace: "pre-wrap" }}>
        {cfg.returnsText ||
          "Les modalités définitives sont en cours de préparation. Contactez la boutique avant votre achat."}
      </div>
    </InfoPage>
  );
}
