/**
 * One-off: map legacy white hairlines to theme tokens for light/dark parity.
 * Run: node scripts/apply-theme-tokens.mjs
 */
import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '..')

const skipDirs = new Set(['node_modules', '.next', '.git', 'dist', 'coverage'])

function walk(dir, out = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (skipDirs.has(ent.name)) continue
    const p = path.join(dir, ent.name)
    if (ent.isDirectory()) walk(p, out)
    else if (/\.(tsx|ts|jsx|js|css)$/.test(ent.name)) out.push(p)
  }
  return out
}

function mapBorderOpacity(op) {
  const n = Number(op)
  if (Number.isNaN(n)) return 'border-stroke'
  return n <= 0.1 ? 'border-stroke' : 'border-stroke-strong'
}

function mapBgOpacity(op) {
  const n = Number(op)
  if (Number.isNaN(n)) return 'bg-fill-glass'
  return n <= 0.05 ? 'bg-fill-glass' : 'bg-fill-glass-strong'
}

function transform(content) {
  let s = content

  s = s.replace(/ring-white\/\[([\d.]+)\]/g, 'ring-stroke')
  s = s.replace(/divide-white\/\[([\d.]+)\]/g, 'divide-stroke')

  s = s.replace(/border-white\/\[([\d.]+)\]/g, (_, op) => mapBorderOpacity(op))

  s = s.replace(/hover:border-white\/\[([\d.]+)\]/g, (_, op) => {
    const cls = mapBorderOpacity(op).replace('border-', 'hover:border-')
    return cls
  })

  s = s.replace(/bg-white\/\[([\d.]+)\]/g, (_, op) => mapBgOpacity(op))

  s = s.replace(/hover:bg-white\/\[([\d.]+)\]/g, (_, op) => {
    const base = mapBgOpacity(op)
    return base.replace('bg-', 'hover:bg-')
  })

  s = s.replace(/active:bg-white\/\[([\d.]+)\]/g, (_, op) => {
    const base = mapBgOpacity(op)
    return base.replace('bg-', 'active:bg-')
  })

  s = s.replace(/group-hover\/card:bg-white\/\[([\d.]+)\]/g, (_, op) => {
    const base = mapBgOpacity(op)
    return base.replace('bg-', 'group-hover/card:bg-')
  })

  s = s.replace(/group-hover:bg-white\/\[([\d.]+)\]/g, (_, op) => {
    const base = mapBgOpacity(op)
    return base.replace('bg-', 'group-hover:bg-')
  })

  s = s.replace(/from-white\/\[([\d.]+)\]/g, (_, op) => {
    const n = Number(op)
    if (n <= 0.05) return 'from-hero-mist'
    return mapBgOpacity(op).replace('bg-', 'from-')
  })

  s = s.replace(/via-white\/\[([\d.]+)\]/g, (_, op) => {
    const base = mapBgOpacity(op)
    return base.replace('bg-', 'via-')
  })

  s = s.replace(/to-white\/\[([\d.]+)\]/g, (_, op) => {
    const base = mapBgOpacity(op)
    return base.replace('bg-', 'to-')
  })

  return s
}

const files = walk(root)
let changed = 0
for (const file of files) {
  if (file.includes(`${path.sep}scripts${path.sep}apply-theme-tokens.mjs`)) continue
  const before = fs.readFileSync(file, 'utf8')
  const after = transform(before)
  if (after !== before) {
    fs.writeFileSync(file, after)
    changed++
    console.log('updated', path.relative(root, file))
  }
}
console.log('done, files changed:', changed)
