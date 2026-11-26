<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Efficacité des agents

- Utiliser le modèle le plus économique capable de réussir la tâche : exploration de fichiers, recherches simples et corrections mécaniques avec un modèle rapide ; architecture, sécurité, paiements, débogage complexe et revue critique avec un modèle plus puissant.
- Confier chaque sous-tâche à la spécialité appropriée uniquement si la délégation est autorisée et apporte un gain réel. Ne pas multiplier les agents pour une tâche courte.
- Limiter le contexte transmis aux fichiers et faits utiles. Préférer des recherches ciblées, des lectures courtes et des vérifications proportionnées au risque ; éviter de répéter les tests déjà réussis sans changement pertinent.
- Ces consignes ne remplacent jamais les exigences de qualité, de sécurité, les instructions de l’utilisateur ni les limites des modèles disponibles dans la session.

## Règles catalogue MADA E-TECH

- Utiliser les dossiers de `D:\Levi\Ecommerce\Produits\MARQUES` comme source du catalogue. Préférer les photos brutes du produit et les dossiers `PHOTOS REEL`; éviter `MONTAGE`, `MARKETPLACE`, `STORY` et les visuels MADA E-TECH pour l’image principale.
- Conserver plusieurs vues par produit. La première image doit montrer clairement le produit seul; les autres servent à la galerie verticale et au zoom.
- Ne jamais inventer le prix, le stock, les caractéristiques ou une variante. Un produit importé sans stock confirmé reste à zéro et hors ligne jusqu’à validation commerciale.
- Chaque variante possède son propre SKU, prix, stock et jeu d’images. Relier les déclinaisons avec le même `group` et renseigner `variantOptions` (par exemple `Couleur`, `Capacité`, `Taille`).
- Classer les produits dans les catégories du projet et étendre proprement la taxonomie lorsqu’une famille réelle manque, notamment impression, projection, réseau, stockage ou énergie.
- Ne pas réintroduire les anciens produits de démonstration. Vérifier les données extraites, exécuter les tests, le lint, le type-check et le build, puis publier chaque changement terminé sur GitHub.
