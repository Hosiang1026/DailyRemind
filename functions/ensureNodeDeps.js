const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

module.exports = function ensureNodeDeps() {
  const root = path.join(__dirname, '..')
  const pkgPath = path.join(root, 'package.json')
  if (!fs.existsSync(pkgPath)) return false
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'))
  const deps = { ...pkg.dependencies, ...pkg.devDependencies }
  for (const name of Object.keys(deps)) {
    try {
      require.resolve(name, { paths: [root] })
    } catch {
      execSync('npm install', { cwd: root, stdio: 'inherit', env: process.env, shell: true })
      return true
    }
  }
  return false
}
