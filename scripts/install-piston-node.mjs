const PISTON_URL = process.env.PISTON_URL ?? 'http://localhost:2000'

async function getJson(url, opts) {
  const res = await fetch(url, opts)
  if (!res.ok) {
    throw new Error(`${url} responded ${res.status}: ${await res.text()}`)
  }
  return res.json()
}

const isNode = (entry) =>
  entry.language === 'node' || (entry.aliases ?? []).includes('javascript')

function compareVersions(a, b) {
  const pa = a.split('.').map(Number)
  const pb = b.split('.').map(Number)
  for (let i = 0; i < 3; i += 1) {
    if ((pa[i] ?? 0) !== (pb[i] ?? 0)) return (pb[i] ?? 0) - (pa[i] ?? 0)
  }
  return 0
}

async function main() {
  console.log(`[judge-setup] checking installed runtimes at ${PISTON_URL}`)
  const runtimes = await getJson(`${PISTON_URL}/api/v2/runtimes`)
  const installed = runtimes.find(isNode)

  if (installed) {
    console.log(`[judge-setup] node ${installed.version} already installed`)
  } else {
    console.log('[judge-setup] fetching piston package index...')
    const packages = await getJson(`${PISTON_URL}/api/v2/packages`)
    const nodeVersions = packages.filter(isNode).map((p) => p.language_version)
    if (nodeVersions.length === 0) {
      throw new Error('no node runtime found in piston package index')
    }
    const latest = nodeVersions.sort(compareVersions)[0]
    console.log(`[judge-setup] installing node ${latest} into piston (takes a minute)...`)
    await getJson(`${PISTON_URL}/api/v2/packages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ language: 'node', version: latest }),
    })
    console.log('[judge-setup] install complete')
  }

  const runtimesAfter = await getJson(`${PISTON_URL}/api/v2/runtimes`)
  const node = runtimesAfter.find(isNode)
  if (!node) throw new Error('node runtime missing after install')
  console.log(`[judge-setup] smoke test: console.log(1 + 1) on node ${node.version}`)

  const result = await getJson(`${PISTON_URL}/api/v2/execute`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      language: node.language,
      version: node.version,
      files: [{ name: 'main.js', content: 'console.log(1 + 1)' }],
      run_timeout: 3000,
    }),
  })

  const run = result.run ?? {}
  const out = (run.stdout ?? '').trim()
  if (run.code === 0 && out === '2') {
    console.log('[judge-setup] OK — piston answered 2')
  } else {
    throw new Error(`unexpected piston response: ${JSON.stringify(result)}`)
  }
}

main().catch((err) => {
  console.error('[judge-setup] FAILED:', err.message)
  process.exit(1)
})
