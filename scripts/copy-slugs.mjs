import { copyFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const distDir = resolve('dist');

mkdirSync(resolve(distDir, 'splash'), { recursive: true });
copyFileSync(resolve(distDir, 'splash.html'), resolve(distDir, 'splash', 'index.html'));
