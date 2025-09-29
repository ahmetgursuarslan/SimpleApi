/* Runs migration then seed */
const { spawn } = require('child_process');

function run(cmd, args) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { stdio: 'inherit', shell: true });
    p.on('close', (code) =>
      code === 0 ? resolve() : reject(new Error(`${cmd} ${args.join(' ')} exited ${code}`))
    );
  });
}

(async () => {
  await run('node', ['scripts/migrate.js']);
  await run('node', ['scripts/seed.js']);
  console.log('Database setup complete.');
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
