import { cp, mkdir } from 'node:fs/promises';

const webDir = new URL('./www/', import.meta.url);
await mkdir(webDir, { recursive: true });

for (const file of ['index.html', 'style.css', 'script.js', 'sw.js', 'native-notifications.js']) {
  await cp(new URL(`./${file}`, import.meta.url), new URL(`./www/${file}`, import.meta.url));
}

await cp(new URL('./img/', import.meta.url), new URL('./www/img/', import.meta.url), { recursive: true });
await cp(new URL('./node_modules/@capacitor/core/dist/capacitor.js', import.meta.url), new URL('./www/capacitor.js', import.meta.url));
await cp(new URL('./node_modules/@capacitor/local-notifications/dist/plugin.js', import.meta.url), new URL('./www/local-notifications-plugin.js', import.meta.url));
console.log('Archivos web copiados a www/.');
