import fs from 'node:fs';
import path from 'node:path';

for (const file of ['styles.css', 'script.js']) {
  const target = path.resolve(file);
  if (fs.existsSync(target)) {
    fs.rmSync(target, { force: true });
    console.log(`Removed obsolete root-level ${file}`);
  }
}
