import { InfoPage } from "@/components/info-page";
export const metadata = {
  title: "Questions fréquentes",
  alternates: { canonical: "/faq" },
};
export default function Page() {
  const faq = [
    [
      "Comment commander ?",
      "Ajoutez les articles au panier, connectez-vous et renseignez votre livraison. Le total définitif est présenté dans la commande avant le paiement sécurisé sur Papi.",
    ],
    [
      "Quels paiements sont disponibles ?",
      "Mobile Money et carte Visa via Papi, après activation du compte marchand. Les moyens réellement activés sont proposés lors du paiement.",
    ],
    [
      "Où retrouver mes commandes ?",
      "Connectez-vous à Mon compte. Les commandes sont enregistrées sur le serveur et accessibles depuis vos appareils. Les favoris et le panier restent sur votre navigateur.",
    ],
    [
      "Mon paiement semble interrompu",
      "Ouvrez le récapitulatif de la commande et actualisez le paiement. Si le lien reste actif, vous pouvez le reprendre. Ne créez pas une autre commande avant cette vérification.",
    ],
    [
      "Comment demander un retour ?",
      "Consultez les conditions Livraison et retours, puis contactez la boutique en indiquant votre référence de commande.",
    ],
  ];
  return (
    <InfoPage title="Questions fréquentes">
      {faq.map(([q, a]) => (
        <details className="faq-item" key={q}>
          <summary>{q}</summary>
          <p>{a}</p>
        </details>
      ))}
    </InfoPage>
  );
}
