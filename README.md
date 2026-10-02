# MADA E-TECH — boutique électronique Next.js

Interface e-commerce inspirée des parcours de Mora Market, personnalisée avec les logos et la charte MADA E-TECH fournis par le client : bleu électrique `#0647FD`, bleu nuit `#0A1135` et blanc. Boutique responsive en français avec administration locale. Les coordonnées, prix et produits restent des exemples modifiables.

La navigation des catégories est fixe et verticale à gauche sur ordinateur. Sur mobile, le bouton menu ouvre un panneau latéral avec fermeture par la croix, le fond ou la touche Échap. La catégorie en cours est mise en évidence.

Le dossier conserve son nom technique `volt-market` pour ne pas interrompre le projet existant. L’interface, les métadonnées, le favicon et l’administration portent l’identité MADA E-TECH. La clé de stockage est conservée : les anciennes valeurs de marque par défaut sont migrées automatiquement sans supprimer les produits, commandes, favoris ni paramètres personnalisés.

## Démarrer dans Visual Studio Code

Prérequis : **Node.js 20.9 minimum** (Node.js 22 ou 24 recommandé) et npm.

1. Ouvrir le dossier `volt-market` dans Visual Studio Code : **Fichier → Ouvrir le dossier**.
2. Ouvrir le terminal intégré.
3. Exécuter :

```bash
npm ci
npm run dev
```

Boutique : http://127.0.0.1:3000

Administration : http://127.0.0.1:3000/admin

Le serveur est lié à l’adresse locale de l’ordinateur. Aucun compte ni mot de passe n’est nécessaire pour cette démo. Si le port est occupé, utiliser `npm run dev -- --port 3001` puis l’adresse affichée dans le terminal.

Dans le dossier livré sur cet ordinateur, les dépendances sont déjà installées. L’archive ZIP contient le code et le fichier de verrouillage, sans `node_modules` ni `.next` : exécuter `npm ci` après extraction.

## Ce qui fonctionne

- Accueil : bannière, catégories, sélection de produits, promotions, nouveautés et marques.
- Catalogue : recherche, filtres de catégorie et de marque, budget, stock disponible, tri et pagination au-delà de neuf produits.
- Fiches produits : caractéristiques, prix barré, stock, quantité, ajout au panier, favoris et recommandations.
- Panier : changement des quantités, retrait, sous-total, frais et seuil de livraison gratuite.
- Commande : formulaire validé, choix du mode de paiement simulé, confirmation avec numéro et diminution du stock.
- Espace client local : profil et historique des commandes de ce navigateur.
- Contact : message de test visible dans l’administration.
- Pages marques, nouveautés, promotions, FAQ, livraison, informations de confidentialité et 404.
- Administration : tableau de bord alimenté par les commandes de test, ajout/édition de produits, chargement d’image, prix, stocks, caractéristiques, mises en avant et archivage/restauration.
- Gestion des commandes : recherche, filtrage, détails et modification des statuts.
- Paramètres : nom de boutique, coordonnées, titre et texte de la bannière, livraison et réinitialisation de la démo.

## Limite volontaire de cette première étape

**Il s’agit d’un prototype fonctionnel d’interface, pas encore d’une boutique marchande en production.** Les données sont enregistrées dans `localStorage` sous la clé `volt-market-demo-v1`. Elles ne sont ni partagées entre visiteurs ni synchronisées entre navigateurs ou onglets déjà ouverts. Les commandes, profils et messages de ce navigateur sont visibles dans son admin sans authentification.

Il n’y a pas de paiement réel, d’e-mail envoyé, de compte authentifié, de transporteur, de facture fiscale ou de base de données serveur. Les quatre moyens de paiement affichés sont uniquement des choix de démonstration. Utiliser des coordonnées fictives pendant les essais.

Les commandes conservent une copie du nom, du prix et de la quantité : une modification ultérieure du catalogue ne change pas les anciennes commandes. Une annulation de commande ne recrédite pas automatiquement le stock ; celui-ci peut être ajusté depuis Produits.

Les images chargées via l’admin sont réduites à 700 pixels maximum et conservées localement. Limite par fichier : 2 Mo avant réduction. Le quota de stockage du navigateur est limité ; un avertissement s’affiche s’il est dépassé. Pour un vrai catalogue, prévoir un stockage de fichiers côté serveur.

## Où modifier le code

```text
src/
  app/
    page.tsx                 Accueil
    globals.css              Identité visuelle et responsive
    layout.tsx               Métadonnées, langue et fournisseur de données
    catalogue/               Catalogue et recherche
    produit/[id]/            Fiche produit
    panier/                  Panier
    commande/                Parcours de commande
    confirmation/[id]/       Confirmation locale
    compte/                  Profil et historique local
    contact/                 Formulaire de test
    admin/                   Pages d’administration
  components/
    store-provider.tsx       État local, panier, commandes et persistance
    shop-shell.tsx           En-tête, navigation et pied de page
    product-card.tsx         Cartes du catalogue
    product-detail.tsx       Fiche produit
    catalogue.tsx            Filtres, recherche, tri et pagination
    admin-shell.tsx          Structure de l’administration
    modal.tsx                Fenêtre accessible au clavier
  lib/
    data.ts                  Types TypeScript, produits et paramètres initiaux
public/
  brand/                     Logos fournis, optimisés pour le web
  images/                    Images produit locales
```

Pour modifier durablement le catalogue initial livré à tous les nouveaux navigateurs, éditer `src/lib/data.ts`. Les modifications faites dans l’admin ne changent pas ce fichier. Après une modification des données initiales, réinitialiser la démo dans **Admin → Paramètres** pour supprimer l’ancienne copie locale.

Les couleurs sont définies par les variables CSS au début de `src/app/globals.css`. Les icônes viennent de Lucide. Les polices DM Sans et Manrope sont chargées depuis Google Fonts avec des polices système de secours.

## Commandes utiles

```bash
npm run dev           # développement et rechargement automatique
npm run typecheck     # vérification TypeScript
npm run build         # compilation de production
npm start             # serveur local après compilation
npm run format        # formatage du code
npm run format:check  # contrôle du formatage
```

Stack : Next.js 16 (App Router), React 19, TypeScript, CSS et Lucide React. Le fichier `package-lock.json` fixe les versions exactes installées. Le code a été formaté pour faciliter la modification dans Visual Studio Code.

## Étape suivante : brancher la vraie boutique

Remplacer le fournisseur local par une API et une base de données, ajouter l’authentification serveur et les rôles administrateurs, stocker les images dans un service adapté, recalculer et valider les prix et stocks côté serveur à chaque commande, puis intégrer les paiements et notifications. Les informations commerciales et légales doivent être fournies par le vendeur avant publication. Les visuels et caractéristiques du catalogue de démonstration sont à valider ou à remplacer.

## Visuels et références

L’organisation des parcours s’inspire de https://www.moramarket.mg/ ; aucun logo ni bannière de ce site n’a été repris.

Les photos locales proviennent de l’API de démonstration DummyJSON :

- https://dummyjson.com/products/category/smartphones
- https://dummyjson.com/products/category/laptops
- https://dummyjson.com/products/category/mobile-accessories

Les noms de produits et marques appartiennent à leurs propriétaires. Ces médias servent au prototype ; utiliser les images fournies et autorisées par le commerçant pour sa boutique définitive. La liste des URLs d’origine est dans `SOURCES.md`.
