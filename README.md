# 2026-Fall-Amazon

Amazon Tech SIBC Project

## Initial Setup

You only need to do this once on each computer.

1. Log in to GitHub.

2. Go to the folder where you want the repository to be stored.

3. Open a terminal in that folder.

   **Windows:** Click the folder path/address bar, type `cmd`, and press Enter.

   **macOS:** Open Terminal and navigate to the folder using `cd`.

4. Clone the repository:

```bash
git clone https://github.com/2026-Fall-Amazon/Code.git
```

5. Enter the repository:

```bash
cd Code
```

You now have a local copy of the shared GitHub repository.

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

## 1. Update `main`

Before beginning new work, make sure your local `main` branch has the newest changes from GitHub:

```bash
git switch main
git pull --rebase origin main
```

> Do not run `git pull` before you have cloned the repository for the first time. `git clone` already downloads the repository.

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

## 3. Check Your Changes

Use:

```bash
git status
```

This shows which files have been changed, added, or deleted.

## 4. Add Your Files

To add all changed files:

```bash
git add .
```

To add only one specific file:

```bash
git add filename.py
```

You can run this again afterward to verify what will be committed:

```bash
git status
```

## 5. Commit Your Changes

Commit your work with a descriptive message:

```bash
git commit -m "Descriptive message explaining what you changed"
```

Example:

```bash
git commit -m "Add product review preprocessing script"
```

Use commit messages that explain what you actually changed.

For example:

```text
Add sentiment analysis function
Fix missing values in review dataset
Update API
