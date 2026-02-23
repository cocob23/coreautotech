export type Category = {
  id: number
  name: string
  slug: string
}

export type Product = {
  id: number
  name: string
  description: string | null
  price: number
  price_list?: number | null
  price_cash?: number | null
  stock: number
  in_stock: boolean
  category_id: number | null
  created_at: string
  updated_at: string
}

export type ProductImage = {
  id: number
  product_id: number
  url: string
  created_at: string
  order?: number | null
}

export type Order = {
  id: number
  product_id: number | null
  quantity: number
  buyer_name: string | null
  buyer_contact: string | null
  status: string
  notes: string | null
  created_at: string
}
