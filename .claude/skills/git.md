# Git Commit and Push

Commit all changes and push to the GitHub repository.

## Behavior

This skill will:
1. Show the current git status
2. Stage all changes (git add .)
3. Create a commit with a descriptive message
4. Push to the remote repository (origin)

## Instructions

When the user runs `/git`, you should:

1. First, run `git status` to show what will be committed
2. Ask the user for a commit message (or generate one based on the changes if they don't provide one)
3. Run `git add .` to stage all changes
4. Run `git commit -m "<message>"` with the commit message
5. Run `git push` to push to the remote repository
6. Confirm the push was successful

If there are no changes to commit, inform the user.

If the push fails (e.g., due to conflicts or authentication issues), show the error and provide guidance on how to resolve it.

## Example Usage

```
User: /git
Assistant: I'll commit and push your changes. Let me check what's changed...

[Shows git status output]

I can see you have modified files. What commit message would you like to use?

User: Fix point name editing bug in CMS