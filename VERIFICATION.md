# Vérifications de la première version

## Mise à jour MADA E-TECH

- Logos client intégrés sur fond clair et sombre, favicon issu du symbole fourni.
- Palette bleu électrique / bleu nuit appliquée à la boutique et à l’administration.
- Migration de l’ancienne identité vérifiée dans le navigateur : nouveau nom et nouvelle bannière visibles, favori et prix précédemment modifié conservés.
- Accueil contrôlé à 1440 et 390 pixels ; images chargées, aucun débordement horizontal.
- Barre verticale testée : lien Smartphones, deux résultats et catégorie active mise en évidence.
- Panneau mobile contrôlé : ouverture, liens de catégories, fermeture à la navigation.

## Parcours de la première version

- Compilation de production Next.js : réussie.
- Vérification TypeScript : réussie.
- Accès HTTP : 19 pages/parcours contrôlés avec réponse 200, page inexistante avec réponse 404.
- Images produit : huit fichiers locaux, chargement contrôlé dans le navigateur sans image manquante sur l’accueil.
- Parcours testé dans le navigateur : ajout des AirPods Max au panier, confirmation d’une commande fictive de 2 490 000 Ar, frais offerts, panier vidé, confirmation affichée.
- Administration : commande visible, stock réduit de 12 à 11, statut passé à « Confirmée ».
- Prix produit : modification à 2 390 000 Ar conservée après rechargement.
- Catalogue : recherche « Samsung », un résultat ; filtres combinés, état sans résultat.
- Favoris : Galaxy S10 ajouté et retrouvé sur la page Favoris.
- Produits : création d’un article fictif puis archivage, bouton de restauration disponible.
- Responsive : accueil contrôlé à 1440 et 390 pixels, administration à 390 pixels ; pas de débordement horizontal du document. Menu mobile testé.
- Console du navigateur : aucune erreur au cours des parcours contrôlés.

Les essais peuvent rester visibles dans le stockage local du navigateur utilisé pour l’aperçu. Ils ne sont pas intégrés au catalogue initial du code ou de l’archive. La réinitialisation est disponible dans Administration → Paramètres.

Ces contrôles ne couvrent pas un backend, une authentification ou un paiement réels, qui ne font pas partie de cette première version d’interface.
