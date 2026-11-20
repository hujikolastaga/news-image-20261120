import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const MAX_BYTES = 1_048_576;
const MAX_DIMENSION = 1024;
const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

function assertValidImage(data: Buffer): { format: 'png' | 'jpeg'; width: number; height: number } {
  if (data.byteLength === 0 || data.byteLength > MAX_BYTES) {
    throw new Error(`Image size ${data.byteLength} bytes exceeds [1, ${MAX_BYTES}]`);
  }
  if (data.byteLength < 24 || !data.subarray(0, 8).equals(PNG_SIGNATURE)) {
    throw new Error('entry.png does not begin with a valid PNG signature');
  }
  const ihdrType = data.subarray(12, 16).toString('ascii');
  if (ihdrType !== 'IHDR') {
    throw new Error(`Expected IHDR chunk, found ${ihdrType}`);
  }
  const width = data.readUInt32BE(16);
  const height = data.readUInt32BE(20);
  if (width < 1 || height < 1 || width > MAX_DIMENSION || height > MAX_DIMENSION) {
    throw new Error(`Image dimensions ${width}x${height} exceed ${MAX_DIMENSION}x${MAX_DIMENSION}`);
  }
  const iend = Buffer.from('IEND', 'ascii');
  if (!data.subarray(data.byteLength - 8, data.byteLength - 4).equals(iend)) {
    throw new Error('entry.png is truncated (missing trailing IEND chunk)');
  }
  return { format: 'png', width, height };
}

function main(): void {
  const botDir = process.env.MAKEFUN_BOT_DIR || dirname(fileURLToPath(import.meta.url));
  const outDir = process.env.MAKEFUN_OUTPUT_DIR || '/output';
  const sourcePath = resolve(botDir, 'entry.png');
  const targetPath = join(outDir, 'entry.png');

  const imageBytes = readFileSync(sourcePath);
  assertValidImage(imageBytes);

  mkdirSync(outDir, { recursive: true });
  writeFileSync(targetPath, imageBytes);
}

main();
