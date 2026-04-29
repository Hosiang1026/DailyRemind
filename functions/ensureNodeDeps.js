const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')
const { builtinModules } = require('module')

const REQUIRE_RE = /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g
const builtinSet = new Set(
  builtinModules.flatMap((m) => [m, m.startsWith('node:') ? m : `node:${m}`])
)

function npmRootName(spec) {
  const t = String(spec).trim()
  if (!t || t.startsWith('.') || path.isAbsolute(t)) return null
  if (t.startsWith('@')) {
    const i = t.indexOf('/')
    if (i === -1) return t
    const j = t.indexOf('/', i + 1)
    return j === -1 ? t : t.slice(0, j)
  }
  const i = t.indexOf('/')
  return i === -1 ? t : t.slice(0, i)
}

function extractNpmPackagesFromSource(code) {
  const set = new Set()
  let m
  REQUIRE_RE.lastIndex = 0
  while ((m = REQUIRE_RE.exec(code)) !== null) {
    const root = npmRootName(m[1])
    if (!root) continue
    const base = root.startsWith('node:') ? root.slice(5) : root
    if (builtinSet.has(root) || builtinSet.has(`node:${base}`) || builtinSet.has(base)) continue
    set.add(root)
  }
  return [...set].sort()
}

function extractNpmPackagesFromTaskFile(code) {
  const cut = code.search(/\nfunction Env\s*\(/)
  const slice = cut === -1 ? code : code.slice(0, cut)
  return extractNpmPackagesFromSource(slice)
}

function listJsFilesRecursive(dir, out = []) {
  if (!fs.existsSync(dir)) return out
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name)
    const st = fs.statSync(full)
    if (st.isDirectory()) listJsFilesRecursive(full, out)
    else if (name.endsWith('.js')) out.push(full)
  }
  return out
}

function resolveOk(root, name) {
  try {
    require.resolve(name, { paths: [root] })
    return true
  } catch {
    return false
  }
}

function ensureNodeDeps() {
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

function ensureQinglongDepsVerbose(log) {
  const root = path.join(__dirname, '..')
  const pkgPath = path.join(root, 'package.json')
  const qinglongRoot = path.join(root, 'scripts', 'qinglong')
  const missing = new Set()
  const lines = typeof log === 'function' ? log : (...a) => console.log(...a)

  lines('—— package.json 声明依赖 ——')
  if (!fs.existsSync(pkgPath)) {
    lines('无 package.json')
    return { installed: false, missing: [] }
  }
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'))
  const declared = { ...pkg.dependencies, ...pkg.devDependencies }
  for (const name of Object.keys(declared).sort()) {
    const ok = resolveOk(root, name)
    lines(`  [package.json] ${name} ${ok ? '已安装' : '缺失'}`)
    if (!ok) missing.add(name)
  }

  lines('—— 青龙目录脚本 npm 包 ——')
  const scriptFiles = listJsFilesRecursive(qinglongRoot)
  for (const file of scriptFiles.sort()) {
    const rel = path.relative(root, file)
    const code = fs.readFileSync(file, 'utf8')
    const baseName = path.basename(file)
    const pkgs = /_task\.js$/i.test(baseName)
      ? extractNpmPackagesFromTaskFile(code)
      : extractNpmPackagesFromSource(code)
    if (pkgs.length === 0) {
      lines(`  ${rel} (无 npm 包)`)
      continue
    }
    lines(`  ${rel}`)
    for (const name of pkgs) {
      const ok = resolveOk(root, name)
      lines(`    ${name} ${ok ? '已安装' : '缺失'}`)
      if (!ok) missing.add(name)
    }
  }

  const missArr = [...missing].sort()
  let installed = false
  if (missArr.length > 0) {
    lines('—— 执行安装 ——', `npm install ${missArr.join(' ')}`)
    execSync(`npm install ${missArr.join(' ')}`, {
      cwd: root,
      stdio: 'inherit',
      env: process.env,
      shell: true,
    })
    installed = true
  } else {
    lines('—— 无缺失依赖 ——')
  }

  return { installed, missing: missArr }
}

module.exports = ensureNodeDeps
module.exports.extractNpmPackagesFromSource = extractNpmPackagesFromSource
module.exports.ensureQinglongDepsVerbose = ensureQinglongDepsVerbose
