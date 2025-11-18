"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { ArrowLeft, Package, CreditCard } from "lucide-react"
import { useCart } from "@/contexts/cart-context"
import { toast } from "sonner"
import { formatPrice } from "@/lib/formatPrice"
import { Alert, AlertDescription, AlertTitle } from "../ui/alert"

interface CheckoutFormProps {
  items: Array<{
    id: string
    name: string
    price: number
    image: string
    quantity?: number
  }>
  totalPrice: number
  onBack: () => void
  onClose: () => void
  id?:string
  setTokenless: (value: boolean) => void
  tokenless: boolean
}

export function CheckoutForm({ items, totalPrice, onBack, onClose,id, setTokenless, tokenless}: CheckoutFormProps) {

  const [loading, setLoading] = useState(false)
  
  const [needsShipping, setNeedsShipping] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    postalCode: "",
  })
  const { clearCart } = useCart()


  const sendToWebhook = async () => {
    try {
      const res = await fetch(`/api/token?id=${id||""}`)
      if (res.ok) {
        const data = await res.json()
        if (data.token) {
          const response = await fetch(process.env.NEXT_PUBLIC_URL_WEBHOOK || "", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${data.token}`,
            },
            body: JSON.stringify({
              items: items.map((item) => ({
                id: item.id,
                title: item.name,
                unit_price: item.price,
                quantity: item.quantity,
                image: item.image || "",
              })),
              totalPrice: totalPrice,
              formData: formData,
              needsShipping: needsShipping,
            }),
          })

          if (response.ok) {
            const link = document.createElement("a")
            link.href = "https://wa.me/+5493816592823"
            link.target = "_blank"
            link.rel = "noopener noreferrer"
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)

            // Simulación de procesamiento del pedido
            setTimeout(() => {
              toast.success("¡Pedido realizado!", { position: "top-right", style: { color: "green" } })
              clearCart()
              onClose()
              setLoading(false)
            }, 2000)
          }
        }
      } else {
        setTokenless(true)
      }
    } catch (error) {
      setTokenless(true)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    if (!formData.name) {
      toast.warning("El nombre es obligatorio", { position: "top-right", style: { color: "orange" } })
      setLoading(false)
      return
    }
    if (needsShipping && (!formData.postalCode || !formData.address)) {
      toast.warning("Para envío, completá Código Postal y Dirección", {
        position: "top-right",
        style: { color: "orange" },
      })
      setLoading(false)
      return
    }
    sendToWebhook()
  }

  // const shippingCost = needsShipping ? 10 : 0
  const finalTotal = totalPrice // + shippingCost

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      {tokenless ? (
        <>
          <Alert className="mt-5">
            <AlertTitle>¡Ups! Necesitamos verificar tu pedido desde WhatsApp.</AlertTitle>
            <AlertDescription className="mt-2">
              Por favor, envianos un mensaje y hacé clic en el botón <b>Iniciar Compra</b> que te enviaremos.
              <br /> Así podemos generar tu token y continuar con el proceso.
            </AlertDescription>
          </Alert>
          <Button
            variant="default"
            size="lg"
            className="w-full mt-6 mb-5 bg-[#25D366] hover:bg-[#128C7E] text-white"
            onClick={() => {
              const link = document.createElement("a")
              link.href = "https://wa.me/+5493816592823"
              link.target = "_blank"
              link.rel = "noopener noreferrer"
              document.body.appendChild(link)
              link.click()
              document.body.removeChild(link)
            }}
          >
            Ir a Whatsapp
          </Button>
        </>
      ) : (
        <>
          <div className="flex items-center space-x-3 pb-4 border-b">
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h3 className="font-semibold text-gray-900">Finalizar Pedido</h3>
              <p className="text-sm text-gray-600">Completa tus datos</p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto py-4 space-y-4">
            {/* Datos del cliente */}
            <div className="space-y-4">
              <h4 className="font-medium text-foreground">Datos del Cliente</h4>

              <div>
                <Label htmlFor="name">Nombre Completo *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Tu nombre completo"
                  required
                />
            </div>
          </div>

            {/* Envío */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="needsShipping"
                  checked={needsShipping}
                  onCheckedChange={(checked) => setNeedsShipping(!!checked)}
                />
                <Label htmlFor="needsShipping">¿Necesito envío?</Label>
              </div>

              {needsShipping && (
                <div className="grid gap-4 mt-2">
                  <div>
                    <Label htmlFor="postalCode">Código Postal</Label>
                    <Input
                      id="postalCode"
                      value={formData.postalCode}
                      onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                      placeholder="Ej: 4000"
                      inputMode="numeric"
                    />
                  </div>
                  <div>
                    <Label htmlFor="address">Dirección</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="Calle, número, barrio"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Resumen del pedido */}
            <div className="bg-muted rounded-lg p-4 space-y-3">
              <h4 className="font-medium text-foreground flex items-center">
                <Package className="h-4 w-4 mr-2" />
                Resumen del Pedido
              </h4>

              <div className="space-y-2 text-sm">
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between">
                    <span className="text-muted-foreground">
                      {item.name} x{item.quantity || 0}
                    </span>
                    <span className="font-medium">${formatPrice(item.price * (item.quantity || 0))}</span>
                  </div>
                ))}

                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal:</span>
                  <span className="font-medium">${formatPrice(totalPrice)}</span>
                </div>

                <div className="border-t pt-2 flex justify-between font-semibold">
                  <span>Total:</span>
                  <span>${formatPrice(finalTotal)}</span>
                </div>
              </div>
            </div>
          </form>

          {/* Footer con botón */}
          <div className="border-t pt-4 mb-5">
            <Button
              type="submit"
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-primary hover:bg-primary/90"
            >
              {loading ? (
                "Procesando..."
              ) : (
                <>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Finalizar Pedido (${formatPrice(finalTotal)})
                </>
              )}
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
