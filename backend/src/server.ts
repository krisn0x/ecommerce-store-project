import express from 'express'
import helmet from 'helmet'
import morgan from 'morgan'
import cors from 'cors'
import dotenv from 'dotenv'
import productRoutes from './routes/productRoutes.js'
import { sql } from './config/db.js'
import { aj } from './lib/arcjet.js'
import { ArcjetNodeRequest } from '@arcjet/node'

dotenv.config()
const app = express()
const PORT = process.env.PORT || 3000

app.use(express.json())
app.use(cors()) // allows cross-origin requests
app.use(helmet()) // adds security via headers
app.use(morgan('dev')) //logs requests

app.use(async (req, res, next) => {
  try {
    const decision = await aj.protect(req as ArcjetNodeRequest, {
      requested: 5,
    }) // Deduct 5 tokens from the bucket
    console.log('Arcjet decision', decision)

    if (decision.isDenied()) {
      if (decision.reason.isRateLimit()) {
        res.writeHead(429, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: 'Too Many Requests' }))
      } else if (decision.reason.isBot()) {
        res.writeHead(403, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: 'No bots allowed' }))
      } else {
        res.writeHead(403, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: 'Forbidden' }))
      }
    } else if (decision.ip.isHosting()) {
      // Requests from hosting IPs are likely from bots, so they can usually be
      // blocked. However, consider your use case - if this is an API endpoint
      // then hosting IPs might be legitimate.
      // https://docs.arcjet.com/blueprints/vpn-proxy-detection
      res.writeHead(403, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'Forbidden' }))
    } else {
      next()
    }
  } catch (error) {
    next(error)
  }
})

app.use('/api/products', productRoutes)

initDB().then(() => {
  app.listen(PORT, () => {
    console.log('server running on port ' + PORT)
  })
})

async function initDB(): Promise<void> {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        price NUMERIC(10, 2) NOT NULL,
        image_url TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `
    console.log('Database Initialized')
  } catch (error) {
    console.log('Error initDB: ' + error)
  }
}
