# Yoovi Formation — formation.yoovi.fr

Plateforme de formation des partenaires B2B de Yoovi :
modules vidéo, progression individuelle, ressources PDF, support par e-mail et back-office complet.

## Démarrer en local (mode démo)

```bash
npm install
npm run dev          # http://localhost:3100
```

Sans variables Supabase, l'application démarre en **mode démo** : base locale dans `.data.nosync/demo-db.json`,
aucun e-mail envoyé (les liens d'invitation et de réinitialisation s'affichent à l'écran), bandeau « Mode démonstration »
permanent. Comptes de test (proposés sur la page de connexion, mode démo uniquement) :

| Compte | E-mail | Mot de passe |
|---|---|---|
| Espace formation | `demo@yoovi.demo` | `demo-partenaire` |
| Super administrateur | `admin@yoovi.demo` | `demo-admin` |

Supprimer `.data.nosync/` pour repartir du catalogue initial.

## Mise en production (Supabase)

1. Créer un projet Supabase **dédié** à formation.yoovi.fr (ne pas réutiliser la base de l'app élèves ni de Yoovi OS).
2. SQL Editor : exécuter dans l'ordre `supabase/migrations/0001_schema.sql`, `0002_rls.sql`, `0003_storage.sql`, puis `supabase/seed.sql`
   (catalogue de départ + vidéos).
3. Authentication → Providers : désactiver les inscriptions publiques (« Allow new users to sign up » : off). Les comptes sont créés par invitation.
4. Authentication → URL configuration : Site URL = `https://formation.yoovi.fr`, Redirect URLs = `https://formation.yoovi.fr/auth/callback`.
5. Authentication → Email templates (liens côté serveur, compatibles avec le rendu SSR) :
   - *Invite user* : `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=invite&next=/reinitialiser?invitation=1`
   - *Reset password* : `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/reinitialiser`
   - Configurer un SMTP d'envoi (Authentication → SMTP) avec un expéditeur `@yoovi.fr`.
6. Variables d'environnement (voir `.env.example`) : `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
   `SUPABASE_SERVICE_ROLE_KEY` (serveur uniquement), `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_SUPPORT_EMAIL`.
7. Premier super administrateur :
   ```bash
   node --env-file=.env.local scripts/create-admin.mjs prenom@yoovi.fr "Prénom Nom"
   ```
8. Déployer (Vercel ou équivalent Node) et pointer `formation.yoovi.fr` dessus. Sans Supabase, l'application tourne en mode démo (données éphémères sur Vercel) ; il est refusé
   seulement si `YOOVI_DEMO_MODE=0`.

## Architecture

- **Next.js 15 (App Router) + TypeScript + Tailwind**, rendu serveur, actions serveur pour toutes les écritures.
- **Supabase** : Auth (invitation, récupération), Postgres + **RLS**, Storage (`thumbnails` public, `resources` privé).
- `lib/data/repo.ts` : interface d'accès aux données, deux implémentations — `supabase/` (production, requêtes avec la
  session de l'utilisateur, donc soumises à la RLS) et `demo/` (fichier local).
- Contrôles d'accès en deux couches : vérification du rôle dans chaque page / action serveur (`lib/auth/session.ts`)
  **et** RLS en base (garantie finale). La clé `service_role` n'est utilisée que côté serveur, pour les opérations Auth
  (invitation, désactivation, suppression).

### Rôles

| Rôle | Accès |
|---|---|
| `partner` | Son espace : catalogue publié de son organisme, sa progression, support. Ne voit aucun autre partenaire. |
| `admin` (administrateur de plateforme) | Back-office : partenaires, utilisateurs partenaires, formations, statistiques. |
| `super_admin` | Tout, y compris la gestion des comptes de l'équipe Yoovi et les suppressions définitives. |

### Données

`organizations`, `organization_notes` (notes internes, jamais visibles des partenaires), `profiles` (1-1 avec
`auth.users`), `modules`, `lessons` (vidéos), `resources` (PDF / liens), `organization_modules` (catalogue
personnalisé par organisme, actif quand `catalog_mode = 'custom'`), `lesson_progress` (vues, position de lecture,
terminé). Une leçon terminée le reste ; l'organisme de la progression est déduit en base.

### Vidéos

Dans le back-office, coller un lien YouTube (non répertorié), Vimeo (y compris privé avec son hash) ou un fichier
`.mp4` en https. Le lecteur mémorise la position (toutes les 15 s et à la pause), reprend là où l'utilisateur s'était
arrêté et valide la vidéo à 95 % de lecture ou via « Marquer comme terminée ». Les chapitres sans lien affichent
« Vidéo en préparation » : aucune vidéo fictive n'est intégrée.

## Vérifications

```bash
npm run typecheck    # TypeScript
npm run test:sql     # migrations + 34 tests RLS dans un Postgres en mémoire (PGlite)
npm run build        # build de production (YOOVI_DEMO_MODE=1 sans Supabase)
```

## Note : projet sur le Bureau synchronisé par iCloud

Le Bureau est synchronisé par iCloud Drive et le disque est presque plein : macOS évacue alors des fichiers vers le
cloud, ce qui bloque Node. Pour l'éviter, `node_modules`, `.next` et `public` sont des liens vers des dossiers
`*.nosync` qu'iCloud ignore, et la base démo est écrite dans `.data.nosync/`. Si le projet est déplacé hors du Bureau (recommandé, par ex. `~/Projects`), on peut
revenir à une structure classique : `rm public && mv public.nosync public` (idem pour les autres).
