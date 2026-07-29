# Deploying VendorPay Frontend with Bitbucket Pipelines — Complete Guide

**Repository:** `goalluvium/vendorpay-frontend`
**Target:** an Ubuntu EC2 instance on AWS, running the app with Docker Compose
**Audience:** anyone. No prior experience with CI/CD, SSH, Docker, or AWS is assumed.

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

**If you already have a clone that uses HTTPS** — that is, `git remote -v` shows
`https://<user>@bitbucket.org/...` — you do not need to re-clone. Just switch the
URL:

```bash
cd /home/ubuntu/frontend_vp
git remote set-url origin git@bitbucket.org:goalluvium/vendorpay-frontend.git
git remote -v          # confirm it changed
git fetch --all --prune
```

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
| Open a PR into any branch | promotion guard + test gate | reports pass/fail on the PR |
| Push or merge to `main` | test gate → deploy | ships to **test** environment |
| Open a PR `main` → `prod` | promotion guard + test gate | guard proves the commit already went through test |
| Merge `main` → `prod` | test gate → deploy | ships to **production** |

Steps run in order and a failed step aborts the pipeline. That single property is
what guarantees a deploy step can never run unless the gate ahead of it passed
**on that exact commit**.

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
