---
Task ID: 1
Agent: main
Task: Clone xpayments.digital repo and fix API Keys tab (Eye/EyeOff import error)

Work Log:
- Cloned https://github.com/nexflowx-hub/xpayments.digital.git to /home/z/xpayments-clone
- Analyzed uploaded image (XPayments Digital logo)
- Copied all project files from clone to /home/z/my-project
- Installed dependencies with bun install
- Ran `prisma db push` to sync database
- Fixed `/home/z/my-project/src/components/merchant/api-keys.tsx`:
  1. Added `Eye` and `EyeOff` to the lucide-react import (line 7)
  2. Replaced unsafe key display logic with defensive fallback: `k.fullKey ?? k.keyPreview ?? \`\${k.prefix}••••\${k.lastFour}\``
  3. For keys without fullKey: Eye icon shows as disabled (muted, non-clickable) with tooltip "The full key is only available at creation time."
  4. For keys with fullKey (newly created): Eye/EyeOff toggle works normally
  5. Copy button safely uses keyPreview fallback for old keys
  6. Reveal API call now checks `revealed.fullKey` before storing, shows error toast if not available
- Copied missing files (auth-screen, landing-page, updated utils.ts) to fix build errors
- Ran `npx next build` — **PASSED** with 0 errors
- Ran `bun run lint` — api-keys.tsx has 0 lint errors (4 pre-existing errors in other files)
- Started dev server — page renders with HTTP 200, no runtime errors in dev.log

Stage Summary:
- `ReferenceError: Eye is not defined` is FIXED
- `Eye` and `EyeOff` properly imported from lucide-react
- Defensive key value handling: fullKey → keyPreview → prefix+lastFour fallback
- Old keys without fullKey show muted Eye icon with tooltip (not clickable)
- fullKey still shows in modal after creation (revealedKey state)
- Build passes cleanly