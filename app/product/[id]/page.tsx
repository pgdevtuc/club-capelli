"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { WhatsAppHeader } from "@/components/layout/whatsapp-header"
import { useCart } from "@/contexts/cart-context"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Minus } from "lucide-react"
import { toast } from "sonner"
import { notFound } from "next/navigation"
import { ProductPageSkeleton } from "@/components/products/product-page-skeleton"
import type { IProduct } from "@/lib/models/product"

export default function ProductPage() {
  const params = useParams()
  const { addItem } = useCart()
  const [product, setProduct] = useState<IProduct | null>(null)
  const [selectedVariant, setSelectedVariant] = useState<number>(0)
  const [quantity, setQuantity] = useState(1)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!params.id) return
    const fetchProduct = async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/products/verify?productId=${params.id}`)
        if (res.ok) {
          const data = await res.json()
          setProduct(data.product)
        } else {
          notFound()
        }
      } catch (error) {
        console.error("Error fetching product:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchProduct()
  }, [params.id])

  const selectedVariantData = product?.variants?.[selectedVariant]
  const availableStock = selectedVariantData?.stock_total || 0

  const handleAddToCart = () => {
    if (!product || !selectedVariantData) return

    if (availableStock === 0) {
      toast.error("Producto agotado")
      return
    }

    if (quantity > availableStock) {
      toast.error(`Solo hay ${availableStock} unidades disponibles`)
      return
    }

    addItem(
      {
        id: `${product.id}-${selectedVariantData.variant_id}`,
        name: `${product.name} - Color ${selectedVariant + 1}`,
        price: Number(product.price),
        image: selectedVariantData.image_url || "/placeholder.svg",
        stock: availableStock,
      },
      quantity,
    )
    toast.success(`${quantity} producto(s) agregado(s) al carrito`)
  }

  const incrementQuantity = () => {
    if (quantity < availableStock) {
      setQuantity((prev) => prev + 1)
    }
  }

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity((prev) => prev - 1)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <WhatsAppHeader />
        <ProductPageSkeleton />
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-100">
        <WhatsAppHeader />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <p className="text-gray-600">Producto no encontrado</p>
          </div>
        </div>
      </div>
    )
  }

  const currentPrice = product.price
  const priceWithoutTax = Number(product.price) / 1.21
  const installmentPrice = Number(product.price) / 3

  return (
    <div className="catalog-pattern-bg min-h-screen">
      <WhatsAppHeader />

      <div className="max-w-7xl mx-auto px-4 py-10 pt-32">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 bg-card rounded-xl shadow-md overflow-hidden border border-border">
          {/* Left Column - Product Image */}
          <div className="relative bg-gray-50 flex items-center justify-center p-8 lg:p-16">
            <div className="relative w-full max-w-md aspect-square">
              <img
                src={
                  product.variants
                    ? product.variants[selectedVariant]?.image_url || "/placeholder.svg"
                    : "/placeholder.svg"
                }
                alt={product.name}
                className="w-full h-full object-contain"
              />

              {availableStock === 0 && (
                <Badge className="absolute top-4 left-4 bg-red-500 hover:bg-red-600">Agotado</Badge>
              )}
            </div>

            {/* Carousel indicators for mobile */}
            {product.variants && product.variants?.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 lg:hidden">
                {product?.variants.map((_, index) => (
                  <button
                    key={index}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      index === selectedVariant ? "bg-gray-800" : "bg-gray-300"
                    }`}
                    onClick={() => setSelectedVariant(index)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Right Column - Product Details */}
          <div className="p-6 lg:p-12 space-y-6">
            {/* Product title */}
            <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 leading-tight">{product.name}</h1>

            {/* Price section */}
            <div className="space-y-2">
              <div className="text-4xl lg:text-5xl font-bold text-foreground">
                ${Number(currentPrice).toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">
                Precio sin impuestos $
                {priceWithoutTax.toLocaleString("es-AR", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </div>
            </div>

            {/* Color/Variant selector */}
            {product.variants && product.variants.length > 0 && (
              <div className="space-y-3">
                <div className="font-medium text-foreground">
                  colores: <span className="font-bold">{product.variants.length}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {product.variants.map((variant, index) => (
                    <button
                      key={variant.variant_id}
                      onClick={() => setSelectedVariant(index)}
                      disabled={!variant.visible || variant.stock_total === 0}
                      className={`
                                                w-12 h-12 rounded border-2 flex items-center justify-center
                                                font-medium text-sm transition-all
                                                ${
                                                  selectedVariant === index
                                                    ? "border-orange-500 bg-orange-500 hover:bg-orange-600 text-primary-foreground"
                                                    : "border-input bg-card text-foreground hover:border-orange-500"
                                                }
                                                ${
                                                  !variant.visible || variant.stock_total === 0
                                                    ? "opacity-30 cursor-not-allowed line-through"
                                                    : ""
                                                }
                                            `}
                    >
                      {index + 1}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {availableStock > 0 && availableStock <= 5 && (
              <div className="text-accent font-medium">¡Solo quedan {availableStock} en stock!</div>
            )}

            {/* Quantity selector and Add to Cart */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <div className="flex items-center border-2 border-input rounded-lg w-full sm:w-auto">
                <button
                  onClick={decrementQuantity}
                  disabled={quantity <= 1}
                  className="p-3 hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <Minus className="h-5 w-5" />
                </button>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => {
                    const val = Number.parseInt(e.target.value) || 1
                    if (val >= 1 && val <= availableStock) {
                      setQuantity(val)
                    }
                  }}
                  className="w-16 text-center font-medium border-none focus:outline-none bg-transparent"
                  min="1"
                  max={availableStock}
                />
                <button
                  onClick={incrementQuantity}
                  disabled={quantity >= availableStock}
                  className="p-3 hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <Plus className="h-5 w-5" />
                </button>
              </div>

              <Button
                onClick={handleAddToCart}
                disabled={availableStock === 0}
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-primary-foreground py-6 text-lg font-medium rounded-lg shadow-sm"
              >
                Agregar al carrito
              </Button>
            </div>

            {availableStock === 0 && <div className="text-destructive font-medium">✗ Producto agotado</div>}
          </div>
        </div>
      </div>
    </div>
  )
}
