/* Runs migration then seed */
const { spawn } = require('child_process');

function run(scriptPath) {
  return new Promise((resolve, reject) => {
    // No `shell: true`: arguments would be concatenated unescaped (DEP0190),
    // and spawning node directly needs no shell.
    const child = spawn(process.execPath, [scriptPath], { stdio: 'inherit' });
    child.on('error', reject);
    child.on('close', (code) =>
      code === 0 ? resolve() : reject(new Error(`${scriptPath} exited with code ${code}`))
    );
  });
}

const here = require('path').resolve(__dirname);

(async () => {
  await run(`${here}/migrate.js`);
  await run(`${here}/seed.js`);
  console.log('Database setup complete.');
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
