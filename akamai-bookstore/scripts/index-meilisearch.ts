import { MeiliSearch } from 'meilisearch'
import { Client } from 'pg'

const meili = new MeiliSearch({
  host: process.env.MEILI_HOST ?? 'http://localhost:7700',
  apiKey: process.env.MEILI_MASTER_KEY ?? 'changeme-meili-key',
})

const pg = new Client({
  host: process.env.POSTGRES_HOST ?? 'localhost',
  port: parseInt(process.env.POSTGRES_PORT ?? '5432'),
  database: process.env.POSTGRES_DB ?? 'bookstore',
  user: process.env.POSTGRES_USER ?? 'bookstore',
  password: process.env.POSTGRES_PASSWORD ?? 'changeme',
})

async function main() {
  await pg.connect()
  console.log('Connected to PostgreSQL')

  const index = meili.index('books')

  console.log('Configuring Meilisearch index settings...')
  await index.updateSettings({
    searchableAttributes: ['title', 'author', 'description', 'category'],
    filterableAttributes: ['category', 'rating'],
    sortableAttributes: ['price', 'rating'],
    rankingRules: ['words', 'typo', 'proximity', 'attribute', 'sort', 'exactness'],
    typoTolerance: { enabled: true, minWordSizeForTypos: { oneTypo: 4, twoTypos: 8 } },
  })

  const { rows } = await pg.query(
    'SELECT id, title, author, category, description, price::float, rating::float, cover_url FROM books',
  )

  console.log(`Indexing ${rows.length} books into Meilisearch...`)
  const task = await index.addDocuments(rows, { primaryKey: 'id' })
  console.log(`Task enqueued: ${task.taskUid}`)

  console.log('Waiting for indexing to complete...')
  await meili.waitForTask(task.taskUid, { timeOutMs: 60_000 })
  console.log('Meilisearch index ready.')

  await pg.end()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
