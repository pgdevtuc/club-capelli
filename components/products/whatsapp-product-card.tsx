"use client"

import type React from "react"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { Star } from "lucide-react"
import { useCart } from "@/contexts/cart-context"
import { useState } from "react"
import type { IProduct } from "@/lib/models/product"
import { formatPrice } from "@/lib/formatPrice"
import Link from "next/link"
import { useSearchParams } from "next/navigation"

interface ProductCardProps {
  product: IProduct
}

export function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCart()
  const [showImageModal, setShowImageModal] = useState(false)

  const param = useSearchParams()
  const id = param.get("id")

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    addItem({
      id: product.id,
      name: product.name,
      price: product.salePrice || Number(product.price),
      image: product.images[0] ||  "/placeholder.png",
      stock: product.stock,
    })
  }


  const hasDiscount = product.salePrice && product.salePrice > 0 && product.salePrice < Number(product.price)

  const discountPercentage =
    hasDiscount && product.salePrice && product.salePrice > 0
      ? Math.round(((Number(product.price) - product.salePrice!) / Number(product.price)) * 100)
      : null

  return (
    <Link href={id ? `product/${product.id}?id=${id}` : `product/${product.id}`} className="cursor-pointer">
      <div className="bg-card rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 border border-border hover:border-primary/30 flex flex-col h-full group">
        <div className="relative overflow-hidden bg-white">
          <Image
            src={product.images[0]  || "/placeholder.png"}
            alt={product.name}
            width={400}
            height={250}
            priority={true}
            className="w-full h-48 sm:h-52 md:h-56 lg:h-60 object-contain transition-transform duration-300 group-hover:scale-105 p-4"
          />

          {discountPercentage && (
            <Badge className="absolute top-3 left-3 bg-destructive hover:bg-destructive/90 text-destructive-foreground text-xs shadow-sm">
              -{discountPercentage}%
            </Badge>
          )}

          {product.quantity && product.quantity <= 5 && product.quantity > 0 && (
            <Badge className="absolute top-3 right-3 bg-accent text-accent-foreground text-xs shadow-sm">
              Últimas {product.quantity}
            </Badge>
          )}
          {product.stock === 0 && (
            <Badge variant="destructive" className="absolute top-3 right-3 text-xs shadow-sm">
              Agotado
            </Badge>
          )}
        </div>

        <div className="p-4 flex-1 flex flex-col">
          <div className="mb-2">
            <Badge variant="secondary" className="text-xs">
              {product.brand || ""}
            </Badge>
          </div>

          <h3
            title={product.name}
            className="font-semibold text-card-foreground mb-2 text-sm leading-snug line-clamp-2"
          >
            {product.name}
          </h3>
          <p className="text-muted-foreground text-xs mb-3 line-clamp-2 leading-relaxed">{product.description}</p>

          <div className="flex items-center mb-3">
            <div className="flex items-center gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-3 w-3 fill-orange-500 text-orange-500" />
              ))}
            </div>
            <span className="text-xs text-muted-foreground ml-2">(4.8)</span>
          </div>

          <div className="flex items-center justify-between mt-auto pt-2 border-t border-border">
            <div className="flex items-center gap-2">
              {hasDiscount ? (
                <>
                  <span className="text-base font-bold text-primary">${formatPrice(product.salePrice!)}</span>
                  <span className="text-xs text-muted-foreground line-through">${formatPrice(product.price)}</span>
                </>
              ) : (
                <span className="text-base font-bold text-foreground">${formatPrice(product.price)}</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
