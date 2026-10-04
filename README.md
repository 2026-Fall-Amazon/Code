# 2026-Fall-Amazon

Amazon Tech SIBC Project

---

# Initial Setup

You only need to do this once on each computer.

## 1. Log in to GitHub

Go to GitHub and log in to your account.

---

## 2. Set Up SSH Authentication

SSH lets your computer securely connect to GitHub from the command line.

You only need to set this up once per computer.

### Generate an SSH Key

Open Command Prompt, PowerShell, Git Bash, or Terminal.

Run:

```bash
ssh-keygen -t ed25519 -C "your_email@example.com"
```

Replace:

```text
your_email@example.com
```

with the email associated with your GitHub account.

You will see something similar to:

```text
Enter file in which to save the key:
```

Press **Enter** to accept the default location.

You may then be asked to create a passphrase.

You can create one for additional security.

---

### IMPORTANT: Public Key vs. Private Key

SSH creates two files:

```text
id_ed25519
id_ed25519.pub
```

The difference is extremely important:

```text
id_ed25519      = PRIVATE KEY
id_ed25519.pub  = PUBLIC KEY
```

**Never upload, send, or share your private key.**

Your private key is:

```text
id_ed25519
```

The only key you should upload to GitHub is:

```text
id_ed25519.pub
```

---

### Display Your Public Key

#### Windows Command Prompt

Run:

```cmd
type %USERPROFILE%\.ssh\id_ed25519.pub
```

#### macOS, Linux, or Git Bash

Run:

```bash
cat ~/.ssh/id_ed25519.pub
```

You should see something similar to:

```text
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAI... your_email@example.com
```

Copy the **entire line**.

---

### Add the Public Key to GitHub

On GitHub:

1. Click your profile picture.

2. Click **Settings**.

3. Click **SSH and GPG keys**.

4. Click **New SSH key**.

5. Give the key a descriptive name.

Example:

```text
York's Laptop
```

6. Select **Authentication Key**.

7. Paste your **public key**.

8. Click **Add SSH key**.

Again, only paste the key from:

```text
id_ed25519.pub
```

Do **not** upload:

```text
id_ed25519
```

---

### Test Your SSH Connection

Run:

```bash
ssh -T git@github.com
```

The first time you connect, you may see a message asking whether you trust the GitHub host.

If prompted, type:

```text
yes
```

If your SSH setup worked, you should see a message similar to:

```text
Hi YOUR_USERNAME! You've successfully authenticated, but GitHub does not provide shell access.
```

Your computer is now authenticated with GitHub.

---

# Cloning the Repository

## 1. Choose Where the Repository Will Be Stored

Go to the folder where you want the project repository to be stored.

## 2. Open a Terminal in That Folder

### Windows

Click the folder path/address bar, type:

```text
cmd
```

and press Enter.

You can also use PowerShell or Git Bash.

### macOS

Open Terminal and navigate to the folder using:

```bash
cd
```

---

## 3. Clone the Repository

Because we are using SSH, run:

```bash
git clone git@github.com:2026-Fall-Amazon/Code.git
```

Then enter the repository:

```bash
cd Code
```

You now have a local copy of the shared GitHub repository.

---

# If You Already Cloned the Repository Using HTTPS

If you previously cloned the repository using:

```bash
git clone https://github.com/2026-Fall-Amazon/Code.git
```

you do **not** need to clone it again.

Navigate into the existing repository and run:

```bash
git remote set-url origin git@github.com:2026-Fall-Amazon/Code.git
```

Then verify the remote:

```bash
git remote -v
```

You should see something similar to:

```text
origin  git@github.com:2026-Fall-Amazon/Code.git (fetch)
origin  git@github.com:2026-Fall-Amazon/Code.git (push)
```

---

# Pushing YOUR Work INTO GitHub

**Your computer → shared GitHub repository**

## IMPORTANT: Do Not Work Directly on `main`

Each person should work on their own branch.

Our branch naming format is:

```text
week_last_first
```

The week number begins at `00`.

For example:

```text
00_Zhou_York
```

means **Week 1** of the project.

The numbering works like this:

```text
00 = Week 1
01 = Week 2
02 = Week 3
03 = Week 4
```

Do **not** make project changes directly on the `main` branch.

Using separate branches makes it easier to track version history, review changes, and fix problems if something goes wrong.

---

# Starting Work for the Week

## 1. Update `main`

Before beginning new work, make sure your local `main` branch has the newest changes from GitHub:

```bash
git switch main
git pull --rebase origin main
```

Do not use `git pull` as part of the initial repository setup before cloning.

`git clone` already downloads the repository.

---

## 2. Create Your Branch

Create a new branch for the current week:

```bash
git switch -c 00_Last_First
```

Example:

```bash
git switch -c 00_Zhou_York
```

If you already created the branch and simply want to return to it:

```bash
git switch 00_Zhou_York
```

---

# Saving and Pushing Your Work

## 1. Check Your Changes

Run:

```bash
git status
```

This shows which files have been changed, added, or deleted.

---

## 2. Add Your Files

To add all changed files:

```bash
git add .
```

To add only one specific file:

```bash
git add filename.py
```

You can run:

```bash
git status
```

again afterward to verify what will be committed.

---

## 3. Commit Your Changes

Commit your work with a descriptive message:

```bash
git commit -m "Descriptive message explaining what you changed"
```

Example:

```bash
git commit -m "Add product review preprocessing script"
```

Use commit messages that explain what you actually changed.

Good examples:

```text
Add sentiment analysis function
Fix missing values in review dataset
Update API request logic
Add documentation for preprocessing
```

Avoid vague commit messages such as:

```text
update
changes
stuff
fixed things
```

---

## 4. Push Your Branch to GitHub

The **first time** you push a new branch, run:

```bash
git push -u origin 00_Last_First
```

Example:

```bash
git push -u origin 00_Zhou_York
```

The `-u` connects your local branch to the corresponding branch on GitHub.

After the first push, you can normally use:

```bash
git push
```

---

# Pulling Changes FROM GitHub

**Shared GitHub repository → your computer**

Other people may merge new work into `main` while you are working.

To update your computer with those changes:

## 1. Switch to `main`

```bash
git switch main
```

## 2. Pull the Newest Version

```bash
git pull --rebase origin main
```

## 3. Return to Your Branch

```bash
git switch 00_Last_First
```

Example:

```bash
git switch 00_Zhou_York
```

## 4. Bring the Updated `main` Into Your Branch

```bash
git rebase main
```

This updates your branch so that your work is based on the newest version of `main`.

---

# Merge or Rebase Conflicts

Sometimes Git may report a conflict.

This means Git found changes that it cannot automatically combine.

Do **not** randomly delete files, overwrite someone else's work, or force-push to try to solve the problem.

Open the conflicting file and determine which changes should remain.

After fixing the conflict, run:

```bash
git add .
```

Then continue the rebase:

```bash
git rebase --continue
```

If you are unsure how to resolve the conflict, ask another team member before continuing.

---

# Submitting Your Work

After your work has been committed and pushed:

1. Go to the repository on GitHub.

2. Find your branch.

3. Create a **Pull Request** from your branch into `main`.

4. Give the Pull Request a clear title and description.

5. Review the changes.

6. Merge the Pull Request into `main` once it is ready.

Do **not** directly push project work into `main`.

---

# Typical Workflow

## Beginning a Work Session

```bash
git switch main
git pull --rebase origin main
git switch 00_Last_First
git rebase main
```

Replace:

```text
00_Last_First
```

with your actual branch name.

Example:

```bash
git switch main
git pull --rebase origin main
git switch 00_Zhou_York
git rebase main
```

---

## While Working

After making changes:

```bash
git status
git add .
git commit -m "Describe what you changed"
git push
```

You can repeat this whenever you reach a useful stopping point.

---

# Starting a New Weekly Branch

First update `main`:

```bash
git switch main
git pull --rebase origin main
```

Then create the new week's branch:

```bash
git switch -c 01_Last_First
```

Example:

```bash
git switch -c 01_Zhou_York
```

After making your changes:

```bash
git status
git add .
git commit -m "Describe what you changed"
git push -u origin 01_Zhou_York
```

Then create a Pull Request on GitHub to merge your branch into `main`.

---

# Quick Reference

## Test Your GitHub SSH Connection

```bash
ssh -T git@github.com
```

## Clone the Repository

```bash
git clone git@github.com:2026-Fall-Amazon/Code.git
```

## Create a Branch

```bash
git switch -c 00_Last_First
```

## Switch to an Existing Branch

```bash
git switch 00_Last_First
```

## Check Changed Files

```bash
git status
```

## Add All Changed Files

```bash
git add .
```

## Commit Changes

```bash
git commit -m "Describe your changes"
```

## First Push of a New Branch

```bash
git push -u origin 00_Last_First
```

## Later Pushes

```bash
git push
```

## Update `main`

```bash
git switch main
git pull --rebase origin main
```

## Update Your Branch With the Newest `main`

```bash
git switch 00_Last_First
git rebase
