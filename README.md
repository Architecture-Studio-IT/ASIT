![ASIT logo](assets/ASIT_logo.png)

Asit fullstack app

![Commitlint](https://github.com/Architecture-Studio-IT/ASIT/actions/workflows/commitlint.yml/badge.svg)


# Overview

**ASIT** *(Architect Studio IT)* is a web-based platform designed to simplify and professionalize IT infrastructure design.

It enables users to design, configure, document, and estimate the cost of complete IT infrastructures within a single, centralized tool. ASIT bridges the gap between visual network design tools, hardware configuration platforms, and budgeting solutions — an intersection that is currently underserved in the market.

ASIT is built around three core pillars:

- Visual Infrastructure Design

- Real-World Hardware Selection

- Automated Budget Estimation & Documentation

The platform is designed to be accessible, sovereign, and compliant with European regulations, while remaining powerful enough for professional use cases.

## Environment configuration
The project relies on a dotenv file to store sensitive credentials. An example template is provided in `.env.exemple`.

### Getting started
1. Copy the example file to `.env`:
   ```bash
   cp .env.exemple .env  # or copy manually
   ```
2. Fill in the values with your preferred credentials:
   ```dotenv
   POSTGRES_USER=
   POSTGRES_PASSWORD=
   POSTGRES_DB=

   PGADMIN_DEFAULT_EMAIL=
   PGADMIN_DEFAULT_PASSWORD=
   ```

The values from `.env` are automatically interpolated by `docker-compose` when you run the services.

## Dockerization 🐳
This repository includes a `docker-compose.yml`

### Quick commands
```bash
# build and start containers in detached mode
docker compose up -d

# stop and remove containers, networks, and volumes
docker compose down -v

# view logs for all services
docker compose logs -f

# run a one-off command in a service (e.g. database migrations)
docker compose run --rm <service> <command>
```

If you modify `.env` after containers are running, restart them so the new variables take effect.

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
