const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')
const os = require('os')

const NAMESPACE_ID = 'e005913ce4b04361815155aed5a3e2dc'

function run(cmd) {
  return execSync(cmd, { encoding: 'utf-8', cwd: path.resolve(__dirname, '..') }).trim()
}

const index = process.argv[2] !== undefined ? parseInt(process.argv[2], 10) : 0

try {
  const raw = run(`pnpm wrangler kv key get examList:frequency --namespace-id ${NAMESPACE_ID} --local`)
  const parsed = JSON.parse(raw)
  if (!parsed.data?.[index]) {
    console.log(`Item at index ${index} not found`)
    process.exit(1)
  }
  parsed.data.splice(index, 1)

  const tmp = path.join(os.tmpdir(), 'kv-value.json')
  fs.writeFileSync(tmp, JSON.stringify(parsed))

  run(`pnpm wrangler kv key put examList:frequency --namespace-id ${NAMESPACE_ID} --local --path "${tmp}"`)
  run(`pnpm wrangler kv key delete isUpdated --namespace-id ${NAMESPACE_ID} --local`)

  fs.unlinkSync(tmp)
  console.log(`Done — removed item at index ${index}, deleted isUpdated`)
} catch (err) {
  console.error('Error:', err.message)
  process.exit(1)
}
