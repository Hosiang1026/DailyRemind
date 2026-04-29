'use strict'
const path = require('path')
const fs = require('fs')

function findRepoRoot() {
  let d = __dirname
  for (let i = 0; i < 16; i++) {
    const ensure = path.join(d, 'functions', 'ensureNodeDeps.js')
    const pkg = path.join(d, 'package.json')
    if (fs.existsSync(ensure) && fs.existsSync(pkg)) return d
    const parent = path.dirname(d)
    if (parent === d) break
    d = parent
  }
  throw new Error(
    '未找到仓库根：需同时存在 package.json 与 functions/ensureNodeDeps.js，请拉取完整仓库'
  )
}

let cached
function repoRoot() {
  if (!cached) cached = findRepoRoot()
  return cached
}

function req(...segments) {
  return require(path.join(repoRoot(), ...segments))
}

module.exports = { repoRoot, req }
