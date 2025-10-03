import { create, type ExtractState } from 'zustand'
import { combine } from 'zustand/middleware'
import axios from 'axios'
import toast from 'react-hot-toast'
import type { FormEvent } from 'react'
import type { Product } from '../types/Product'
import type { ApiProduct } from '../types/ApiProduct'

// base url will be dynamic depending on the environment
const BASE_URL =
  import.meta.env.MODE === 'development' ? 'http://localhost:3000' : ''

type ProductState = ExtractState<typeof useProductStore>

export const useProductStore = create(
  combine(
    {
      products: [] as Product[],
      loading: false,
      error: '',
      currentProduct: null,

      // form state
      formData: {
        name: '',
        price: '',
        imageUrl: '',
      },
    },
    (set, get) => ({
      setFormData: (formData: {
        name: string
        price: string
        imageUrl: string
      }) => set({ formData }),

      resetForm: () => set({ formData: { name: '', price: '', imageUrl: '' } }),

      addProduct: async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        set({ loading: true })
        const get_ = get() as ProductState
        const addProductModal = document.getElementById(
          'add_product_modal'
        ) as HTMLDialogElement

        try {
          const { formData } = get()
          await axios.post(`${BASE_URL}/api/products`, {
            ...formData,
            image_url: formData.imageUrl,
          })
          await get_.fetchProducts()
          get_.resetForm()
          toast.success('Product added successfully')
          addProductModal?.close()
        } catch (error) {
          console.log('Error in addProduct function', error)
          toast.error('Something went wrong')
        } finally {
          set({ loading: false })
        }
      },

      fetchProducts: async () => {
        set({ loading: true })
        try {
          const response = await axios.get(`${BASE_URL}/api/products`)
          const products = response.data.data.map(
            (product: ApiProduct): Product => ({
              id: product.id,
              name: product.name,
              price: product.price,
              imageUrl: product.image_url,
            })
          )
          set({ products })
        } catch (err) {
          if (axios.isAxiosError(err)) {
            if (err.response?.status === 429) {
              set({ error: 'Rate limit exceeded', products: [] })
            } else {
              set({
                error: err.response?.data?.message || 'Something went wrong',
                products: [],
              })
            }
          } else {
            set({ error: 'An unexpected error occurred', products: [] })
          }
        } finally {
          set({ loading: false })
        }
      },

      deleteProduct: async (id: number) => {
        console.log('deleteProduct function called', id)
        set({ loading: true })
        try {
          await axios.delete(`${BASE_URL}/api/products/${id}`)
          set((prev) => ({
            products: prev.products.filter((product) => product.id !== id),
          }))
          toast.success('Product deleted successfully')
        } catch (err: unknown) {
          if (axios.isAxiosError(err)) {
            const errorMessage =
              err.response?.data?.message || 'Failed to delete product'
            toast.error(errorMessage)
            console.log('Error in deleteProduct function:', err)
          } else {
            toast.error('An unexpected error occurred')
            console.log('Error in deleteProduct function:', err)
          }
        } finally {
          set({ loading: false })
        }
      },

      fetchProduct: async (id: number) => {
        set({ loading: true })
        try {
          const response = await axios.get(`${BASE_URL}/api/products/${id}`)
          set({
            currentProduct: response.data.data,
            formData: response.data.data,
          })
        } catch (err: unknown) {
          if (axios.isAxiosError(err)) {
            const errorMessage =
              err.response?.data?.message || 'Failed to fetch product'
            set({ error: errorMessage, currentProduct: null })
            console.log('Error in fetchProduct function:', err)
          } else {
            set({ error: 'An unexpected error occurred', currentProduct: null })
            console.log('Error in fetchProduct function:', err)
          }
        } finally {
          set({ loading: false })
        }
      },

      updateProduct: async (id: number) => {
        set({ loading: true })
        try {
          const { formData } = get()
          const response = await axios.put(`${BASE_URL}/api/products/${id}`, {
            ...formData,
            image_url: formData.imageUrl,
          })
          set({ currentProduct: response.data.data })
          toast.success('Product updated successfully')
        } catch (err: unknown) {
          if (axios.isAxiosError(err)) {
            const errorMessage =
              err.response?.data?.message || 'Failed to update product'
            toast.error(errorMessage)
            console.log('Error in updateProduct function:', err)
          } else {
            toast.error('An unexpected error occurred')
            console.log('Error in updateProduct function:', err)
          }
        } finally {
          set({ loading: false })
        }
      },
    })
  )
)
