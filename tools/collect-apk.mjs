// S8: copy the Gradle debug output up to the repo root under its release-gate
// name (docs/RELEASE.md). Runs as the last step of `npm run android:apk`.
import { copyFileSync, existsSync } from 'node:fs';

const SRC = 'android/app/build/outputs/apk/debug/app-debug.apk';
const DEST = 'meteor-falls-debug.apk';

if (!existsSync(SRC)) {
  console.error(`[collect-apk] missing ${SRC} — did assembleDebug succeed?`);
  process.exit(1);
}
copyFileSync(SRC, DEST);
console.log(`[collect-apk] ${DEST} ready (from ${SRC})`);
