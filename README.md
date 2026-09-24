![ASIT logo](assets/ASIT_logo.png)

Asit fullstack app

![Commitlint](https://github.com/Architecture-Studio-IT/ASIT/actions/workflows/commitlint.yml/badge.svg)

# Overview

**ASIT** _(Architect Studio IT)_ is a web-based platform designed to simplify and professionalize IT infrastructure design.

It enables users to design, configure, document, and estimate the cost of complete IT infrastructures within a single, centralized tool. ASIT bridges the gap between visual network design tools, hardware configuration platforms, and budgeting solutions — an intersection that is currently underserved in the market.

ASIT is built around three core pillars:

- Visual Infrastructure Design

- Real-World Hardware Selection

- Automated Budget Estimation & Documentation

The platform is designed to be accessible, sovereign, and compliant with European regulations, while remaining powerful enough for professional use cases.

## Démarrage rapide

```bash
npm install
npm run setup          # crée .env depuis .env.exemple et génère AUTH_SECRET
# renseigner POSTGRES_* / DATABASE_URL / RABBITMQ_* dans .env
docker compose up --build
```

`npm run setup` n'écrase jamais un `.env` existant. Sans identifiants Google, la connexion par email et mot
de passe fonctionne ; le bouton Google indique simplement qu'il n'est pas configuré. Si `AUTH_SECRET` manque,
les pages de connexion et d'inscription l'annoncent au lieu de renvoyer une erreur serveur.

## Environment configuration

The project relies on a dotenv file. A template is provided in `.env.exemple` — copy it to `.env` and fill it in,
ou laissez `npm run setup` le faire.

| Variable | Rôle |
| --- | --- |
| `POSTGRES_*`, `DATABASE_URL` | Base de données. En local (Prisma CLI), le port exposé est `5434`. |
| `RABBITMQ_*` | Comptes du bus de messages (voir `rabbitmq/definitions.json`). |
| `AUTH_SECRET` | Clé de signature des sessions (JWT HS256, cookie httpOnly). 32 caractères minimum : `openssl rand -hex 32`. |
| `GOOGLE_CLIENT_ID`, `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Client OAuth 2.0 « Application Web » créé sur console.cloud.google.com. Même valeur dans les deux : la première sert à vérifier le jeton côté serveur, la seconde au bouton Google côté navigateur. Ajouter `http://localhost:3000` (et le domaine public) aux origines JavaScript autorisées. **Facultatif** : sans elles, seule la connexion par mot de passe est proposée. |
| `APP_URL` | URL publique, utilisée par `robots.txt`. |
| `ICECAT_*` | Import du catalogue depuis Open Icecat (voir le dépôt `ASIT-web-scrapper`). |

> `DATABASE_URL` est injectée automatiquement dans les conteneurs par docker-compose.
> `NEXT_PUBLIC_GOOGLE_CLIENT_ID` est inlinée au **build** de l'image : elle est passée en `build.args`. La changer
> impose donc de reconstruire (`docker compose up --build app`), un redémarrage ne suffit pas.

### Connexion Google sur une autre machine

Le client OAuth est rattaché à un projet Google Cloud et à une liste d'origines autorisées. Un coéquipier qui
travaille sur `http://localhost:3000` peut réutiliser le même `GOOGLE_CLIENT_ID` (cette origine est déclarée).
Toute autre origine — autre port, autre domaine — doit être ajoutée aux « origines JavaScript autorisées » du
client, ou faire l'objet d'un client OAuth distinct.

### Schéma

Le schéma est appliqué avec `prisma db push` (service `migrate` du compose, ou `npm run prisma:dbpush` en local).

## Authentification et comptes

- Inscription et connexion par email + mot de passe (bcrypt, 12 tours) ou par compte Google
  (Google Identity Services côté client, `google-auth-library` côté serveur pour vérifier le jeton).
- L'acceptation des conditions d'utilisation est enregistrée sur le compte (`tosAcceptedAt`, `tosVersion`).
  La version courante est `CGU_VERSION` dans `lib/legal.ts` ; la changer force une ré-acceptation.
- Depuis `/profile` : export JSON de toutes les données du compte (`/api/account/export`) et suppression définitive.
- Les espaces `/dashboard`, `/designer`, `/marketplace`, `/profile` exigent une session (`middleware.ts`).

## Pages légales

`/cgu` regroupe mentions légales, conditions d'utilisation et information RGPD. Les coordonnées de l'éditeur
sont dans `lib/legal.ts` (`OPERATOR`) — **à compléter avant toute mise en ligne**. `/robots.txt` est généré par
`app/robots.ts` et exclut les crawlers d'entraînement IA (obligation de la Fair Use Policy Icecat, et opposition TDM).

## Dockerization 🐳

The app, the database, and pgAdmin are all containerized. Two modes are available.

### Development — hot-reload, source code mounted

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

### Production — optimized build

```bash
docker compose up --build
```

| Service  | URL                   |
| -------- | --------------------- |
| App      | http://localhost:3000 |
| pgAdmin  | http://localhost:5050 |
| Postgres | localhost:5432        |

### Other commands

```bash
# stop containers
docker compose down

# stop + delete volumes (resets the database)
docker compose down -v

# view logs
docker compose logs -f

# run a one-off command in a service
docker compose run --rm <service> <command>
```

> If you modify `.env` after containers are running, restart them so the new variables take effect.

## Using Commitizen 🛠️

Commitizen helps maintain a consistent commit history by guiding you through the process of writing conventional commits.

### 1. Install Commitizen

```bash
npm install -g commitizen
```

or as a dev dependency:

```bash
npm install --save-dev commitizen
```

### 2. Making commits

Use the `git cz` or `npx cz` command instead of `git commit`:

```bash
git add .
git cz
```

You'll be prompted for type, scope, description, etc.

### 3. Benefits

- **Consistent commit messages** for easy changelog generation.
- Works well with CI/CD and release tooling.

> For more details, visit the [Commitizen project](https://commitizen.github.io/).

## Dev Team

ASIT is developed by the following team members:

- [Pierre-Etienne HENRY](mailto:pierre-etienne.henry@epitech.eu)
- [Ariles HARKATI](mailto:ariles.harkat@epitech.eu)
- [Ewen LAYLE EVENO](mailto:ewen.layle-eveno@epitech.eu)
- [Dylan ADGHAR](mailto:dylan.adghar@epitech.eu)
