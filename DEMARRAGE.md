# MADA E-TECH — Version actuelle

Projet Next.js modifiable dans Visual Studio Code.

## Démarrage local (Node.js 24)

Dans le dossier du projet :

```powershell
npm ci
Copy-Item .env.example .env.local
npm run db:seed
npm run dev
```

Ouvrir http://127.0.0.1:3000. La base locale PGlite est créée dans `.data/postgres`. En production, configurer PostgreSQL via `DATABASE_URL`.

Pour créer l’administrateur, renseigner temporairement `ADMIN_EMAIL` et `ADMIN_PASSWORD` (16 caractères minimum) dans `.env.local`, puis exécuter `npm run db:admin`. Retirer ensuite ces deux valeurs du fichier. Arrêter le serveur local avant les opérations CLI sur la base PGlite ; en production, utiliser PostgreSQL.

## État de cette livraison

Cette archive contient les modifications actuelles : catalogue et commandes en base, sessions et contrôle des droits, validation serveur, réservations de stock, intégration Papi, traitement des notifications signées et worker e-mail.

Ce n’est pas encore une mise en production validée de bout en bout. Le compte marchand Papi reste à créer. Configurer ses clés côté serveur, l’adresse HTTPS publique, PostgreSQL et SMTP. La prise en charge Mastercard doit être confirmée auprès de Papi ; elle n’est pas annoncée par défaut. Visa et Mobile Money disposent de l’intégration au parcours Papi.

Les conditions commerciales, taxes, zones de livraison et produits réels doivent être validés dans l’administration. Les commandes sont fermées par défaut. Ne pas activer les ventes avant les tests marchands, les tests de livraison d’e-mails et les sauvegardes/restaurations sur l’hébergement choisi. Le mode test Papi sur un compte marchand réel peut déplacer de l’argent : utiliser son environnement sandbox pour les essais.

Les fichiers README.md et VERIFICATION.md historiques décrivent la maquette initiale ; ce document décrit la version actuelle. La revue finale de déploiement et sa documentation détaillée restent à terminer.

Vérifications disponibles : `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`, `npm run preflight`.

L’archive exclut les secrets, les bases locales, les comptes de test, node_modules et les builds. Elle inclut uniquement le modèle `.env.example`.
