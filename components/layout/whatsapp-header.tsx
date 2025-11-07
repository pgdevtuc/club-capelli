"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, Phone, MoreVertical, User, ShoppingCart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useCart } from "@/contexts/cart-context"
import { CartDrawer } from "@/components/cart/cart-drawer"
import { usePathname } from "next/navigation"
import Image from "next/image"
import { useSearchParams } from "next/navigation"

export function WhatsAppHeader() {
  const pathname = usePathname()
  const [isCartOpen, setIsCartOpen] = useState(false)
  const { items } = useCart()
  const totalItems = items.reduce((sum, item) => sum + (item?.quantity || 0), 0)

  const param = useSearchParams()
  const id = param.get("id")

  const buildUrl = (basePath: string) => {
    return id ? `${basePath}?id=${id}` : basePath
  }

  useEffect(() => {
    if (totalItems === 0) {
      setIsCartOpen(false)
    }
  }, [totalItems])

  return (
    <>
      <header className="bg-card border-b border-border fixed top-0 left-0 right-0 z-40 shadow-sm">
        <div className="bg-orange-500 px-4 py-2 text-xs flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-primary-foreground/80">Powered by</span>
            <span className="font-semibold text-primary-foreground">Waichatt</span>
          </div>
          <Link
            href={buildUrl("/login")}
            className="text-primary-foreground/80 hover:text-primary-foreground flex items-center gap-1 transition-colors"
          >
            <User className="h-3.5 w-3.5" />
            <span>Admin</span>
          </Link>
        </div>

        <div className="flex items-center px-4 py-4 bg-card">
          <Link href={pathname.includes("product") ? buildUrl("/") : buildUrl("#")}>
            <Button variant="ghost" size="icon" className="mr-3 hover:bg-muted">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-3 flex-1">
            <div className="w-11 h-11 bg-muted rounded-full flex items-center justify-center overflow-hidden border-2 border-primary/20">
              <Image src="/images/logoCapelli.png" width={50} height={50} alt="logo" className="object-cover" />
            </div>
            <div className="flex-1">
              <h1 className="font-semibold text-foreground text-base">Club Capelli</h1>
              <p className="text-xs text-muted-foreground">Tienda en línea</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="relative hover:bg-muted" onClick={() => setIsCartOpen(true)}>
              <ShoppingCart className="h-5 w-5" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-orange-500 text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium shadow-sm">
                  {totalItems}
                </span>
              )}
            </Button>
            <Button variant="ghost" size="icon" className="hover:bg-muted">
              <Phone className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="hover:bg-muted">
              <MoreVertical className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </>
  )
}
