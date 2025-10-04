import path from 'path'
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
const PORT = parseInt(process.env.PORT || '3000')

const isPortInUse = async (port: number): Promise<boolean> => {
  return new Promise((resolve) => {
    const server = app
      .listen(port, () => {
        server.close()
        resolve(false)
      })
      .on('error', () => {
        resolve(true)
      })
  })
}

const findAvailablePort = async (startPort: number): Promise<number> => {
  let port = startPort
  while (await isPortInUse(port)) {
    console.log(`Port ${port} is in use, trying ${port + 1}`)
    port++
  }
  return port
}

app.use(express.json())
app.use(cors()) // allows cross-origin requests
app.use(
  helmet({ // adds security headers
    contentSecurityPolicy: {
      directives: {
        // Allow images from any source
        imgSrc: ["'self'", '*', 'data:', 'blob:']
      }
    }
  })
)
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

if (process.env.NODE_ENV == 'production') {
  app.use(express.static(__dirname.replace('backend', 'frontend')))

  app.get('/{*any}', (req, res) => {
    res.sendFile(
      path.resolve(__dirname.replace('backend', 'frontend'), 'index.html')
    )
  })
}

initDB().then(async () => {
  const availablePort = await findAvailablePort(PORT)
  const server = app.listen(availablePort, () => {
    console.log('server running on port ' + availablePort)
  })

  // Handle shutdown gracefully
  process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server')
    server.close(() => {
      console.log('HTTP server closed')
    })
  })

  process.on('SIGINT', () => {
    console.log('SIGINT signal received: closing HTTP server')
    server.close(() => {
      console.log('HTTP server closed')
      process.exit(0)
    })
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
