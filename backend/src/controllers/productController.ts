import { RequestHandler } from 'express'
import { sql } from '../config/db.js'

//CRUD operations - create, read, update, delete

export const getProducts: RequestHandler = async (req, res) => {
  try {
    const products = await sql`
      SELECT * FROM products
      ORDER BY created_at DESC
    `
    console.log('fetched products: ', products)
    res.status(200).json({ success: true, data: products })
  } catch (error) {
    console.log('Error getProducts: ' + error)
    res.status(500).json({ success: false, message: 'Server Error' })
  }
}

export const getProduct: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params
    const product = await sql`
      SELECT * FROM products WHERE id = ${id}
    `
    if (product.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: 'Product not found' })
    }
    res.status(200).json({ success: true, data: product[0] })
  } catch (error) {
    console.log('Error getProduct: ' + error)
    res.status(500).json({ success: false, message: 'Server Error' })
  }
}

export const createProduct: RequestHandler = async (req, res) => {
  const { name, price, image_url } = req.body

  if (!name || !price || !image_url) {
    return res
      .status(400)
      .json({ success: false, message: 'Missing required fields' })
  }

  try {
    const newProduct = await sql`
      INSERT INTO products (name, price, image_url)
      VALUES (${name}, ${price}, ${image_url})
      RETURNING *
    `
    res.status(201).json({ success: true, data: newProduct })
  } catch (error) {
    console.log('Error createProduct: ' + error)
    res.status(500).json({ success: false, message: 'Server Error' })
  }
}
export const updateProduct: RequestHandler = async (req, res) => {
  const { id } = req.params
  const { name, price, image_url } = req.body

  try {
    const updateProduct = await sql`
      UPDATE products
      SET name = ${name}, price = ${price}, image_url = ${image_url}
      WHERE id = ${id}
      RETURNING *
    `
    if (updateProduct.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: 'Product not found' })
    }
    res.status(200).json({ success: true, data: updateProduct[0] })
  } catch (error) {
    console.log('Error updateProduct: ' + error)
    res.status(500).json({ success: false, message: 'Server Error' })
  }
}

export const deleteProduct: RequestHandler = async (req, res) => {
  const { id } = req.params

  try {
    const deletedProduct = await sql`
    DELETE FROM products WHERE id=${id} RETURNING *
  `
    if (deletedProduct.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: 'Product not found' })
    }
    res.status(200).json({ success: true, data: deletedProduct[0] })
  } catch (error) {
    console.log('Error deleteProduct: ' + error)
    res.status(500).json({ success: false, message: 'Server Error' })
  }
}
