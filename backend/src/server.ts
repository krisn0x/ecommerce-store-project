import express from 'express'
import helmet from 'helmet'
import morgan from 'morgan'
import cors from 'cors'
import dotenv from 'dotenv'
import productRoutes from './routes/productRoutes.js'
import { sql } from './config/db.js'

dotenv.config()
const app = express()
const PORT = process.env.PORT || 3000

app.use(express.json())
app.use(cors()) // allows cross-origin requests
app.use(helmet()) // adds security via headers
app.use(morgan('dev')) //logs requests

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