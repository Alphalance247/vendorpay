# Bitbucket Pipelines — Complete Guide

*A general guide to building a Bitbucket pipeline, with the VendorPay frontend as the worked example.*

**Repository:** `goalluvium/vendorpay-frontend`
**Target:** an Ubuntu EC2 instance on AWS, running the app with Docker Compose
**Audience:** anyone. No prior experience with CI/CD, SSH, Docker, or AWS is assumed.

> **Setting up a pipeline for a *different* app?** Read
> [Part 0](#part-0--understand-the-system-before-touching-it) for the concepts, then
> **[Part G](#part-g--build-a-pipeline-for-any-app-generic-recipe)** — a language- and
> host-agnostic recipe with fill-in-the-blank templates and starter files. Everything after
> it is then a complete worked example of that same recipe.

> **How to use this document.** Read Part 0 once so the words mean something. Then
> do Part 1 → Part 2 → Part 3 → Part 4 **in order**, copying each command exactly.
> Every command tells you what output means "it worked". If something breaks, go
> to **Part 7 — Troubleshooting**, find your exact error message, and follow the fix.
>
> Anything written like `<this>` is a placeholder you must replace with your own
> value. Do not leave the angle brackets in.

---

## Table of contents

- [Part 0 — Understand the system before touching it](#part-0--understand-the-system-before-touching-it)
  - [0.1 What a "pipeline" actually is](#01-what-a-pipeline-actually-is)
  - [0.2 What happens, second by second, when you deploy](#02-what-happens-second-by-second-when-you-deploy)
  - [0.3 Glossary in plain English](#03-glossary-in-plain-english)
  - [0.4 THE MOST IMPORTANT CONCEPT: there are TWO different SSH keys](#04-the-most-important-concept-there-are-two-different-ssh-keys)
  - [0.5 Why the private key "won't parse" — and the fix](#05-why-the-private-key-wont-parse--and-the-fix)
- [Part G — Build a pipeline for ANY app (generic recipe)](#part-g--build-a-pipeline-for-any-app-generic-recipe)
  - [G.1 The five questions you must answer first](#g1-the-five-questions-you-must-answer-first)
  - [G.4 Write the test gate for your stack](#g4-write-the-test-gate-for-your-stack)
  - [G.6 The variable worksheet](#g6-the-variable-worksheet)
  - [G.7 Starter templates you can paste today](#g7-starter-templates-you-can-paste-today)
  - [G.11 The mistakes that cause most failures](#g11-the-mistakes-that-cause-most-failures)
- [Prerequisites checklist](#prerequisites-checklist)
- [Part 1 — Prepare the EC2 server](#part-1--prepare-the-ec2-server)
- [Part 2 — Create Key A (Pipeline ➜ EC2)](#part-2--create-key-a-pipeline--ec2)
- [Part 3 — Configure Bitbucket](#part-3--configure-bitbucket)
  - [3.4 THE VARIABLE REFERENCE TABLE](#34-the-variable-reference-table)
  - [3.5 Repository vs Deployment vs Workspace variable — how to decide](#35-repository-vs-deployment-vs-workspace-variable--how-to-decide)
- [Part 4 — The pipeline file, explained](#part-4--the-pipeline-file-explained)
- [Part 5 — Run it for the first time](#part-5--run-it-for-the-first-time)
- [Part 6 — Day-to-day: how to ship a change](#part-6--day-to-day-how-to-ship-a-change)
- [Part 7 — Troubleshooting: every error and its fix](#part-7--troubleshooting-every-error-and-its-fix)
  - [7.1a Deciding between "config not read" and "key not registered"](#71a-deciding-between-config-not-read-and-key-not-registered)
  - [7.7 When the deployer and the pipeline owner are different people](#77-when-the-deployer-and-the-pipeline-owner-are-different-people)
- [Part 8 — Other ways Atlassian supports (and why we didn't use them)](#part-8--other-ways-atlassian-supports-and-why-we-didnt-use-them)
- [Part 9 — Security, rotation, and housekeeping](#part-9--security-rotation-and-housekeeping)
- [Appendix A — One-page copy/paste command sheet](#appendix-a--one-page-copypaste-command-sheet)
- [Appendix B — Official Atlassian documentation](#appendix-b--official-atlassian-documentation)

---

# Part 0 — Understand the system before touching it

## 0.1 What a "pipeline" actually is

A **pipeline** is a robot that Bitbucket runs for you.

Every time you push code to Bitbucket, Bitbucket reads one file in your repository
called `bitbucket-pipelines.yml`. That file is a to-do list. Bitbucket rents a
brand-new, empty Linux computer in the cloud (it lives for a few minutes and is
then destroyed forever — this is called a **build container**), copies your code
into it, and works through your to-do list from top to bottom.

If any item on the list fails, the robot stops immediately and the items below it
never run. That property is the whole point: it is what stops broken code from
reaching your server.

Our to-do list has two kinds of item:

1. **Test gate** — install the app's dependencies and build it. If the build fails,
   stop here.
2. **Deploy** — log in to the EC2 server over SSH and tell *the server* to rebuild
   and restart its Docker containers.

**Nothing is built for production inside Bitbucket.** The build container only
ever runs `ssh`. The actual `docker compose up --build` happens on the EC2 machine.
This is deliberate: it keeps the pipeline fast and means you never have to move
large build artifacts across the internet.

## 0.2 What happens, second by second, when you deploy

```
  YOU                    BITBUCKET CLOUD                      AWS EC2 (Ubuntu)
   │                            │                                    │
   │  git push origin main      │                                    │
   ├───────────────────────────►│                                    │
   │                            │                                    │
   │                     reads bitbucket-pipelines.yml               │
   │                     rents a fresh Linux container               │
   │                            │                                    │
   │                    ┌───────▼────────┐                           │
   │                    │  STEP 1: TEST  │                           │
   │                    │  npm ci        │                           │
   │                    │  npm run build │                           │
   │                    └───────┬────────┘                           │
   │                            │ passed?  no ──► STOP, nothing deploys
   │                            │ yes                                │
   │                    ┌───────▼────────────────┐                   │
   │                    │  STEP 2: DEPLOY        │                   │
   │                    │  decode Key A          │                   │
   │                    │  write ~/.ssh/id_ed25519                   │
   │                    │  write ~/.ssh/known_hosts                  │
   │                    │  ssh ubuntu@<host> ────┼──────────────────►│
   │                    └────────────────────────┘   authenticate    │
   │                            │                    with Key A      │
   │                            │                                    │
   │                            │              ┌─────────────────────▼──────┐
   │                            │              │ cd /home/ubuntu/frontend_vp│
   │                            │              │ git fetch  ◄── uses KEY B ─┼──► Bitbucket
   │                            │              │ git reset --hard origin/... │
   │                            │              │ docker compose up -d --build│
   │                            │              │ docker image prune -f       │
   │                            │              └─────────────────────┬──────┘
   │      pipeline green        │                                    │
   │◄───────────────────────────┤◄───────────────────────────────────┘
   │                            │       new version live
```

Read that diagram twice. Notice the two arrows labelled **Key A** and **Key B**.
They are different keys, they live in different places, and mixing them up is the
number one cause of failed deploys. See [0.4](#04-the-most-important-concept-there-are-two-different-ssh-keys).

## 0.3 Glossary in plain English

| Term | What it means |
|---|---|
| **Repository (repo)** | A folder of code stored on Bitbucket, with full history. |
| **Workspace** | Your organisation on Bitbucket. Ours is `goalluvium`. |
| **Branch** | A parallel version of the code. We use `main` (test) and `prod` (production). |
| **Push** | Uploading your local commits to Bitbucket. This is what triggers a pipeline. |
| **Pull request (PR)** | A request to merge one branch into another, so it can be reviewed and tested first. |
| **Pipeline** | The robot described above. |
| **Step** | One item on the robot's to-do list. Each step gets a *fresh* container — nothing is shared between steps unless you cache or artifact it. |
| **Build container / image** | The temporary Linux machine a step runs in. `image: node:22` means "give me a machine with Node 22 already installed". |
| **Variable** | A named secret or setting you store in Bitbucket instead of in your code. The pipeline reads it as an environment variable like `$SSH_HOST`. |
| **Secured variable** | A variable Bitbucket hides. Once saved you can never read it back, and Bitbucket tries to blank it out of the build log. |
| **Deployment environment** | A named target — `test` or `production` — that has its own set of variables. Lets one pipeline file deploy to two different servers. |
| **SSH** | The protocol for logging in to a Linux server securely, without a password, using a key. |
| **SSH key pair** | Two matching files. The **private key** (secret, keep it hidden) proves who you are. The **public key** (`.pub`, safe to share) is placed on whatever you want to log in to. |
| **`authorized_keys`** | A file on a Linux server listing every public key allowed to log in as that user. |
| **`known_hosts`** | A file on the *client* listing the fingerprints of servers it trusts. Prevents someone impersonating your server. |
| **Access Key** | Bitbucket's name for a **read-only public key you add to a repository**, so a server can `git clone`/`git fetch` from it without a password. |
| **base64** | A way of rewriting any file as one long line of harmless letters, digits, `+`, `/` and `=`. Used because Bitbucket variables cannot reliably hold multi-line text. |
| **Docker / Docker Compose** | Tools that run your app inside isolated containers. `docker compose up -d --build` means "rebuild the images and (re)start everything in the background". |
| **EC2** | An AWS virtual machine. Ours runs Ubuntu. |

## 0.4 THE MOST IMPORTANT CONCEPT: there are TWO different SSH keys

Almost every deployment failure comes from confusing these. They do completely
different jobs, in opposite directions.

### Key A — "Pipeline ➜ EC2"

> **Purpose:** lets the Bitbucket build container log in to your EC2 server.

| | |
|---|---|
| Where you generate it | Your own laptop (or the EC2 box, see Part 2) |
| Suggested filename | `bb_pipeline_deploy` |
| Where the **private** half goes | Bitbucket **deployment variable** `SSH_PRIVATE_KEY_B64`, base64-encoded, secured |
| Where the **public** half goes | EC2, appended to `/home/ubuntu/.ssh/authorized_keys` |
| Direction of travel | Bitbucket → AWS |
| Symptom when wrong | `Permission denied (publickey)` in the pipeline log, or `error in libcrypto`, or `Load key: invalid format` |

### Key B — "EC2 ➜ Bitbucket"

> **Purpose:** lets your EC2 server pull the latest code from Bitbucket.

| | |
|---|---|
| Where you generate it | On the EC2 server itself |
| Suggested filename | `bitbucket_deploy` |
| Where the **private** half goes | Stays on EC2 at `/home/ubuntu/.ssh/bitbucket_deploy`. **It never leaves the server.** |
| Where the **public** half goes | Bitbucket → *Repository settings → Access keys*, for **each** repo the server pulls |
| Direction of travel | AWS → Bitbucket |
| Symptom when wrong | The deploy step fails *inside* the SSH session on the `git fetch` line, with `Permission denied (publickey)` or a request for a password |

### The three mistakes people actually make

1. **Pasting the public key into `SSH_PRIVATE_KEY_B64`.** A public key is ~100
   bytes and starts `ssh-ed25519 AAAA`. A private key is ~464 bytes and starts
   `-----BEGIN OPENSSH PRIVATE KEY-----`. Our pipeline explicitly checks for this
   and prints a clear error.
2. **Assuming one key does both jobs.** It cannot. Key A authenticates *to your
   server*; Key B authenticates *to Bitbucket*. Two separate trust relationships.
3. **Forgetting that Key B must be registered on every repo the server pulls.**
   One physical key file is fine, but *each* repository needs its own Access Key
   entry pointing at that same public key.

## 0.5 Why the private key "won't parse" — and the fix

An OpenSSH private key is a multi-line file:

```
-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAAAMwAAAAtzc2gt
ZWQyNTUxOQAAACBk1n8FqLZ6xXcQm1v0Xt9Q0aVZ3sD6bT8pWnH2Yc4bLwAAAJiK8...
...
-----END OPENSSH PRIVATE KEY-----
```

The line breaks are **part of the format**. OpenSSH refuses to read the key if
they are missing or mangled.

When you paste that text straight into a Bitbucket variable, three things can go
wrong, and typically all three do:

1. The web form may normalise, trim, or drop newlines.
2. Bitbucket's log-masking works line by line; a multi-line secret is not reliably
   masked, and this is called out in Atlassian's own variables documentation.
3. When the pipeline writes `$SSH_PRIVATE_KEY_B64` (or a raw key) into a file, the
   shell can collapse the whitespace, so the file arrives as one long line.

OpenSSH then reports one of these, all of which mean the same thing — *the key file
is not in a shape I can read*:

```
Load key "/root/.ssh/id_ed25519": invalid format
Load key "/root/.ssh/id_ed25519": error in libcrypto
Permission denied (publickey).
```

**The fix, which is the approach Atlassian documents for multi-line secrets:
base64-encode the key into a single line before storing it, and decode it inside
the pipeline.** One line survives any web form and masks correctly. That is exactly
why the variable is called `SSH_PRIVATE_KEY_B64` and not `SSH_PRIVATE_KEY`.

There is a second, sneakier cause of `error in libcrypto`, and it bit this project:

> **If you have *also* configured a key under *Repository settings → Pipelines →
> SSH keys*, Bitbucket injects that key into the container at `~/.ssh/id_rsa`
> automatically.** You then have two keys present, `ssh` offers both, and the
> failure looks like a corrupt key even though yours is fine.
>
> **Therefore: the SSH key field under Repository settings → Pipelines → SSH keys
> must be EMPTY for this pipeline.** See [3.6](#36-clear-the-repository-ssh-key-mandatory).

---

# Part G — Build a pipeline for ANY app (generic recipe)

Everything from *Prerequisites* onward is a **worked example**: the VendorPay frontend — a React + Vite app deployed to an Ubuntu EC2 instance with
Docker Compose.

This Part is the **general recipe** — no language, framework, or hosting assumed. Read it
if you are setting up a pipeline for a *different* app. Then read the rest of this document
as one filled-in instance of exactly this recipe.

You do not need to have used a terminal, Docker, or AWS before. Every step says what to
type and what "it worked" looks like.

## G.0 Absolute basics — read this if you have never done this before

**What you are creating.** One text file, named exactly `bitbucket-pipelines.yml`, in the
top folder of your repository. Bitbucket looks for that filename and nothing else. Not in a
subfolder. Not `bitbucket-pipeline.yml` (singular). Not `.yaml`.

**You can create it without a terminal.** In Bitbucket: open your repository → **Source** →
**Add file** → name it `bitbucket-pipelines.yml` → paste → **Commit**. That is enough to get
a first pipeline running. You only need a terminal later, for generating SSH keys.

**The file is YAML.** Three rules cover almost every mistake beginners make:

1. **Indent with spaces. Never press Tab.** A single tab character anywhere makes the whole
   file invalid. Most editors can be set to insert spaces when you press Tab.
2. **Indentation means "belongs to".** Things indented under `script:` are the commands that
   step runs. Getting the indent wrong changes the meaning, not just the looks.
3. **`-` starts a list item.** `- npm ci` is one command in a list of commands.

**Check the file before you trust it.** Paste it into
<https://bitbucket-pipelines.atlassian.io/validator>, or use your repo's
**Pipelines → Validator**. This catches tabs and indentation errors in seconds, and costs
you nothing.

**A "build minute" is real money.** Bitbucket bills the time your steps run. A pipeline that
fails fast is cheaper than one that hangs, which is why several settings in this guide exist
purely to make things fail immediately rather than wait.

## G.1 The five questions you must answer first

Answer these five, on paper, before writing anything. Every line of your pipeline follows
from them. Most people who get stuck skipped this and started pasting YAML.

| # | Question | What it decides | Example answer |
|---|---|---|---|
| 1 | **What kind of app is it?** | Which `image:` your steps run on, and the install/build commands | "A React site", "a Python API", "a PHP app" |
| 2 | **How do you prove it isn't broken?** | The commands in your test gate | "It builds, and `npm test` passes" |
| 3 | **Where does it need to end up?** | Your deploy method | "A Linux server I can SSH into" |
| 4 | **Which branch means 'release this'?** | Your `branches:` keys | "`main` goes to test, `prod` goes to live" |
| 5 | **What does the deploy need to know that isn't in the code?** | Your variables list | "Server address, login user, folder, SSH key" |

> **If you can't answer #2, stop and answer it first.** A pipeline whose only job is to
> deploy will happily deploy something broken, faster than you could by hand. The value is
> in the gate, not the deploy.

> **If you can't answer #3 by doing it manually, do that first.** A pipeline is only an
> automation of a process that already works. Deploy your app by hand, once, writing down
> every command. Those commands *are* your deploy step. This single habit prevents most of
> the hard debugging sessions.

## G.2 The universal shape of the file

Every Bitbucket pipeline, however complex, is this shape:

```yaml
# OPTIONAL: reusable pieces, so you write things once
definitions:
  steps:
    - step: &build          # `&build` gives this block a name you can reuse
        name: Build         # what you'll see in the Bitbucket UI
        image: node:22      # the machine this runs on
        script:             # the commands, in order
          - npm ci
          - npm run build

# REQUIRED: what runs, and when
pipelines:
  branches:                 # triggered by a PUSH to a branch
    main:
      - step: *build        # `*build` reuses the block defined above

  pull-requests:            # triggered by opening/updating a PR
    '**':                   # '**' means "from any branch"
      - step: *build
```

Five ideas, and that is genuinely all of them:

| Idea | Meaning |
|---|---|
| `pipelines:` | The only required section. Everything else is optional convenience. |
| `branches:` / `pull-requests:` | **When** to run. Keys are branch names; `'**'` matches any. |
| `step:` | One unit of work. Each step gets a **brand-new empty machine**. |
| `image:` | Which machine. `node:22` = a Linux box with Node 22 pre-installed. |
| `script:` | The commands. If any command fails, the step fails and everything after it is skipped. |

Two behaviours that surprise people, and cause real bugs:

- **Steps do not share files.** Step 2 cannot see what step 1 built, unless you explicitly
  pass it along with `artifacts:`. Each step starts empty.
- **All commands *within* one step share one shell.** So `cd somewhere` on one line still
  applies on the next line — and so does an `export`. That is convenient, and it is also a
  trap: a variable exported for one command leaks into every command after it in that step.

## G.3 Pick the machine your steps run on

`image:` is a Docker image name. If you don't set one, Bitbucket gives you a general-purpose
Linux box. Pick the smallest image that has what you need — smaller images start faster.

| Your app | Use | Notes |
|---|---|---|
| Node / React / Vue / Next | `node:22` | Use a current version. Old Node in CI hides problems you'll hit later. |
| Python / Django / FastAPI / Flask | `python:3.12` | Match the version your app actually runs on. |
| PHP / Laravel | `php:8.3-cli` | You'll usually add Composer in the script. |
| Ruby / Rails | `ruby:3.3` | |
| Go | `golang:1.23` | |
| Java / Spring | `maven:3.9-eclipse-temurin-21` | |
| .NET | `mcr.microsoft.com/dotnet/sdk:8.0` | |
| Static HTML/CSS only | `alpine:3.22` | Tiny and fast. Nothing to build. |
| Only running `ssh`, `curl`, or `rsync` | `alpine:3.22` | Add tools with `apk add --no-cache <tool>`. |
| Building Docker images | `atlassian/default-image:4` | Also needs `services: [docker]` in the step. |

> **Alpine is small because it omits things.** If a command is "not found" on Alpine, install
> it: `apk add --no-cache openssh-client git curl`. On the Debian-based images the equivalent
> is `apt-get update && apt-get install -y <tool>`.

## G.4 Write the test gate for your stack

The gate answers question #2. Pick your row, paste the commands, adjust names.

| Stack | Install | Prove it isn't broken |
|---|---|---|
| Node | `npm ci` | `npm run build` then `npm test` |
| Python | `pip install -r requirements.txt` | `python -m compileall -q .` then `pytest` |
| Django | `pip install -r requirements.txt` | `python manage.py check` then `pytest` |
| PHP / Laravel | `composer install --no-interaction` | `php artisan config:clear` then `vendor/bin/phpunit` |
| Ruby / Rails | `bundle install` | `bundle exec rake test` |
| Go | *(none needed)* | `go build ./...` then `go test ./...` |
| Java / Maven | *(none needed)* | `mvn -B verify` |
| Static site | *(none needed)* | check the files exist: `test -f index.html` |

Three rules that matter more than which commands you pick:

1. **Use the "clean install" command, not the everyday one.** `npm ci` instead of
   `npm install`; `composer install` instead of `composer update`. The everyday commands are
   allowed to quietly upgrade your dependencies, so CI would test a different set of
   libraries than you did.
2. **A build *is* a test.** For most compiled or bundled apps, the build resolves every
   import in the project and fails on anything broken. Even with no test suite at all, a
   build step catches a large share of real mistakes.
3. **Say so out loud when you're testing nothing.** If you have no tests yet, `echo` a
   warning in the step. A green tick that proves nothing is worse than a visible gap,
   because people trust it.

**If your tests need a database**, Bitbucket can start one beside your step:

```yaml
definitions:
  services:
    postgres:                       # you name it; this name is used below
      image: postgres:15
      variables:
        POSTGRES_DB: test_db
        POSTGRES_USER: test_user
        POSTGRES_PASSWORD: test_pass

pipelines:
  branches:
    main:
      - step:
          name: Test
          image: python:3.12
          services:
            - postgres              # attaches the database defined above
          script:
            - pip install -r requirements.txt
            # The database is at `localhost` from inside the step —
            # NOT at `postgres`, even though that is what you called it.
            - export DATABASE_URL="postgresql://test_user:test_pass@localhost:5432/test_db"
            - pytest
```

Two things to know: the service is reachable at **`localhost`** from your step (not by the
service's name), and it is **destroyed with the step**, so it is always empty and always
safe to write to.

## G.5 Pick how you deliver the app

This answers question #3. Pick the row that matches where your app lives.

| Method | Use when | What the pipeline needs |
|---|---|---|
| **SSH to a server** (this guide's method) | You have a Linux VM — EC2, DigitalOcean, Hetzner, a company box | An SSH key, the server address, a username, a folder |
| **`rsync` / `scp` files up** | A static site, or any app that is just files | Same as above |
| **Push a container image** | You run Kubernetes, ECS, or a registry-based host | Registry address + registry username/token |
| **Platform CLI** (Netlify, Vercel, Heroku, Firebase, Cloudflare) | You use a hosting platform | Usually a single API token |
| **Cloud provider CLI** (`aws`, `gcloud`, `az`) | Serverless, S3, App Engine, Functions | Cloud credentials, or better, OIDC |

**The lowest-effort route by far is a platform token.** If your app is on Netlify, Vercel,
Heroku or similar, your whole deploy step can be three lines and one variable:

```yaml
    - step:
        name: Deploy
        image: node:22
        deployment: production
        script:
          - npm ci
          - npm run build
          - npx netlify-cli deploy --prod --dir=dist --auth=$NETLIFY_AUTH_TOKEN --site=$NETLIFY_SITE_ID
```

**SSH is the most flexible and the most fiddly.** It needs two separate keys and understanding
which is which — the single biggest source of confusion in this whole subject. If you are
going that route, read [0.4](#04-the-most-important-concept-there-are-two-different-ssh-keys)
and [0.5](#05-why-the-private-key-wont-parse--and-the-fix) carefully; they exist because of
real failures, and they will save you hours.

## G.6 The variable worksheet

This answers question #5. A **variable** is a setting or secret you store in Bitbucket
instead of in your code, so it never gets committed. Your script reads it as `$NAME`.

### Where to put each one

Bitbucket has three places. Pick with this:

```
Does the value differ between environments (test vs live)?
├── YES ─────────────────────────────► DEPLOYMENT variable
└── NO
    └── Do several repositories need it?
        ├── YES ─────────────────────► WORKSPACE variable
        └── NO ──────────────────────► REPOSITORY variable
```

Then, separately: **would it be bad if a colleague read it in a build log?** If yes, tick
**Secured**.

| Kind | Where you set it | Reaches |
|---|---|---|
| Repository | Repository settings → **Repository variables** | Every step in this repo |
| Deployment | Repository settings → Pipelines → **Deployments** → *(pick an environment)* | **Only** steps that declare `deployment:` |
| Workspace | Workspace settings → **Workspace variables** | Every repo in the workspace |

> **The single most common variable mistake:** setting a value as a *Repository* variable
> while the step that needs it declares `deployment:`. Deployment-scoped values are only
> injected into deployment steps — but the reverse is not the problem; the problem is people
> put deploy secrets at repo scope, where *every* step can see them. Put per-environment
> values on the environment. It's both safer and clearer.

Three facts about **Secured** to know before ticking the box:

1. **You can never read the value back.** It shows as `*****` forever. Keep the real value in
   a password manager.
2. Bitbucket tries to blank secured values out of logs, but this is **unreliable for
   multi-line values** — which is why long secrets like SSH keys should be stored base64
   encoded as a single line (see [0.5](#05-why-the-private-key-wont-parse--and-the-fix)).
3. Secured values are **not** given to pipelines from forked pull requests.

### Fill this in for your app

| Variable | Value / format | How to get it | Scope | Secured |
|---|---|---|---|---|
| | | | | |

Common ones, with the command that produces each:

| Variable | Format | How to derive it |
|---|---|---|
| `SSH_HOST` | bare hostname or IP — no `https://`, no port, no slash | Your hosting panel, or AWS Console → EC2 → *Public IPv4 DNS* |
| `SSH_USER` | a Linux username | The name before `@` in your own SSH prompt (`ubuntu`, `ec2-user`, `root`) |
| `DEPLOY_PATH` | absolute path, no `~`, no trailing slash | Run `pwd` in that folder on the server |
| `SSH_PRIVATE_KEY_B64` | one line of base64 | `ssh-keygen -t ed25519 -f ~/.ssh/deploy -N ""` then `base64 -w0 ~/.ssh/deploy` |
| `KNOWN_HOSTS_B64` | one line of base64 | `ssh-keyscan -H <SSH_HOST> \| base64 -w0` |
| Registry token | a long string | Your registry's UI (Docker Hub → Security → New access token) |
| Platform token | a long string | Netlify/Vercel/Heroku account settings |
| `AWS_ACCESS_KEY_ID` | 20 chars, starts `AKIA` | IAM → Users → Security credentials → Create access key |
| `AWS_SECRET_ACCESS_KEY` | 40 chars | Shown **once**, at creation. Save it immediately. |

> On macOS, `base64 -w0` is rejected — use `base64 -i <file> | tr -d '\n'`.
> On Windows, run all of these in **Git Bash**, not PowerShell.

## G.7 Starter templates you can paste today

Each is complete and valid on its own. Start with the closest one and change the details.

### Template 1 — Just test, don't deploy anything (start here)

The safest possible first pipeline. It cannot break anything, and it immediately starts
catching broken code. Many teams should run only this for the first week.

```yaml
pipelines:
  branches:
    main:
      - step:
          name: Test gate
          image: node:22            # change to match your app
          caches:
            - node                  # reuse downloads between runs; saves build minutes
          script:
            - npm ci
            - npm run build
            - npm test

  pull-requests:
    '**':
      - step:
          name: Test gate
          image: node:22
          caches:
            - node
          script:
            - npm ci
            - npm run build
            - npm test
```

### Template 2 — Test, then deploy to a server over SSH

The pattern this repository uses. `&test` / `*test` avoids writing the gate twice.

```yaml
definitions:
  steps:
    - step: &test
        name: Test gate
        image: node:22
        caches:
          - node
        script:
          - npm ci
          - npm run build
          - npm test

    - step: &deploy
        name: Deploy over SSH
        image: alpine:3.22
        clone:
          enabled: false            # this step only runs ssh; don't waste time cloning
        script:
          - apk add --no-cache openssh-client openssh-keygen
          - |
            set -e
            mkdir -p ~/.ssh && chmod 700 ~/.ssh

            # Fail with a clear message if a variable is missing, instead of
            # failing obscurely three commands later.
            for v in SSH_PRIVATE_KEY_B64 KNOWN_HOSTS_B64 SSH_HOST SSH_USER DEPLOY_PATH; do
              [ -n "$(printenv "$v")" ] || { echo "MISSING: $v"; exit 1; }
            done

            printf '%s' "$SSH_PRIVATE_KEY_B64" | tr -d '\n\r \t' | base64 -d > ~/.ssh/id_ed25519
            chmod 600 ~/.ssh/id_ed25519
            printf '%s' "$KNOWN_HOSTS_B64"    | tr -d '\n\r \t' | base64 -d > ~/.ssh/known_hosts
            chmod 644 ~/.ssh/known_hosts
          - >
            ssh -i ~/.ssh/id_ed25519
            -o IdentitiesOnly=yes
            -o StrictHostKeyChecking=yes
            -o BatchMode=yes
            -o ConnectTimeout=15
            "$SSH_USER@$SSH_HOST"
            "set -e &&
            cd '$DEPLOY_PATH' &&
            git fetch --all --prune &&
            git reset --hard 'origin/$BITBUCKET_BRANCH' &&
            docker compose up -d --build"

pipelines:
  pull-requests:
    '**':
      - step: *test

  branches:
    main:
      - step: *test
      - step:
          <<: *deploy
          name: Deploy to test
          deployment: test
```

Why each `ssh` option is there — copy them all, they are not decoration:

| Option | Reason |
|---|---|
| `-o IdentitiesOnly=yes` | Offer only this key. Otherwise SSH offers others first and can be rejected before reaching the right one. |
| `-o StrictHostKeyChecking=yes` | Refuse unknown servers. This is what makes `KNOWN_HOSTS_B64` a real protection rather than decoration. |
| `-o BatchMode=yes` | Never prompt. A prompt in CI is a hang, and a hang burns build minutes until timeout. |
| `-o ConnectTimeout=15` | Give up in 15 seconds instead of hanging. |

### Template 3 — Build a Docker image and push it to a registry

```yaml
pipelines:
  branches:
    main:
      - step:
          name: Build and push image
          image: atlassian/default-image:4
          services:
            - docker              # required to build images
          script:
            - echo "$REGISTRY_PASSWORD" | docker login -u "$REGISTRY_USER" --password-stdin "$REGISTRY_URL"
            - docker build -t "$REGISTRY_URL/myapp:$BITBUCKET_COMMIT" -t "$REGISTRY_URL/myapp:latest" .
            - docker push "$REGISTRY_URL/myapp:$BITBUCKET_COMMIT"
            - docker push "$REGISTRY_URL/myapp:latest"
```

Tagging with `$BITBUCKET_COMMIT` as well as `latest` means every build is identifiable and
you can roll back to an exact commit. `latest` alone gives you no way back.

## G.8 Variables Bitbucket gives you free

You never define these; they are always present. They are what let one written-once step
behave correctly on different branches.

| Variable | Contains |
|---|---|
| `BITBUCKET_BRANCH` | The branch being built |
| `BITBUCKET_COMMIT` | The full commit ID — ideal as an image tag or release marker |
| `BITBUCKET_BUILD_NUMBER` | A number that increases every run |
| `BITBUCKET_REPO_SLUG` | The repository name |
| `BITBUCKET_WORKSPACE` | The workspace/organisation name |
| `BITBUCKET_PR_DESTINATION_BRANCH` | For a PR, the branch being merged *into* |
| `BITBUCKET_DEPLOYMENT_ENVIRONMENT` | `test` / `staging` / `production`, in deployment steps only |
| `BITBUCKET_CLONE_DIR` | Where your code was checked out |
| `CI` | Always `true`. Many test tools use this to run once instead of watching. |

## G.9 Switch it on

1. **Repository settings → Pipelines → Settings → Enable Pipelines.**
2. Commit `bitbucket-pipelines.yml` to your repository root.
3. If you deploy: **Repository settings → Pipelines → Deployments**, and fill in the
   variables for each environment you use.
4. If you deploy over SSH: **Repository settings → Pipelines → SSH keys must be EMPTY** when
   you supply your own key through a variable. A key configured there is injected into every
   build as `~/.ssh/id_rsa`, and having two keys present produces a misleading corrupt-key
   error. Pick one mechanism.
5. **Repository settings → Branch restrictions**, for every branch that deploys:
   - *Require passing builds before merge* — **minimum 1**
   - *Prevent a direct push*

   Step 5 is not optional if the gate is meant to mean anything. Your pipeline can refuse to
   *deploy*, but only Bitbucket can refuse a *merge*. Without this, someone can merge a red
   build and it ships.

## G.10 First run: what to look at

Push a commit, then open **Pipelines** in your repo and click the run. Click a step to watch
its log live.

Read the log from the **top**, not the bottom. The first error is the real one; everything
after it is usually a consequence. When something fails, the useful question is "what is the
earliest line that isn't what I expected?"

Three checks worth doing on the very first successful run, because a green tick alone can be
misleading:

1. **Did the gate actually test anything?** If you have no test suite, it didn't. Read the
   log and confirm what really ran.
2. **Did the deploy reach the right place?** Log in and confirm the new version is live —
   don't infer it from a green tick.
3. **Force a failure once, on purpose.** Break something trivially, push it, and confirm the
   pipeline goes red and does *not* deploy. An untested safety net isn't a safety net. This
   takes two minutes and is the single most valuable thing you can do after setup.

## G.11 The mistakes that cause most failures

In rough order of how often they occur:

| # | Mistake | What you see | Fix |
|---|---|---|---|
| 1 | A tab character in the YAML | `Configuration error` / invalid YAML | Spaces only. Run the validator. |
| 2 | Wrong filename or location | No pipeline runs at all, no error | Exactly `bitbucket-pipelines.yml`, in the repo root |
| 3 | Branch name case | Nothing runs on push, silently | Keys are case-sensitive: `main` ≠ `Main` |
| 4 | Pasting a multi-line secret directly | `invalid format` / `error in libcrypto` | Store it base64-encoded on one line ([0.5](#05-why-the-private-key-wont-parse--and-the-fix)) |
| 5 | Truncated copy-paste of a long secret | `base64: truncated input` | Pipe to the clipboard rather than selecting with the mouse |
| 6 | Variable at the wrong scope | Value behaves as empty | Deployment variables reach only steps declaring `deployment:` |
| 7 | Trailing space in a variable | A path "doesn't exist" that clearly does | Click into the field, press `End`, check the cursor position |
| 8 | Expecting files to carry between steps | "No such file or directory" | Each step starts empty. Use `artifacts:` to pass files on. |
| 9 | An interactive command | The step hangs until timeout | Add the non-interactive flag: `-y`, `--no-input`, `BatchMode=yes` |
| 10 | Assuming `docker compose` exists on the server | `not a docker command` | Install the Compose plugin, and add the deploy user to the `docker` group |
| 11 | Deploying without a gate in front | Broken code ships faster than before | Put the test step **before** the deploy step in the same pipeline |
| 12 | No branch restrictions | A red build gets merged and shipped | Enable *Require passing builds before merge* |

## G.12 Where to go next in this document

| You want to | Read |
|---|---|
| Understand the concepts properly | [Part 0](#part-0--understand-the-system-before-touching-it) |
| See a real, complete, working example | Everything from *Prerequisites* onward |
| Set up SSH deployment correctly | [Part 1](#part-1--prepare-the-ec2-server) and [Part 2](#part-2--create-key-a-pipeline--ec2) |
| Get the variables right | [Part 3](#part-3--configure-bitbucket) |
| Fix an error you are seeing right now | [Part 7](#part-7--troubleshooting-every-error-and-its-fix) |
| Hand the pipeline over to someone else | [7.7](#77-when-the-deployer-and-the-pipeline-owner-are-different-people) |
| Read Atlassian's own documentation | [Appendix B](#appendix-b--official-atlassian-documentation) |

---

# Prerequisites checklist

Tick every box before starting. Each one is a hard requirement.

- [ ] A running **Ubuntu EC2 instance** with a public IP or DNS name.
- [ ] Its **security group allows inbound TCP 22 (SSH)** — see [1.0](#10-open-port-22-in-the-aws-security-group).
- [ ] Its security group allows inbound **80/443** so users can reach the app.
- [ ] The `.pem` key file you were given when you created the instance, so *you*
      can log in as `ubuntu`.
- [ ] **Admin permission on the Bitbucket repository** (you need the *Repository
      settings* menu). If you cannot see it, ask your workspace admin.
- [ ] A terminal that has `ssh`, `ssh-keygen`, `ssh-keyscan` and `base64`.
  - macOS / Linux: built in.
  - **Windows: use Git Bash** (installed with [Git for Windows](https://gitforwindows.org/)).
    PowerShell's `ssh-keygen` exists but its `base64` equivalent behaves
    differently and will waste your afternoon. Right-click in any folder →
    *Git Bash Here*.

---

# Part 1 — Prepare the EC2 server

Everything in this Part happens **on the EC2 machine**. Nothing here involves the
pipeline yet — the goal is a server that can already deploy itself when you type
the commands by hand. **A pipeline is only an automation of a manual process that
already works.** Never skip to Part 3 hoping the pipeline will fix a broken server.

## 1.0 Open port 22 in the AWS security group

The Bitbucket build container must be able to reach your server on port 22.

1. AWS Console → **EC2** → **Instances** → select your instance.
2. **Security** tab → click the security group link.
3. **Inbound rules** → **Edit inbound rules** → **Add rule**.
4. Type `SSH`, Port `22`, and choose a Source:

| Source choice | When to use it | Trade-off |
|---|---|---|
| `0.0.0.0/0` (anywhere) | Fastest to get working | Anyone can *attempt* to connect. Safe only because password login is disabled and only your keys are authorised. Acceptable for test; think twice for production. |
| Atlassian's published Pipelines IP ranges | Production | Tightest, but Atlassian changes the list. Get it from <https://ip-ranges.atlassian.com/> and filter for the `bitbucket-pipelines` product. You must revisit it when the list changes, or deploys will suddenly fail with a connection timeout. |

Also confirm HTTP/HTTPS rules exist for ports **80** and **443** so real users can
load the site.

## 1.1 Log in to the server

From your own machine:

```bash
chmod 400 /path/to/<your-key>.pem            # macOS/Linux only; SSH refuses a world-readable key
ssh -i /path/to/<your-key>.pem ubuntu@<EC2_PUBLIC_DNS_OR_IP>
```

Success looks like a prompt such as:

```
ubuntu@ip-172-31-20-251:~$
```

Everything from here until Part 2 is typed at *that* prompt.

## 1.2 Install Docker and the Compose plugin

```bash
sudo apt-get update
sudo apt-get install -y ca-certificates curl gnupg git

sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
  | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
  | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io \
                        docker-buildx-plugin docker-compose-plugin
```

Let the `ubuntu` user run Docker **without `sudo`** — this is required, because the
pipeline runs `docker compose` non-interactively and cannot answer a `sudo`
password prompt:

```bash
sudo usermod -aG docker ubuntu
```

Now **log out and back in** (`exit`, then `ssh` again). Group membership only
applies to new sessions. Verify:

```bash
docker --version              # Docker version 27.x.x
docker compose version        # Docker Compose version v2.x.x
docker ps                     # must NOT say "permission denied"
```

> If `docker ps` says `permission denied while trying to connect to the Docker
> daemon socket`, you did not log out and back in. Do that now, or every deploy
> will fail at the last step.

## 1.3 Choose and create the deploy directory

This directory is what the variable `DEPLOY_PATH` will point at. It must be a
**git clone of this repository**, because the deploy command does `git fetch` and
`git reset --hard` inside it.

For this project:

| Environment | Suggested `DEPLOY_PATH` |
|---|---|
| test | `/home/ubuntu/frontend_vp` |
| production | `/home/ubuntu/frontend_vp_prod` (or a separate EC2 instance entirely) |

You will clone into it in [1.5](#15-clone-the-repository-over-ssh) — after Key B
exists. Do not `mkdir` it yourself; `git clone` creates it.

## 1.4 Create Key B and register it as an Access Key

**This is the step this project originally got wrong, so follow it exactly.**

### 1.4.1 Generate the key on the server

```bash
ssh-keygen -t ed25519 -C "ec2-deploy@vendorpay" -f ~/.ssh/bitbucket_deploy -N ""
```

Explanation of each flag:

| Flag | Meaning |
|---|---|
| `-t ed25519` | Modern, short, fast key type. Bitbucket supports it. Use this, not RSA. |
| `-C "..."` | A comment, purely to help you recognise the key later. |
| `-f ~/.ssh/bitbucket_deploy` | Write to this filename instead of the default `id_ed25519`. |
| `-N ""` | **Empty passphrase.** Mandatory: an automated deploy has nobody to type a passphrase. |

You now have two files:

```bash
ls -l ~/.ssh/bitbucket_deploy ~/.ssh/bitbucket_deploy.pub
# bitbucket_deploy      ~464 bytes  ← PRIVATE. Never copy this anywhere.
# bitbucket_deploy.pub  ~100 bytes  ← PUBLIC. This is what you paste into Bitbucket.
```

### 1.4.2 Tell SSH to actually use it — the step everyone forgets

Generating a key does not make SSH use it. Without configuration, SSH offers its
*default* key (`~/.ssh/id_ed25519` or `~/.ssh/id_rsa`), which Bitbucket has never
heard of, and you get `Permission denied (publickey)` while staring at a key that
looks perfectly correct.

**This is precisely the bug that broke this project's first deploy.** Create the
config file:

```bash
cat > ~/.ssh/config << 'EOF'
Host bitbucket.org
  IdentityFile ~/.ssh/bitbucket_deploy
  IdentitiesOnly yes
EOF
chmod 600 ~/.ssh/config
```

| Line | Why it's there |
|---|---|
| `Host bitbucket.org` | Apply the rules below only when connecting to bitbucket.org. |
| `IdentityFile ~/.ssh/bitbucket_deploy` | Use *this* key. |
| `IdentitiesOnly yes` | Use **only** this key. Without it, SSH still offers every other key first; after ~5 rejections the server drops the connection before reaching the right one. |

Confirm the file exists — an empty `ls` here means the deploy *will* fail later:

```bash
ls -la ~/.ssh/
# expect: config, bitbucket_deploy, bitbucket_deploy.pub
```

### 1.4.3 Print the public key

```bash
cat ~/.ssh/bitbucket_deploy.pub
```

Copy the **entire single line**, from `ssh-ed25519` to the end of the comment. It
looks like:

```
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIH8k2rQ1vN3pLm5tY7cXwJ0bF9eR4sD6uZ1aK3nQ8pTz ec2-deploy@vendorpay
```

### 1.4.4 Add it to Bitbucket as an Access Key

1. Open <https://bitbucket.org/goalluvium/vendorpay-frontend>
2. **Repository settings** (left sidebar, near the bottom)
3. Under *Security*, click **Access keys**
4. **Add key**
   - *Label:* `ec2-test-server` (any name that tells you which machine it is)
   - *Key:* paste the whole `ssh-ed25519 AAAA... ` line
5. **Add key**

Notes that matter:

- An Access Key is **read-only**. The server can pull; it can never push. That is
  exactly what you want.
- **Repeat this for every repository the server pulls.** The same public key can be
  reused, but each repo needs its own Access Key entry. If this EC2 box also hosts
  the backend, add the same key to `goalluvium/vendorpaybackend` too.
- Do **not** put this key under *Pipelines → SSH keys*. Different feature, different
  purpose, and it will actively break your deploy ([3.6](#36-clear-the-repository-ssh-key-mandatory)).

### 1.4.5 Test it

```bash
ssh -T git@bitbucket.org
```

**Success** looks like this:

```
authenticated via ssh key.
You can use git to connect to Bitbucket. Shell access is disabled
```

`Shell access is disabled` is **not an error** — Bitbucket never gives you a shell.
Seeing `authenticated via ssh key` means Key B works.

If it fails, run the verbose version and read it carefully:

```bash
ssh -vT git@bitbucket.org
```

Two lines tell you everything:

- `Reading configuration data /home/ubuntu/.ssh/config` — your config was found.
  If this line is absent, the file is missing or misnamed.
- `Offering public key: /home/ubuntu/.ssh/bitbucket_deploy` — the right key was
  offered. If it offers `id_ed25519` or `id_rsa` instead, your `~/.ssh/config` is
  not being read. If it offers `bitbucket_deploy` and is still rejected, the public
  key is not registered correctly on the repo — re-do 1.4.4 and compare
  fingerprints with `ssh-keygen -lf ~/.ssh/bitbucket_deploy.pub`.

## 1.5 Clone the repository over SSH

**Use the SSH URL, never the HTTPS URL.** An HTTPS remote asks for a username and
password, which an automated deploy cannot supply. This was the second bug in this
project's rollout.

```bash
cd /home/ubuntu
git clone git@bitbucket.org:goalluvium/vendorpay-frontend.git frontend_vp
cd frontend_vp
git remote -v
```

You must see `git@bitbucket.org:...`:

```
origin  git@bitbucket.org:goalluvium/vendorpay-frontend.git (fetch)
origin  git@bitbucket.org:goalluvium/vendorpay-frontend.git (push)
```

### What an HTTPS remote looks like when it fails in the pipeline

Worth recognising on sight, because the message names neither git nor SSH:

```
fatal: could not read Password for 'https://azeez4@bitbucket.org': No such device or address
```

`No such device or address` is git failing to **open a terminal** to prompt for a
password. Interactively you would simply be asked for one; inside a pipeline there is
no TTY, so it dies instead. No password will ever fix this — the remote has to be SSH
so it authenticates with Key B. The username baked into the URL (`azeez4` above) is a
good clue that the clone was made by a person, by hand, over HTTPS.

### Switching an existing clone from HTTPS to SSH

**If you already have a clone that uses HTTPS** — that is, `git remote -v` shows
`https://<user>@bitbucket.org/...` — you do not need to re-clone. Just switch the
URL:

```bash
cd /home/ubuntu/frontend_vp
git remote set-url origin git@bitbucket.org:goalluvium/vendorpay-frontend.git
git remote -v          # confirm it changed
git fetch --all --prune
```

Check the shape of the new URL carefully: `git@bitbucket.org:` with a **colon** before
the workspace, no `https://`, no username, no `//` after the host.

### Audit every clone on the box, not just this one

One server often hosts several deploy directories, and they get converted one at a
time — so the next pipeline fails the same way a week later. List them all at once:

```bash
for d in /home/ubuntu/*/; do
  [ -d "$d.git" ] && printf '%-45s %s\n' "$d" "$(git -C "$d" remote get-url origin)"
done
```

Anything still printing `https://` will fail as soon as its pipeline runs. Fix them now.

### Verify the way the pipeline does it — not interactively

An interactive `git fetch` can succeed while the pipeline still fails, because your
session has a terminal and can fall back to prompting. Reproduce the real conditions
**from your laptop**, so there is no TTY on the far end:

```bash
ssh -i ~/.ssh/bb_pipeline_deploy -o IdentitiesOnly=yes -o BatchMode=yes \
    ubuntu@<SSH_HOST> \
    "cd /home/ubuntu/frontend_vp && git fetch --all --prune && echo FETCH_OK"
```

`FETCH_OK`, with no prompt and no error, is the only result that proves the deploy step
will get past this line.

> **`~/.ssh/config`, Key B and `known_hosts` all belong to one Linux user.** If the
> pipeline logs in as a different user than the one you just configured, none of this
> applies to it. See
> [7.7](#77-when-the-deployer-and-the-pipeline-owner-are-different-people).

That `git fetch` must complete **with no password prompt**. If it prompts, Key B
or `~/.ssh/config` is still wrong — go back to 1.4.

## 1.6 Do one deploy by hand

Prove the server can deploy itself before automating it. Run exactly the commands
the pipeline will run:

```bash
cd /home/ubuntu/frontend_vp
git fetch --all --prune
git checkout main
git reset --hard origin/main
export VITE_BACKEND_URL="https://str.ec2.alluvium.net/vendorpay"
docker compose up -d --build
docker compose ps
docker image prune -f
```

What each line does:

| Command | Purpose |
|---|---|
| `git fetch --all --prune` | Download all new commits; delete references to branches that no longer exist on Bitbucket. |
| `git reset --hard origin/main` | Make the working directory **exactly** match Bitbucket. Discards any local edits — intentional, so nobody's hand-hacked file survives a deploy. |
| `export VITE_BACKEND_URL=...` | Vite bakes this into the JavaScript **at build time**. Set it *before* the build or the app ships pointing at nothing. |
| `docker compose up -d --build` | Rebuild images from the new code and restart containers in the background. |
| `docker image prune -f` | Delete the now-unused old images so the disk doesn't fill up. |

Verify:

```bash
docker compose ps                   # frontend should be "running"
curl -I http://localhost:3000       # expect HTTP/1.1 200 OK
docker compose logs --tail=50 frontend
```

Then open `http://<EC2_PUBLIC_IP>:3000` (or your real domain) in a browser.

**Do not continue to Part 2 until this works by hand.** If it fails here, it is an
app/Docker problem, not a pipeline problem, and the pipeline cannot help you.

---

# Part 2 — Create Key A (Pipeline ➜ EC2)

Key A lets the Bitbucket build container log in to EC2. We will produce three
values here, all of which become Bitbucket variables in Part 3.

## 2.1 Generate the key pair

Run this **on your own laptop, in Git Bash (Windows) or Terminal (macOS/Linux)**.

Generating on your laptop is preferred because the private key never has to be
copied *off* a server — copying a key out of a terminal window is where truncation
happens.

```bash
ssh-keygen -t ed25519 -C "bitbucket-pipelines@vendorpay-frontend" \
           -f ~/.ssh/bb_pipeline_deploy -N ""
```

Again: `-N ""` gives an **empty passphrase**. A passphrase-protected key cannot be
used by an unattended pipeline; ours detects this and fails with a clear message.

You now have:

- `~/.ssh/bb_pipeline_deploy` — **private**, ~464 bytes → goes to Bitbucket (encoded)
- `~/.ssh/bb_pipeline_deploy.pub` — **public**, ~100 bytes → goes to EC2

<details>
<summary>Alternative: generate on the EC2 server instead (click to expand)</summary>

Acceptable, but you must then copy the private key down to your machine to encode
it. Do it with `scp` — **never** by selecting text in a terminal window, which
silently drops the tail of wrapped lines:

```bash
# on EC2
ssh-keygen -t ed25519 -C "bitbucket-pipelines@vendorpay-frontend" \
           -f ~/.ssh/bb_pipeline_deploy -N ""
cat ~/.ssh/bb_pipeline_deploy.pub >> ~/.ssh/authorized_keys

# on your laptop
scp -i <your-key>.pem ubuntu@<EC2_HOST>:~/.ssh/bb_pipeline_deploy ./bb_pipeline_deploy
```

Then encode the local copy in 2.3 and delete it afterwards.
</details>

## 2.2 Authorise the public half on EC2

Copy the public key to the server. The clean way:

```bash
ssh-copy-id -i ~/.ssh/bb_pipeline_deploy.pub \
            -o "IdentityFile=/path/to/<your-key>.pem" ubuntu@<EC2_HOST>
```

If `ssh-copy-id` isn't available (common on Windows), do it manually:

```bash
# On your laptop — print the public key and copy it
cat ~/.ssh/bb_pipeline_deploy.pub
```

```bash
# On the EC2 server — append it, then lock down permissions
mkdir -p ~/.ssh && chmod 700 ~/.ssh
echo "ssh-ed25519 AAAA...paste-the-whole-line... bitbucket-pipelines@vendorpay-frontend" \
  >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

> Use `>>` (append), **not** `>` (overwrite). A single `>` erases every other
> authorised key, including your own `.pem` access, and can lock you out of the
> instance permanently.

Verify from your laptop that Key A can log in:

```bash
ssh -i ~/.ssh/bb_pipeline_deploy -o IdentitiesOnly=yes ubuntu@<EC2_HOST> "echo OK; hostname"
```

Expected output: `OK` followed by the hostname. If you get `Permission denied
(publickey)`, the public key is not in `authorized_keys` correctly — check for a
line break inserted mid-key by your editor. Also record the fingerprint so you can
compare it against what the pipeline reports:

```bash
ssh-keygen -lf ~/.ssh/bb_pipeline_deploy.pub
# 256 SHA256:hR9v...  bitbucket-pipelines@vendorpay-frontend (ED25519)
```

## 2.3 Produce `SSH_PRIVATE_KEY_B64`

This is the value that solves the "private key won't parse" problem.

**macOS / Linux / Git Bash on Windows:**

```bash
base64 -w0 ~/.ssh/bb_pipeline_deploy
```

**macOS, if `-w0` is rejected** (BSD `base64` has no `-w` flag):

```bash
base64 -i ~/.ssh/bb_pipeline_deploy | tr -d '\n'
```

### The `-w0` is not optional

`base64` without `-w0` wraps its output at 76 characters, producing multi-line
output — which reintroduces the exact problem you are trying to solve. `-w0` means
"zero wrapping: one single line".

### Check the length before you paste it

```bash
base64 -w0 ~/.ssh/bb_pipeline_deploy | wc -c
```

| You see | Meaning |
|---|---|
| `620` | Correct for a standard ed25519 key. |
| Any other multiple of 4 | Probably fine — key sizes vary slightly with comment length. |
| **Not** a multiple of 4 | The value is **truncated**. Base64 always comes in groups of 4. Re-copy it. |

The pipeline prints this same count in its log and fails loudly if it isn't a
multiple of 4, so you get a real diagnosis instead of `error in libcrypto`.

### Copy it without losing characters

The output is one ~620-character line. Selecting it with a mouse in a wrapped
terminal **frequently drops the last line** — this is the single most common cause
of the failure you hit. Pipe it to the clipboard instead:

```bash
# Windows (Git Bash)
base64 -w0 ~/.ssh/bb_pipeline_deploy | clip

# macOS
base64 -i ~/.ssh/bb_pipeline_deploy | tr -d '\n' | pbcopy

# Linux (X11)
base64 -w0 ~/.ssh/bb_pipeline_deploy | xclip -selection clipboard
```

### Exact required format

- **One line.** No spaces, no newlines, no quotes around it.
- Characters only from `A–Z a–z 0–9 + / =`.
- Length a multiple of 4; may end in `=` or `==`.
- It must encode the **private** key. Sanity-check by decoding it back:

```bash
base64 -w0 ~/.ssh/bb_pipeline_deploy | base64 -d | head -n 1
# -----BEGIN OPENSSH PRIVATE KEY-----     ← correct
# ssh-ed25519 AAAA...                     ← WRONG, that's the public key
```

## 2.4 Produce `KNOWN_HOSTS_B64`

`known_hosts` is how the pipeline verifies it is talking to *your* server and not
an impostor. Without it, `ssh` would stop and ask "are you sure?", which an
automated pipeline cannot answer — and disabling the check (`StrictHostKeyChecking=no`)
would leave the deploy open to a man-in-the-middle. So we pin the host key.

Run this **on a machine you trust**, on a network you trust:

```bash
ssh-keyscan -H <EC2_PUBLIC_DNS_OR_IP>
```

That prints the server's host keys. Encode them:

```bash
ssh-keyscan -H <EC2_PUBLIC_DNS_OR_IP> | base64 -w0
```

### Critical: use the same name as `SSH_HOST`

`ssh-keyscan` records **whatever name you typed**. If you scan the IP `13.51.x.x`
but set `SSH_HOST=str.ec2.alluvium.net`, verification fails with
`Host key verification failed` even though everything else is right.

> **Rule: the argument to `ssh-keyscan` and the value of `SSH_HOST` must be
> byte-for-byte identical.**

Our pipeline checks this for you and prints:

```
FAIL: known_hosts decoded but has no entry for '<SSH_HOST>'.
```

### Format

- One line, base64 characters only, length a multiple of 4.
- Decodes to one or more lines each beginning `|1|` (the `-H` flag hashes the
  hostname, which is why it looks scrambled — that's normal and correct).

Verify:

```bash
ssh-keyscan -H <EC2_HOST> | base64 -w0 | base64 -d
```

> **Re-scan whenever the host key changes.** Rebuilding the instance, or an
> Elastic IP moving to a new machine, changes the host key and every deploy will
> fail until you regenerate this variable.

## 2.5 Collect the remaining plain values

| Variable | How to get it |
|---|---|
| `SSH_HOST` | AWS Console → EC2 → Instances → your instance → **Public IPv4 DNS**, or your own domain if you have one pointed at it. **Attach an Elastic IP** or use a domain — a default public IP changes every time the instance stops, and your pipeline breaks silently. |
| `SSH_USER` | `ubuntu` for Ubuntu AMIs. (`ec2-user` on Amazon Linux, `admin` on Debian.) Confirm it: it is the name in your own shell prompt, `ubuntu@ip-172-31-20-251`. |
| `DEPLOY_PATH` | The absolute path from [1.3](#13-choose-and-create-the-deploy-directory), e.g. `/home/ubuntu/frontend_vp`. Get it exactly by running `pwd` inside that directory. Absolute path, no `~`, no trailing slash. |
| `VITE_BACKEND_URL` | The public URL of the backend API this frontend calls, e.g. `https://str.ec2.alluvium.net/vendorpay`. No trailing slash. Must differ between test and production. |

---

# Part 3 — Configure Bitbucket

## 3.1 Enable Pipelines

1. <https://bitbucket.org/goalluvium/vendorpay-frontend>
2. **Repository settings** → under *Pipelines*, click **Settings**
3. Toggle **Enable Pipelines** on

## 3.2 Make sure `bitbucket-pipelines.yml` is in the repo root

Pipelines only reads a file with that exact name, at the top level of the
repository. Not in a subfolder, not `bitbucket-pipeline.yml` (singular), not
`.yaml`. This repository already has the correct file — see
[Part 4](#part-4--the-pipeline-file-explained).

## 3.3 Create the deployment environments

Deployment environments are what let one pipeline file deploy to two different
servers with two different sets of secrets.

1. **Repository settings** → *Pipelines* → **Deployments**
2. Bitbucket pre-creates **Test**, **Staging** and **Production**. We use **Test**
   and **Production**.

> **Names are case-sensitive where they matter.** The pipeline file says
> `deployment: test` and `deployment: production` (lowercase). These map to
> Bitbucket's built-in Test and Production environments. Do not rename them.

## 3.4 THE VARIABLE REFERENCE TABLE

This is the answer to "which variables do I need, how do I derive them, what
format, and repository or deployment?"

Add deployment variables at: **Repository settings → Pipelines → Deployments →**
click **Test** (then repeat for **Production**) **→ Add variable**.

### Variables for this repository (all six are DEPLOYMENT variables)

| # | Variable | Scope | Secured? | Exact format | Example | Command to derive it |
|---|---|---|---|---|---|---|
| 1 | `SSH_PRIVATE_KEY_B64` | **Deployment** | ✅ **Yes** | Single line of base64. `A–Za–z0–9+/=` only. Length a multiple of 4 (620 for ed25519). Encodes a **private** key. | `b3BlbnNzaC1rZXktdjEAAAAABG5vbmUA...` (620 chars) | `base64 -w0 ~/.ssh/bb_pipeline_deploy` |
| 2 | `KNOWN_HOSTS_B64` | **Deployment** | ⬜ No (not secret) | Single line of base64, decoding to `|1|...` lines | `fDF8...` | `ssh-keyscan -H <SSH_HOST> \| base64 -w0` |
| 3 | `SSH_HOST` | **Deployment** | ⬜ No | Hostname or IP. **No** `https://`, no port, no user, no trailing slash. Must match the `ssh-keyscan` argument exactly. | `str.ec2.alluvium.net` | AWS Console → EC2 → *Public IPv4 DNS* |
| 4 | `SSH_USER` | **Deployment** | ⬜ No | Linux username, lowercase, nothing else | `ubuntu` | The name before `@` in your SSH prompt |
| 5 | `DEPLOY_PATH` | **Deployment** | ⬜ No | Absolute path. No `~`, no trailing slash, no quotes. | `/home/ubuntu/frontend_vp` | `pwd` inside the clone on EC2 |
| 6 | `VITE_BACKEND_URL` | **Deployment** | ⬜ No | Full URL including scheme. No trailing slash. | `https://str.ec2.alluvium.net/vendorpay` | Your backend's public URL |

### Why all six are deployment-scoped, not repository-scoped

Every one of them differs between test and production — including the key, which
should be different per environment so a compromised test key cannot touch
production. Scoping them to the environment also means they are **only** injected
into steps that declare `deployment:`. The test-gate step never sees the production
SSH key. That is a real security boundary, and it is free.

### Set the values twice — once per environment

| Variable | Test environment | Production environment |
|---|---|---|
| `SSH_PRIVATE_KEY_B64` | base64 of the **test** server's Key A | base64 of the **production** server's Key A |
| `KNOWN_HOSTS_B64` | keyscan of the **test** host | keyscan of the **production** host |
| `SSH_HOST` | `<test host>` | `<production host>` |
| `SSH_USER` | `ubuntu` | `ubuntu` |
| `DEPLOY_PATH` | `/home/ubuntu/frontend_vp` | `/home/ubuntu/frontend_vp_prod` |
| `VITE_BACKEND_URL` | test API URL | production API URL |

> **A missing variable is the most common configuration error, and it used to fail
> obscurely** — an empty key writes a 0-byte file and reads as
> `Permission denied (publickey)`; an empty `SSH_HOST` makes the command literally
> `ssh ubuntu@`. Our pipeline therefore checks all six up front and prints
> `MISSING: <NAME> is empty` naming the variable and the environment. If you see
> that, it is a typo or a wrong scope — nothing more.
>
> Watch the spelling: it is `SSH_HOST`, **not** `SSH_HOSTS`.

### When you'd use a Repository variable instead

Use **Repository variables** (*Repository settings → Repository variables*) for
values that are identical across every environment and every branch — for example
a `NODE_ENV`, a Slack webhook for build notifications, or a shared registry
namespace. Nothing in this pipeline qualifies.

Use **Workspace variables** (*Workspace settings → Workspace variables*) for
values shared by *many repositories* — e.g. one `DOCKERHUB_TOKEN` used by every
repo in `goalluvium`. Available to all repos in the workspace, so only put things
there that genuinely belong to everyone.

## 3.5 Repository vs Deployment vs Workspace variable — how to decide

Bitbucket resolves variables in this order, most specific winning:

```
Deployment  ►  Repository  ►  Workspace          (plus Bitbucket's own BITBUCKET_* )
   most specific wins if the same name is defined at several levels
```

Use this decision tree:

```
Does the value differ between test and production?
├── YES ──────────────────────────────► DEPLOYMENT variable
└── NO
    └── Is it used by more than one repository?
        ├── YES ──────────────────────► WORKSPACE variable
        └── NO ───────────────────────► REPOSITORY variable
```

Then, independently:

```
Would it cause harm if a colleague read it in a build log?
├── YES ──────────────────────────────► tick "Secured"
└── NO ───────────────────────────────► leave it visible (easier to debug)
```

Three facts about **secured** variables you need to know before you tick the box:

1. **You can never read the value back.** Bitbucket shows it as `*****` forever.
   Keep the source of truth elsewhere (a password manager), or be ready to
   regenerate.
2. Bitbucket **attempts** to mask secured values in logs, but masking is not
   guaranteed for multi-line or oddly-formatted values — another reason base64
   single-line encoding is the right call.
3. Secured variables are **not** passed to pipelines triggered by a pull request
   **from a fork**. Not relevant here (we don't use forks), but it explains why a
   forked PR would fail to deploy.

## 3.6 Clear the repository SSH key (MANDATORY)

1. **Repository settings** → *Pipelines* → **SSH keys**
2. If a key pair is shown here, **delete it**.

Why this matters: when a key exists there, Bitbucket copies it into every build
container as `~/.ssh/id_rsa` and adds its own `known_hosts`. Combined with the key
our pipeline writes, `ssh` has two identities to offer and the result is the
misleading `error in libcrypto` failure. **One key mechanism at a time.** We use
deployment variables; therefore this field must be empty.

## 3.7 Turn on branch protection so the gates actually gate

Without this, Bitbucket will happily let someone merge a pull request whose build
is red. The pipeline can only refuse to *deploy*; it cannot refuse a *merge*.

**Repository settings** → *Branch restrictions* → **Add a branch restriction**, for
`main` and again for `prod`:

- ✅ **Require passing builds before merge** — minimum **1**
- ✅ **Prevent a direct push** (forces every change through a pull request)
- ✅ Require at least 1 approval (recommended)

## 3.8 Repo housekeeping specific to this repository

This repo currently has **both `main` and `Main`** on the remote, and
`origin/HEAD` points at **`Main`**.

Branch keys in `bitbucket-pipelines.yml` are **case-sensitive**: the `main:` key
matches a push to `main` and does **not** match a push to `Main`. A push to `Main`
therefore matches no pipeline at all, runs no tests, and **deploys nothing** — with
no error anywhere to tell you.

Fix it:

```bash
# make sure nothing unique lives on Main first
git fetch --all
git log --oneline origin/main..origin/Main     # must print nothing

git push origin --delete Main
```

Then in **Repository settings → Repository details**, set the **Main branch**
to `main`.

---

# Part 4 — The pipeline file, explained

The file lives at `bitbucket-pipelines.yml` in the repo root. This section explains
what is already there so you can maintain it. You do not need to retype it.

## 4.1 The shape of the file

```yaml
definitions:      # reusable pieces, referenced by &anchor / *alias
  steps:
    - step: &guard   ...
    - step: &test    ...
    - step: &deploy  ...

pipelines:        # what runs, and when
  pull-requests:
    '**': ...
  branches:
    main: ...
    prod: ...
```

`&name` **defines** a reusable block (an *anchor*); `*name` **reuses** it (an
*alias*); `<<: *name` reuses it **and lets you override individual fields**. This
is why the deploy logic is written once but used by both `main` and `prod`.

## 4.2 The branching model

| Trigger | What runs | Result |
|---|---|---|
| Open a PR from a feature branch into `main` | promotion guard + test gate | reports pass/fail on the PR |
| Push or merge to `main` | test gate → deploy | ships to **test** environment |
| Open a PR `main` → `prod` | promotion guard + test gate | guard proves the commit already went through test |
| Merge `main` → `prod` | test gate → deploy | ships to **production** |
| Open a PR `prod` → `main` (back-merge) | test gate only | proves the merged result still builds; the guard is skipped because it only polices PRs *into* prod |
| Merge `prod` → `main` | test gate → deploy | ships to **test**, via the `branches: main` entry |

Steps run in order and a failed step aborts the pipeline. That single property is
what guarantees a deploy step can never run unless the gate ahead of it passed
**on that exact commit**.

### Which branch's YAML decides — the rule that catches everyone

Bitbucket always reads `bitbucket-pipelines.yml` **from the branch being built**, and
for a pull request that is the PR's **source** branch. `pull-requests:` keys are
matched against the source branch too.

| Event | File that governs it | Key matched |
|---|---|---|
| PR `main` → `prod` | **main's** copy | `'**'` (source is `main`) |
| PR `prod` → `main` | **prod's** copy | `prod` (source is `prod`) |
| PR `feature/x` → `main` | **feature/x's** copy | `'**'` |
| Push/merge to `main` | **main's** copy | `branches: main` |
| Push/merge to `prod` | **prod's** copy | `branches: prod` |

The consequence is worth stating bluntly: **you cannot fix a `prod` → `main` PR
pipeline by editing `main`.** If prod's copy of the file has no `pull-requests`
section, that PR runs *nothing* — no gate, no report, no red build, no error
message anywhere. It just silently has no checks.

This repo hit exactly that. prod's copy of the file was an older revision with only
a `branches:` section, which is why merges `main` → `prod` built but PRs `prod` →
`main` appeared to do nothing.

**So: whenever `bitbucket-pipelines.yml` changes on `main`, promote it to `prod`.**
Treat the two copies as one file that happens to live in two places. To check
whether they have drifted:

```bash
git fetch --all --prune
git diff origin/main:bitbucket-pipelines.yml origin/prod:bitbucket-pipelines.yml
```

No output means they are in sync. Any output is a latent difference in what your two
branches will actually do.

> Note that the **merge** `prod` → `main` always built, even before this fix — a
> merge is a push to `main`, so `branches: main` in main's own copy handles it. Only
> the PR *preview* was missing. If you have been merging back-merges without seeing a
> build on the PR, the deploy to test still happened afterwards.

## 4.3 Step 1 — the promotion guard

Prevents someone opening a PR straight from a feature branch into `prod`, skipping
the test environment. It:

1. Exits immediately (success) if the PR is not targeting `prod`.
2. Fails if the PR source branch is not `main`.
3. Fails if the commit is not an ancestor of `origin/main` — i.e. it was never on
   `main`, therefore never deployed to test.

It needs `clone: depth: full` because `git merge-base --is-ancestor` requires real
history, not the shallow clone Pipelines uses by default.

## 4.4 Step 2 — the test gate

Runs on `image: node:22`.

- `npm ci` — **not** `npm install`. `ci` installs the exact tree recorded in
  `package-lock.json`, so CI resolves what you tested locally.
- `npm run build` — a Vite production build. This is the real signal: it resolves
  every import across `src/` and fails on any broken module.
- Asserts `dist/index.html` exists, then lists `dist/`.
- Runs `npm test` if a `test` script exists; otherwise prints a warning saying
  plainly that the unit-test portion asserted nothing.

`caches: [node]` reuses the npm cache between runs to save minutes.

**Linting is deliberately not blocking.** `eslint .` currently reports 36
pre-existing findings (regex escapes, unused identifiers, react-hooks warnings),
none of which are runtime defects. Run `npm run lint` locally to work through them;
it must not stand between a correct change and a deploy.

## 4.5 Step 3 — the deploy step

```yaml
- step: &deploy
    name: Deploy over SSH
    image: alpine:3.22
    clone:
      enabled: false        # nothing is built here, so don't waste time cloning
    script:
      - apk add --no-cache openssh-client openssh-keygen
      ...
```

Two details worth knowing:

- **`clone: enabled: false`** — the step only runs `ssh`, so the source code is not
  needed. Skipping the clone makes it start in seconds.
- **`openssh-keygen` is a separate Alpine package from `openssh-client`.** Without
  it, `ssh-keygen` is simply "not found" and every key validation below dies with
  no explanation.

The script then, in order:

1. Verifies all six deployment variables are non-empty, naming any that is missing.
2. Strips stray whitespace from `SSH_PRIVATE_KEY_B64` and reports its character
   count; fails with an explanation if it isn't a multiple of 4.
3. Decodes it to `~/.ssh/id_ed25519`, `chmod 600`.
4. Checks the first line says `BEGIN ... PRIVATE KEY` — catching a pasted **public**
   key, and printing which one you supplied.
5. Runs `ssh-keygen -y` to derive the public half. This fails on a malformed key and
   on a passphrase-protected key, and prints the **fingerprint** so you can compare
   it with `ssh-keygen -lf ~/.ssh/authorized_keys` on the server.
6. Decodes `KNOWN_HOSTS_B64` to `~/.ssh/known_hosts` and confirms it contains an
   entry for `$SSH_HOST`.
7. Opens the SSH connection and runs the deploy.

The connection flags, and why each is there:

| Flag | Reason |
|---|---|
| `-i ~/.ssh/id_ed25519` | Use the key we just decoded. |
| `-o IdentitiesOnly=yes` | Use **only** that key — don't offer anything else Bitbucket may have injected. |
| `-o StrictHostKeyChecking=yes` | Refuse to connect to an unrecognised host. This is what makes `KNOWN_HOSTS_B64` a security control rather than a formality. |
| `-o BatchMode=yes` | Never prompt for anything. A prompt in CI is a hang, and a hang is a wasted build minute until timeout. |
| `-o ConnectTimeout=15` | Fail in 15 seconds if the host is unreachable, instead of hanging. |

And the remote command:

```bash
set -e &&
cd '$DEPLOY_PATH' &&
git fetch --all --prune &&
git checkout '$BITBUCKET_BRANCH' &&
git reset --hard 'origin/$BITBUCKET_BRANCH' &&
export VITE_BACKEND_URL='$VITE_BACKEND_URL' &&
docker compose up -d --build &&
docker image prune -f
```

`$BITBUCKET_BRANCH` is supplied automatically by Bitbucket, so the *same* command
deploys `main` to the test box and `prod` to the production box.

## 4.6 Built-in variables you get for free

Bitbucket injects these; you never define them.

| Variable | Contains |
|---|---|
| `BITBUCKET_BRANCH` | The branch being built (`main`, `prod`). Not set for PR-triggered builds of merge results. |
| `BITBUCKET_COMMIT` | Full commit SHA. |
| `BITBUCKET_BUILD_NUMBER` | Incrementing build number. |
| `BITBUCKET_REPO_SLUG` | `vendorpay-frontend` |
| `BITBUCKET_WORKSPACE` | `goalluvium` |
| `BITBUCKET_DEPLOYMENT_ENVIRONMENT` | `test` or `production` — only in steps with `deployment:`. |
| `BITBUCKET_PR_DESTINATION_BRANCH` | Target branch of a PR. Used by the promotion guard. |
| `BITBUCKET_CLONE_DIR` | Absolute path to the cloned source inside the container. |
| `CI` | `true`. This is why `npm test` runs once instead of watching. |

---

# Part 5 — Run it for the first time

## 5.1 Trigger it

Either push a commit to `main`:

```bash
git checkout main
git pull
git commit --allow-empty -m "chore: trigger first pipeline run"
git push origin main
```

Or run it manually: repository → **Pipelines** → **Run pipeline** → pick branch
`main`.

## 5.2 Watch it

Repository → **Pipelines** → click the running build. Click a step to stream its log.

## 5.3 What a healthy deploy log looks like

```
+ apk add --no-cache openssh-client openssh-keygen
OK: all six deployment variables are present
SSH_PRIVATE_KEY_B64: 620 base64 characters received
decoded private key: 464 bytes
deploy key: 256 SHA256:hR9v...  (ED25519)
  ^ compare against: ssh-keygen -lf ~/.ssh/authorized_keys  (as ubuntu on str.ec2.alluvium.net)
known_hosts: 3 entries
OK: host key for str.ec2.alluvium.net is pinned
+ ssh -i ~/.ssh/id_ed25519 ... ubuntu@str.ec2.alluvium.net ...
 ✔ Container vendorpay-frontend  Started
Total reclaimed space: 412.3MB
```

Check the four numbers: **620** base64 chars, **464** decoded bytes, a
**fingerprint**, and a `known_hosts` **entry count of at least 1**. If all four are
right and it still fails, the problem is on the server, not in your variables.

## 5.4 Confirm the app really updated

```bash
ssh -i <your-key>.pem ubuntu@<EC2_HOST>
cd /home/ubuntu/frontend_vp
git log -1 --oneline          # should be the commit you just pushed
docker compose ps             # containers "running", recent uptime
docker compose logs --tail=50 frontend
```

Then hard-reload the site in a browser (Ctrl+Shift+R / Cmd+Shift+R) — browsers
cache aggressively and a stale page can look like a failed deploy.

---

# Part 6 — Day-to-day: how to ship a change

```
feature branch ──PR──► main ──(auto)──► TEST server
                        │
                        └──PR──► prod ──(auto)──► PRODUCTION server
```

### Shipping to test

```bash
git checkout main
git pull
git checkout -b feature/my-change
# ... edit code ...
git add -A
git commit -m "feat: describe the change"
git push origin feature/my-change
```

Open a PR into `main` on Bitbucket. Wait for the green build. Merge. The merge to
`main` automatically deploys to the test server. Verify it there.

### Promoting to production

1. Bitbucket → **Pull requests** → **Create pull request**
2. Source `main`, destination `prod`
3. The promotion guard confirms the commit really went through test
4. Merge → production deploys automatically

Never push directly to `prod`. The whole point of the guard is that production only
ever receives code that has already run on test.

### If a deploy breaks production

Roll back by pointing `prod` at the last good commit:

```bash
git checkout prod
git pull
git reset --hard <last-good-commit-sha>
git push --force-with-lease origin prod
```

That push retriggers the pipeline, which redeploys the older code. Or, faster, SSH
in and do it by hand:

```bash
ssh ubuntu@<EC2_HOST>
cd /home/ubuntu/frontend_vp_prod
git reset --hard <last-good-commit-sha>
docker compose up -d --build
```

---

# Part 7 — Troubleshooting: every error and its fix

Find your exact message. The left column is what you see in the log.

## 7.1 Private-key and SSH-key errors

| Error | Cause | Fix |
|---|---|---|
| `Load key "...": error in libcrypto` | **Most often:** a key is also configured under *Repository settings → Pipelines → SSH keys*, so two keys are present. **Or:** the decoded key is corrupt/truncated. | Delete the key under Pipelines → SSH keys ([3.6](#36-clear-the-repository-ssh-key-mandatory)). Then re-generate `SSH_PRIVATE_KEY_B64` with `base64 -w0` and re-paste via the clipboard. |
| `Load key "...": invalid format` | The variable held the raw multi-line key, or base64 that lost its line structure. | Store the **base64** of the key, one line, `base64 -w0`. Never paste the raw PEM. |
| `base64: truncated input` | The pasted value lost characters — usually from mouse-selecting a wrapped terminal line. | `base64 -w0 <keyfile> \| wc -c`, note the number, re-copy via `clip`/`pbcopy`/`xclip`, confirm the pipeline log reports the same count. |
| `FAIL: <N> is not a multiple of 4` | Same truncation, caught early by our own check. | As above. |
| `FAIL: the decoded value is not a private key` | You encoded the `.pub` file. | Encode the file **without** `.pub`: `base64 -w0 ~/.ssh/bb_pipeline_deploy`. |
| `ssh-keygen: not found` | Alpine's `openssh-client` does not include `ssh-keygen`. | The step must `apk add --no-cache openssh-client openssh-keygen`. Already correct in this repo. |
| `FAIL: ssh-keygen could not read the private key` | The key has a passphrase. | Regenerate with `-N ""`. A pipeline cannot type a passphrase. |
| `Permission denied (publickey)` **when connecting to EC2** | Key A's public half is missing/mangled in `authorized_keys`, or the wrong `SSH_USER`. | On EC2: `ssh-keygen -lf ~/.ssh/authorized_keys` and compare with the `deploy key:` fingerprint in the pipeline log. Check `SSH_USER=ubuntu`. Check permissions: `chmod 700 ~/.ssh; chmod 600 ~/.ssh/authorized_keys`. |
| `Permission denied (publickey)` **on the `git fetch` line inside the SSH session** | That's **Key B**, not Key A. Key B isn't registered as an Access Key, or `~/.ssh/config` is missing. | On EC2 run `ssh -vT git@bitbucket.org` and follow [1.4](#14-create-key-b-and-register-it-as-an-access-key). |
| `Permission denied (publickey)` from `ssh -T git@bitbucket.org` **even after creating `~/.ssh/config`** | The config is being read and the key is offered — Bitbucket just doesn't recognise it. The key is **not registered as an Access Key on this repo**, or it was generated on a *different server*. | See the decision table in [7.1a](#71a-deciding-between-config-not-read-and-key-not-registered) directly below. |
| `Permission denied (publickey)` from `sudo ssh -T git@bitbucket.org` | Not a real test. `sudo` runs as root and reads `/root/.ssh/config`, not yours. | Drop the `sudo`. Never use it for these checks — see [7.7](#77-when-the-deployer-and-the-pipeline-owner-are-different-people). |
| `fatal: could not read Password for 'https://<user>@bitbucket.org': No such device or address` | The clone's remote is **HTTPS**, so git wants a password, and there is no TTY in a pipeline session to prompt on. | `git remote set-url origin git@bitbucket.org:goalluvium/vendorpay-frontend.git`. Full procedure and the all-clones audit in [1.5](#15-clone-the-repository-over-ssh). |
| `Host key verification failed` **on the `git fetch` line** (not on the connection to EC2) | That user's `~/.ssh/known_hosts` has no entry for **bitbucket.org**, and non-interactively git cannot ask you to accept it. | As that user: `ssh-keyscan bitbucket.org >> ~/.ssh/known_hosts && sort -u ~/.ssh/known_hosts -o ~/.ssh/known_hosts` |

### 7.1a Deciding between "config not read" and "key not registered"

Both produce an identical `Permission denied (publickey)`. This tells them apart:

```bash
ssh -vT git@bitbucket.org 2>&1 | grep -E 'Reading configuration data|Offering public key|Permissions .* too open'
```

| Output | Meaning | Fix |
|---|---|---|
| Both `Reading configuration data /home/ubuntu/.ssh/config` **and** `Offering public key: ...bitbucket_deploy` appear, yet access is denied | Config works; the key is offered and **rejected**. It is not registered on this repository. | Add `~/.ssh/bitbucket_deploy.pub` under *Repository settings → Security → **Access keys*** for `goalluvium/vendorpay-frontend`. Then compare the fingerprint Bitbucket shows against `ssh-keygen -lf ~/.ssh/bitbucket_deploy.pub` — a mismatch means the paste was mangled. |
| No `Offering public key: ...bitbucket_deploy` line at all | Either `~/.ssh/config` isn't being read, or the **private** half is missing. With `IdentitiesOnly yes` and no private key, SSH has nothing to offer. | `ls -l ~/.ssh/bitbucket_deploy` — you need the private file (~464 bytes), not only the `.pub`. Regenerate the pair if it's absent. |
| `Permissions ... are too open` | SSH refuses to use a key others can read. | `chmod 700 ~/.ssh && chmod 600 ~/.ssh/bitbucket_deploy` |

**Then check which machine the key came from.** `ssh-keygen` stamps `<user>@<hostname>`
into the public key as a comment:

```bash
cat ~/.ssh/bitbucket_deploy.pub    # ... ubuntu@ip-172-31-20-251   <- made on THAT box
hostname                           # ip-172-31-2-254               <- you are on THIS box
```

A mismatch means the Access Key registered in Bitbucket belongs to a different server.
Keys are not portable between machines in this setup — generate a fresh Key B here and
register it ([1.4](#14-create-key-b-and-register-it-as-an-access-key)).

## 7.2 Host-key and connectivity errors

| Error | Cause | Fix |
|---|---|---|
| `Host key verification failed` | `known_hosts` doesn't match — usually scanned by IP but connecting by name (or vice versa), or the instance was rebuilt. | Re-run `ssh-keyscan -H <exact SSH_HOST value> \| base64 -w0` and update `KNOWN_HOSTS_B64`. |
| `FAIL: known_hosts decoded but has no entry for '<host>'` | Our own check for the above. | Same fix. The `ssh-keyscan` argument must equal `SSH_HOST` exactly. |
| `ssh: connect to host ... port 22: Connection timed out` | Security group blocks port 22 from Bitbucket's IPs, or the instance is stopped, or `SSH_HOST` is stale. | Check [1.0](#10-open-port-22-in-the-aws-security-group). Confirm the instance is running. Confirm the public DNS hasn't changed — **attach an Elastic IP**. |
| `ssh: Could not resolve hostname` | Typo in `SSH_HOST`, or `https://` / a trailing slash was included. | `SSH_HOST` is a bare hostname or IP: `str.ec2.alluvium.net`, never `https://str.ec2.alluvium.net/`. |
| `ssh: connect to host ... port 22: Connection refused` | The host is reachable but `sshd` isn't running. | Reboot from the AWS console, or use EC2 Serial Console / Session Manager to start `sshd`. |
| `ssh ubuntu@` (host obviously empty) | `SSH_HOST` is unset — often defined as a *repository* variable while the step is *deployment*-scoped, or misspelled `SSH_HOSTS`. | Move it onto the deployment environment with the exact name `SSH_HOST`. |

## 7.3 Variable and scoping errors

| Error | Cause | Fix |
|---|---|---|
| `MISSING: <NAME> is empty — set it on the '<env>' deployment environment` | Not defined, misspelled, or defined at the wrong scope. | Add it to the named deployment environment. Case-sensitive. Remember: deployment variables reach **only** steps that declare `deployment:`. |
| Variables work on test but not production | You filled in only the Test environment. | Every variable must be set on **both** environments, separately. |
| Value looks right but behaves as empty | Trailing whitespace or invisible characters from copy/paste; or quotes were included. | Re-enter it. Do **not** wrap values in quotes in the Bitbucket UI — quotes become part of the value. |
| The deploy fails on `cd`, or reports a missing file that you can see is present | **A trailing space in `DEPLOY_PATH`.** `cd '/home/ubuntu/frontend_vp '` fails, and the space is invisible in the build log. | Open the variable, click into the field, press `End`: the cursor must land immediately after the last character of the path. No trailing space, no trailing slash, no quotes. |
| `SSH_HOST` / `KNOWN_HOSTS_B64` were correct and suddenly aren't | The app moved to a new EC2 instance, or the instance was rebuilt. Host keys are **per machine**. | Regenerate: `ssh-keyscan -H <new SSH_HOST> \| base64 -w0`. See [7.7](#77-when-the-deployer-and-the-pipeline-owner-are-different-people). |

## 7.4 Pipeline-doesn't-run errors

| Symptom | Cause | Fix |
|---|---|---|
| Push succeeded, no pipeline appeared | Pipelines not enabled; or the file is misnamed/misplaced; or the branch name doesn't match any key in `pipelines.branches`. | Enable Pipelines ([3.1](#31-enable-pipelines)). File must be exactly `bitbucket-pipelines.yml` in the repo root. |
| Pushing to `Main` deploys nothing, silently | Branch keys are **case-sensitive**: `main` ≠ `Main`. | Delete the `Main` branch and repoint the main branch — see [3.8](#38-repo-housekeeping-specific-to-this-repository). |
| `Configuration error ... invalid YAML` | Indentation. YAML uses **spaces only** — a tab anywhere is fatal. | Validate before pushing: repository → **Pipelines** → **Validator**, or paste the file into <https://bitbucket-pipelines.atlassian.io/validator>. |
| Red build merged anyway | Branch restrictions not configured. | Enable *Require passing builds before merge* ([3.7](#37-turn-on-branch-protection-so-the-gates-actually-gate)). |
| Deploy step skipped, log says the environment is in use | Bitbucket serialises deployments per environment. | Wait for the earlier deployment to finish, or stop it. |

## 7.5 Errors on the server, after SSH succeeds

| Error | Cause | Fix |
|---|---|---|
| `docker: permission denied ... /var/run/docker.sock` | `ubuntu` is not in the `docker` group, or was added but the session was never restarted. | `sudo usermod -aG docker ubuntu`, then log out and back in ([1.2](#12-install-docker-and-the-compose-plugin)). |
| `docker: 'compose' is not a docker command` | Compose v2 plugin not installed. | `sudo apt-get install -y docker-compose-plugin`. |
| `fatal: not a git repository` | `DEPLOY_PATH` isn't a clone, or points at the wrong directory. | `cd $DEPLOY_PATH && git status`. Re-clone per [1.5](#15-clone-the-repository-over-ssh). Path must be absolute, no `~`. |
| `error: Your local changes would be overwritten` | Someone edited files on the server. | `git reset --hard` (already in the deploy command) discards them. Stop editing on the server — that's what the pipeline is for. |
| `no space left on device` | Old Docker images filled the disk. | `docker system prune -af --volumes` (⚠️ `--volumes` deletes data volumes — check what you have first with `docker volume ls`). Consider a larger EBS volume. |
| Build succeeds but the site shows old content | Browser cache, or the frontend was built with the wrong API URL. | Hard-reload. Verify `VITE_BACKEND_URL` was exported **before** `docker compose up --build` — Vite bakes it in at build time. |
| App loads but every API call fails | `VITE_BACKEND_URL` is wrong for this environment, or CORS on the backend rejects this origin. | Check the value on the *correct* deployment environment; check the backend's allowed origins. |

## 7.6 A general debugging method

When you are stuck, work outward in this order — each step eliminates a whole class
of cause:

1. **Does it work by hand on the server?** SSH in and run the deploy commands
   yourself ([1.6](#16-do-one-deploy-by-hand)). If not, it's not a pipeline problem.
2. **Can Key A reach the server from your laptop?**
   `ssh -i ~/.ssh/bb_pipeline_deploy -o IdentitiesOnly=yes ubuntu@<host> "echo OK"`.
3. **Can the server reach Bitbucket?** On EC2: `ssh -T git@bitbucket.org`.
4. **Do the four numbers in the deploy log look right?** 620 / 464 / a fingerprint
   / ≥1 known_hosts entry ([5.3](#53-what-a-healthy-deploy-log-looks-like)).
5. **Is the variable in the right scope with the right spelling?** Deployment, not
   repository. `SSH_HOST`, not `SSH_HOSTS`.
6. **Re-run with SSH debug.** Temporarily add `-vvv` to the `ssh` command in the
   deploy step, push, read which key was offered and rejected. Remove it afterwards.

## 7.7 When the deployer and the pipeline owner are different people

The most confusing failures in this setup happen when **the person who set up the server
is not the person configuring the pipeline** — or when the app has moved to a new instance
since the keys were made. Nothing is broken in an obvious way; each piece just belongs to
a user or a machine that is no longer the one in play.

### What is per-user, what is per-machine, and what it looks like when it's wrong

| Thing | Scope | Lives at | Symptom when it belongs to the wrong user/machine |
|---|---|---|---|
| Key B, private half | per **user** | `~/.ssh/bitbucket_deploy` | `Permission denied (publickey)` on the `git fetch` line |
| `~/.ssh/config` | per **user** | `~/.ssh/config` | SSH silently offers the default key instead; same error |
| bitbucket.org in `known_hosts` | per **user** | `~/.ssh/known_hosts` | `Host key verification failed` on `git fetch` |
| Key A, public half | per **user** | `~/.ssh/authorized_keys` | `Permission denied (publickey)` connecting to EC2 |
| The server's own host key | per **machine** | `KNOWN_HOSTS_B64` | `Host key verification failed` before the session even opens |
| `SSH_HOST`, `DEPLOY_PATH` | per **machine** | Bitbucket deployment variables | `Connection timed out`, or a `cd` failure |

Two consequences people trip over constantly:

1. **`sudo` shares none of it.** `sudo ssh -T git@bitbucket.org` runs as root, reads
   `/root/.ssh/config` — which almost certainly doesn't exist — and offers root's keys. It
   fails even when the `ubuntu` setup is flawless, and it tells you nothing. **Never use
   `sudo` for any check in this document.**
2. **Keys don't travel between servers.** A key generated on one box is registered in
   Bitbucket as *that box's* Access Key. Standing up a second instance means generating and
   registering a new Key B, and regenerating `KNOWN_HOSTS_B64`.

### The key comment tells you which machine a key was made on

`ssh-keygen` stamps `<user>@<hostname>` into the public key as a comment. Compare it with
where you actually are:

```bash
cat ~/.ssh/bitbucket_deploy.pub
# ssh-ed25519 AAAA... ubuntu@ip-172-31-20-251     <-- generated on THAT box
hostname
# ip-172-31-2-254                                  <-- you are on THIS box
```

A mismatch is your answer: the Access Key in Bitbucket belongs to the other server.
Generate a fresh Key B here and register it
([1.4](#14-create-key-b-and-register-it-as-an-access-key)).

### One-shot audit

Get `SSH_USER` from *Repository settings → Pipelines → Deployments →* the environment you
are debugging, log in as **that exact user** (no `sudo`), and run this. Remember this repo
has **two** environments, so run it against whichever server is failing:

```bash
echo "user:     $(whoami)"
echo "home:     $HOME"
echo "hostname: $(hostname)"

echo; echo "--- keys and config this user has ---"
ls -l ~/.ssh/ 2>/dev/null || echo "no ~/.ssh at all"

echo; echo "--- ~/.ssh/config ---"
cat ~/.ssh/config 2>/dev/null || echo "MISSING — SSH will offer the default key, not Key B"

echo; echo "--- Key B: fingerprint and originating machine ---"
ssh-keygen -lf ~/.ssh/bitbucket_deploy.pub 2>/dev/null || echo "no bitbucket_deploy.pub for this user"

echo; echo "--- is bitbucket.org pinned for this user? ---"
ssh-keygen -F bitbucket.org >/dev/null 2>&1 \
  && echo "yes" \
  || echo "NO — git fetch will fail non-interactively"

echo; echo "--- can this user authenticate to Bitbucket? ---"
ssh -o BatchMode=yes -T git@bitbucket.org 2>&1 | head -2

echo; echo "--- deploy directory ---"
cd /home/ubuntu/frontend_vp 2>/dev/null \
  && { pwd; git remote get-url origin; git log -1 --oneline; } \
  || echo "cannot cd — check DEPLOY_PATH"

echo; echo "--- every clone on this box, and its remote ---"
for d in /home/ubuntu/*/; do
  [ -d "$d.git" ] && printf '%-45s %s\n' "$d" "$(git -C "$d" remote get-url origin)"
done
```

Read it against this: the user and hostname should be the ones the pipeline targets,
`config` should point at `bitbucket_deploy`, the Key B comment should name **this** host,
bitbucket.org should be pinned, Bitbucket should say `authenticated via ssh key`, and the
remote should start `git@bitbucket.org:`.

### Handover checklist — when ownership or the server changes

| # | Action | Why |
|---|---|---|
| 1 | **Do not copy private keys between people or machines.** Generate a new one. | A key that has been emailed or pasted into chat is no longer a secret. |
| 2 | Generate a new **Key A**, append its public half to `authorized_keys`, update `SSH_PRIVATE_KEY_B64`, confirm a green deploy, **then** remove the old line. | Rotating in that order means a mistake never locks the pipeline out. Full steps in [9.2](#92-rotating-key-a-do-this-when-someone-leaves-or-every-612-months). |
| 3 | Generate a new **Key B** *on the server*, register the public half under *Security → Access keys*, and delete the departing key. | Key B never leaves the box, so it must be created there. |
| 4 | Re-run `ssh-keyscan -H <SSH_HOST> \| base64 -w0` and update `KNOWN_HOSTS_B64` — **on both environments**. | Host keys are per machine. Skipping this is the classic "it worked yesterday" failure. |
| 5 | Confirm `SSH_USER`, `SSH_HOST`, `DEPLOY_PATH` and `VITE_BACKEND_URL` describe the server that is actually live, **for each environment separately**. | These drift silently when infrastructure is rebuilt, and it is easy to fix Test and forget Production. |
| 6 | Run the all-clones loop above and convert any HTTPS remote to SSH. | Directories get converted one at a time and the rest fail later. |
| 7 | Record, somewhere findable: which instance, which user, which directory, who holds which key, per environment. | This document cannot tell you which server is current. Only you can. |

### The only test that counts

Whoever now owns the pipeline should finish by proving it end to end **without a terminal
on the far side**, because a TTY lets git fall back to prompting and can make a broken
setup look healthy:

```bash
ssh -i ~/.ssh/bb_pipeline_deploy -o IdentitiesOnly=yes -o BatchMode=yes \
    <SSH_USER>@<SSH_HOST> \
    "cd <DEPLOY_PATH> && git fetch --all --prune && echo READY"
```

`READY` means Key A, Key B, the remote URL and the path are all correct together. Any
other output names the piece that still needs work. Run it once per environment.

---

# Part 8 — Other ways Atlassian supports (and why we didn't use them)

Atlassian documents several routes. Knowing them helps you recognise advice you
find online that doesn't match this setup.

## 8.1 Repository settings → Pipelines → SSH keys

Bitbucket can generate a key pair for you, keep the private half, inject it into
every build container at `~/.ssh/id_rsa`, and manage `known_hosts` through the UI.

- **Pros:** no base64 juggling; nothing to paste.
- **Cons:** **one key per repository, shared by all environments** — so test and
  production cannot have separate keys. You also cannot export the private key.
- **Why not here:** we need per-environment keys, and a key configured there
  *collides* with ours and produces `error in libcrypto`. If you ever switch to
  this mechanism, you must remove the deployment variables at the same time. Do not
  run both.

## 8.2 The `atlassian/ssh-run` pipe

A "pipe" is a prepackaged step. Atlassian's official SSH pipe:

```yaml
- pipe: atlassian/ssh-run:0.8.1
  variables:
    SSH_USER: $SSH_USER
    SERVER: $SSH_HOST
    SSH_KEY: $SSH_PRIVATE_KEY_B64      # the pipe expects a base64-encoded key
    MODE: 'command'
    COMMAND: 'cd /home/ubuntu/frontend_vp && git pull && docker compose up -d --build'
```

- **Pros:** far less YAML.
- **Cons:** you lose the diagnostics. Our hand-written step is verbose precisely
  because it turns `error in libcrypto` into `FAIL: 619 is not a multiple of 4, so
  the pasted value is incomplete`. That verbosity is the deliverable.
- Note that the pipe **also** wants the key base64-encoded — further confirmation
  that base64 is the standard answer to the multi-line-secret problem.

## 8.3 Deploying via AWS credentials instead of SSH

If you later move to ECR + ECS/CodeDeploy, or want to drive the instance through
SSM instead of SSH, you need AWS credentials rather than an SSH key. The variables
would be:

| Variable | Format | How to derive | Scope |
|---|---|---|---|
| `AWS_ACCESS_KEY_ID` | 20 chars, starts `AKIA` | IAM → Users → *(deploy user)* → Security credentials → Create access key | Deployment |
| `AWS_SECRET_ACCESS_KEY` | 40 chars, base64-ish | Shown **once** at creation — save it immediately | Deployment, **secured** |
| `AWS_DEFAULT_REGION` | e.g. `eu-north-1` | The region your instance is in | Deployment |
| `AWS_ECR_REGISTRY` | `<account-id>.dkr.ecr.<region>.amazonaws.com` | `aws sts get-caller-identity --query Account --output text` | Deployment |

Create a **dedicated IAM user** for CI, with only the permissions it needs
(e.g. `ecr:GetAuthorizationToken`, `ecr:PutImage`, and `ssm:SendCommand` scoped to
that one instance). Never use your personal or root credentials.

Relevant official pipes: `atlassian/aws-ecr-push-image`,
`atlassian/aws-ecs-deploy`, `atlassian/aws-code-deploy`, `atlassian/aws-ssm-run-command`.

**Better still, for production: use OIDC and store no long-lived AWS keys at all.**
Bitbucket can present an OIDC identity token that an IAM role trusts, so the
pipeline assumes a role at run time:

```yaml
- step:
    oidc: true
    script:
      - export AWS_ROLE_ARN=arn:aws:iam::<account-id>:role/<role-name>
      - export AWS_WEB_IDENTITY_TOKEN_FILE=$(pwd)/web-identity-token
      - echo $BITBUCKET_STEP_OIDC_TOKEN > $AWS_WEB_IDENTITY_TOKEN_FILE
      - aws sts get-caller-identity
```

You configure the identity provider in IAM using the Identity provider URL and
Audience shown in *Repository settings → Pipelines → OpenID Connect*. Nothing
secret is ever stored in Bitbucket, so there is nothing to leak or rotate.

## 8.4 Why SSH suits this project

The app is a Docker Compose stack on a single EC2 box. There is no registry, no
orchestrator, and no need for one. SSH + `docker compose up --build` is the
simplest thing that works, and simple is what you want in a deploy path you will
debug at 2am.

---

# Part 9 — Security, rotation, and housekeeping

## 9.1 Rules

1. **Never commit a private key, `.env`, or `.pem` file.** Check `.gitignore`
   covers `.env` and `*.pem`. If one is ever pushed, treat it as compromised:
   rotate it, don't just delete the file — git history keeps it.
2. **Use a separate Key A per environment.** A leaked test key must not open
   production.
3. **Access Keys (Key B) are read-only.** Never give the server a key that can
   push.
4. **Tick "Secured" on every private key and password variable.**
5. **Don't `echo` a secret in a step.** Print fingerprints and byte counts — which
   is all our pipeline ever does — not values.
6. **Keep real secrets in a `.env` file on the server**, not in the pipeline. The
   deploy step should not need to know your database password.
7. **Restrict port 22** to Atlassian's Pipelines ranges once things are stable.

## 9.2 Rotating Key A (do this when someone leaves, or every 6–12 months)

```bash
# 1. new key on your laptop
ssh-keygen -t ed25519 -C "bitbucket-pipelines@vendorpay-frontend-$(date +%Y%m)" \
           -f ~/.ssh/bb_pipeline_deploy_new -N ""

# 2. authorise it on EC2 — APPEND, keeping the old one working for now
cat ~/.ssh/bb_pipeline_deploy_new.pub    # copy this
# on EC2:
echo "<paste>" >> ~/.ssh/authorized_keys

# 3. update SSH_PRIVATE_KEY_B64 in Bitbucket
base64 -w0 ~/.ssh/bb_pipeline_deploy_new | clip

# 4. run the pipeline. Confirm it is green.

# 5. only now remove the old key from EC2's authorized_keys
nano ~/.ssh/authorized_keys       # delete the old line, save
```

Never delete the old key before the new one has produced a green deploy — that
order is what stops you locking the pipeline out.

## 9.3 Rotating Key B

```bash
# on EC2
ssh-keygen -t ed25519 -C "ec2-deploy@vendorpay-$(date +%Y%m)" \
           -f ~/.ssh/bitbucket_deploy_new -N ""
cat ~/.ssh/bitbucket_deploy_new.pub
```

Add that as a **new** Access Key on the repo, point `~/.ssh/config` at
`bitbucket_deploy_new`, run `ssh -T git@bitbucket.org` to confirm, then delete the
old Access Key from Bitbucket and the old key files from the server.

## 9.4 Periodic checks

- **`KNOWN_HOSTS_B64` after any instance rebuild.** A new instance means a new host
  key and every deploy fails until you re-scan.
- **Disk space.** `docker image prune -f` runs every deploy, but volumes and logs
  still grow. Check `df -h` monthly.
- **Build minutes.** *Workspace settings → Plan details*. `clone: enabled: false`
  and the npm cache are there to keep this low.

---

# Appendix A — One-page copy/paste command sheet

## On the EC2 server (one time)

```bash
# Docker
sudo apt-get update && sudo apt-get install -y ca-certificates curl gnupg git
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update && sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo usermod -aG docker ubuntu       # then LOG OUT and back in

# Key B: EC2 -> Bitbucket
ssh-keygen -t ed25519 -C "ec2-deploy@vendorpay" -f ~/.ssh/bitbucket_deploy -N ""
cat > ~/.ssh/config << 'EOF'
Host bitbucket.org
  IdentityFile ~/.ssh/bitbucket_deploy
  IdentitiesOnly yes
EOF
chmod 600 ~/.ssh/config
cat ~/.ssh/bitbucket_deploy.pub      # -> Repository settings -> Access keys
ssh -T git@bitbucket.org             # expect "authenticated via ssh key"

# Clone (SSH URL!)
cd /home/ubuntu
git clone git@bitbucket.org:goalluvium/vendorpay-frontend.git frontend_vp
cd frontend_vp && git remote -v

# Manual deploy test
git fetch --all --prune && git reset --hard origin/main
export VITE_BACKEND_URL="https://str.ec2.alluvium.net/vendorpay"
docker compose up -d --build && docker compose ps
```

## On your laptop (one time, per environment)

```bash
# Key A: Pipeline -> EC2
ssh-keygen -t ed25519 -C "bitbucket-pipelines@vendorpay-frontend" -f ~/.ssh/bb_pipeline_deploy -N ""
cat ~/.ssh/bb_pipeline_deploy.pub                    # append to EC2 ~/.ssh/authorized_keys
ssh -i ~/.ssh/bb_pipeline_deploy -o IdentitiesOnly=yes ubuntu@<SSH_HOST> "echo OK"

# SSH_PRIVATE_KEY_B64
base64 -w0 ~/.ssh/bb_pipeline_deploy | wc -c         # expect 620, must be a multiple of 4
base64 -w0 ~/.ssh/bb_pipeline_deploy | clip          # macOS: | pbcopy   Linux: | xclip -sel clip

# KNOWN_HOSTS_B64  (argument must EQUAL SSH_HOST exactly)
ssh-keyscan -H <SSH_HOST> | base64 -w0 | clip
```

## In Bitbucket

```
Repository settings
├── Pipelines → Settings         → Enable Pipelines = ON
├── Pipelines → SSH keys         → MUST BE EMPTY
├── Pipelines → Deployments
│   ├── Test        → SSH_PRIVATE_KEY_B64 (secured), KNOWN_HOSTS_B64,
│   │                 SSH_HOST, SSH_USER, DEPLOY_PATH, VITE_BACKEND_URL
│   └── Production  → the same six, with production values
├── Security → Access keys       → Key B's public key (read-only)
├── Branch restrictions          → main & prod: require passing builds, no direct push
└── Repository details           → Main branch = main   (delete the `Main` branch)
```

---

# Appendix B — Official Atlassian documentation

| Topic | URL |
|---|---|
| Variables and secrets (repository / deployment / workspace, secured values, base64 for multi-line) | <https://support.atlassian.com/bitbucket-cloud/docs/variables-and-secrets/> |
| Use SSH keys in Bitbucket Pipelines | <https://support.atlassian.com/bitbucket-cloud/docs/use-ssh-keys-in-bitbucket-pipelines/> |
| Access keys (read-only repo keys, Key B) | <https://support.atlassian.com/bitbucket-cloud/docs/access-keys/> |
| Use deployments (environments, promotion) | <https://support.atlassian.com/bitbucket-cloud/docs/use-bitbucket-pipelines-with-deployments/> |
| `bitbucket-pipelines.yml` full reference | <https://support.atlassian.com/bitbucket-cloud/docs/configure-bitbucket-pipelinesyml/> |
| Pipeline start conditions (branches, pull-requests, custom) | <https://support.atlassian.com/bitbucket-cloud/docs/pipeline-triggers/> |
| Caches | <https://support.atlassian.com/bitbucket-cloud/docs/cache-dependencies/> |
| Integrate with AWS | <https://support.atlassian.com/bitbucket-cloud/docs/deploy-on-aws-using-bitbucket-pipelines-and-cloudformation/> |
| OpenID Connect (keyless AWS auth) | <https://support.atlassian.com/bitbucket-cloud/docs/integrate-pipelines-with-resource-servers-using-oidc/> |
| YAML validator | <https://bitbucket-pipelines.atlassian.io/validator> |
| Pipelines IP ranges (for security groups) | <https://ip-ranges.atlassian.com/> |
| `atlassian/ssh-run` pipe | <https://bitbucket.org/atlassian/ssh-run> |

---

## Quick reference card

| | |
|---|---|
| **Repo** | `goalluvium/vendorpay-frontend` |
| **Pipeline file** | `bitbucket-pipelines.yml` (repo root) |
| **Deploy branches** | `main` → test, `prod` → production |
| **Deployment variables (6)** | `SSH_PRIVATE_KEY_B64` (secured), `KNOWN_HOSTS_B64`, `SSH_HOST`, `SSH_USER`, `DEPLOY_PATH`, `VITE_BACKEND_URL` |
| **Repository variables** | none |
| **Key A** | Pipeline → EC2. Private (base64) in Bitbucket; public in EC2 `~/.ssh/authorized_keys` |
| **Key B** | EC2 → Bitbucket. Private stays on EC2; public added as repo **Access key** |
| **Must be empty** | Repository settings → Pipelines → SSH keys |
| **Server deploy dir** | `/home/ubuntu/frontend_vp` (test) |
| **Remote must be** | `git@bitbucket.org:goalluvium/vendorpay-frontend.git` (SSH, not HTTPS) |
