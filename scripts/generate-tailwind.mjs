import tailwindcss from '@tailwindcss/postcss';
import fs from 'node:fs/promises';
import path from 'node:path';
import postcss from 'postcss';

const inputPath = path.resolve('src/tailwind.css');
const outputPath = path.resolve('src/tailwind.generated.css');
const css = await fs.readFile(inputPath, 'utf8');
const result = await postcss([tailwindcss()]).process(css, { from: inputPath, to: outputPath });

await fs.writeFile(outputPath, result.css);
console.log(`Generated ${path.relative(process.cwd(), outputPath)}`);
