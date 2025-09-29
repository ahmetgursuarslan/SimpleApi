const path = require('path');
const fs = require('fs');

const pkgPath = path.resolve(__dirname, '..', '..', 'package.json');
let pkg = { name: 'unknown', version: '0.0.0', description: '' };
try {
  const raw = fs.readFileSync(pkgPath, 'utf8');
  pkg = JSON.parse(raw);
} catch (e) {
  // ignore
}

exports.info = (req, res) => {
  res.json({
    name: pkg.name,
    version: pkg.version,
    description: pkg.description,
    node: process.versions.node,
    env: process.env.NODE_ENV || 'development',
  });
};
