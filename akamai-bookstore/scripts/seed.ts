import { Client } from 'pg'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

interface BookRecord {
  title: string
  author: string
  category: string
  description: string
  price: number
  rating: number
  quantity: number
}

const client = new Client({
  host: process.env.POSTGRES_HOST ?? 'localhost',
  port: parseInt(process.env.POSTGRES_PORT ?? '5432'),
  database: process.env.POSTGRES_DB ?? 'bookstore',
  user: process.env.POSTGRES_USER ?? 'bookstore',
  password: process.env.POSTGRES_PASSWORD ?? 'changeme',
})

async function main() {
  await client.connect()
  console.log('Connected to PostgreSQL')

  const books: BookRecord[] = JSON.parse(
    readFileSync(resolve(__dirname, 'seed-books.json'), 'utf8'),
  )

  let inserted = 0
  let skipped = 0

  for (const book of books) {
    const { rowCount } = await client.query(
      'SELECT 1 FROM books WHERE title = $1 AND author = $2',
      [book.title, book.author],
    )

    if ((rowCount ?? 0) > 0) {
      skipped++
      continue
    }

    const coverUrl = `https://placehold.co/200x300/e2e8f0/475569?text=${encodeURIComponent(book.title.slice(0, 12))}`

    await client.query(
      `INSERT INTO books (title, author, category, description, price, rating, cover_url, quantity)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [book.title, book.author, book.category, book.description, book.price, book.rating, coverUrl, book.quantity],
    )
    inserted++
    console.log(`  ✓ ${book.title}`)
  }

  console.log(`\nDone: ${inserted} inserted, ${skipped} skipped`)
  await client.end()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
