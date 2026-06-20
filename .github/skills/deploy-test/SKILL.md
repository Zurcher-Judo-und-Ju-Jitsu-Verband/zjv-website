---
name: deploy-test
description: "Deploy the ZJV website to the test environment at http://zurcherj.myhostpoint.ch/. Use when syncing local changes to the dev/test server."
argument-hint: "optional extra rsync flags"
---

# Deploy to Test Environment

Syncs the local workspace to the ZJV development/testing server.

## Target

- **URL:** http://zurcherj.myhostpoint.ch/
- **Host:** `sl42.web.hostpoint.ch`
- **User:** `zurcherj`
- **Remote path:** `~/www/zurcherj.myhostpoint.ch/`

## Procedure

1. Ensure you are in the project root (`/home/cfuchs/projects/zjv-website`).
2. Run the deploy command:

```bash
rsync -av --exclude-from=.rsyncignore . zurcherj@sl42.web.hostpoint.ch:~/www/zurcherj.myhostpoint.ch/
```

3. Verify the output for any errors or unexpected transfers.
4. Check the result at http://zurcherj.myhostpoint.ch/

## Notes

- `.htaccess`, `README.md`, and `TODO.md` **are** deployed.
- `.git/`, `.gitignore`, and `.rsyncignore` are excluded (see [.rsyncignore](../../../.rsyncignore)).
- No TLS on the test environment — do not transmit sensitive data through it.
- This is **not** the live production deployment.
