import { create, type ExtractState } from 'zustand'
import { combine } from 'zustand/middleware'
import axios from 'axios'
import toast from 'react-hot-toast'
import type { FormEvent } from 'react'
import type { Product } from '../types/Product'

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
      },

      fetchProducts: async () => {
      },

      deleteProduct: async (id: number) => {
      },

      fetchProduct: async (id: number) => {
      },

      updateProduct: async (id: number) => {
      },
    })
  )
)
