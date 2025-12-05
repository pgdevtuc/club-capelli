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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

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
  id?: string
  setTokenless: (value: boolean) => void
  tokenless: boolean
}

// Datos de provincias, localidades y sucursales
const PROVINCES = ["TUCUMAN", "JUJUY", "SALTA", "SANTIAGO DEL ESTERO"] as const

const LOCALITIES: Record<(typeof PROVINCES)[number], string[]> = {
  TUCUMAN: ["SAN MIGUEL DE TUCUMAN", "YERBA BUENA", "MONTEROS"],
  JUJUY: ["SAN SALVADOR DE JUJUY"],
  SALTA: ["SALTA CAPITAL"],
  "SANTIAGO DEL ESTERO": ["SANTIAGO CAPITAL"],
}

const BRANCHES_BY_LOCALITY: Record<string, string[]> = {
  "SAN MIGUEL DE TUCUMAN": [
    "Córdoba 561",
    "Crisóstomo Álvarez 545",
    "24 de Septiembre 205",
    "San Juan 790",
    "Salta 785",
  ],
  "YERBA BUENA": ["Av. Aconquija y Luis Lobo de la Vega"],
  MONTEROS: ["Colón 214"],
  "SAN SALVADOR DE JUJUY": ["Necochea 345"],
  "SALTA CAPITAL": ["Buenos Aires 68 Loc.12 - Galeria Bs.AS"],
  "SANTIAGO CAPITAL": ["Pellegrini 18"],
}

export function CheckoutForm({ items, totalPrice, onBack, onClose, id, setTokenless, tokenless }: CheckoutFormProps) {
  const [loading, setLoading] = useState(false)

  // Método de entrega: "envio" o "retiro" (obligatorio elegir uno)
  const [deliveryMethod, setDeliveryMethod] = useState<"envio" | "retiro" | "">("")

  // Mantengo needsShipping para compatibilidad con el flujo existente
  const [needsShipping, setNeedsShipping] = useState(false)

  // Datos para retiro en sucursal
  const [province, setProvince] = useState<string>("")
  const [city, setCity] = useState<string>("")
  const [branch, setBranch] = useState<string>("")

  const [formData, setFormData] = useState({
    name: "",
    dni: "",
    address: "",
    postalCode: "",
  })
  const { clearCart } = useCart()

  const sendToWebhook = async () => {
    try {
      const res = await fetch(`/api/token?id=${id || ""}`)
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
              deliveryMethod: deliveryMethod,
              pickupData:
                deliveryMethod === "retiro"
                  ? {
                    province,
                    city,
                    branch,
                  }
                  : null,
            }),
          })

          if (response.ok) {
            const link = document.createElement("a")
            link.href = `https://wa.me/+${process.env.NEXT_PUBLIC_PHONE}`
            link.target = "_blank"
            link.rel = "noopener noreferrer"
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)

            // Simulación de procesamiento del pedido
            setTimeout(() => {
              toast.success("¡Pedido realizado!", {description:"Confirma el pedido en tu whatsapp!", position: "top-right", style: { color: "green" } })
              clearCart()
              onClose()
              setLoading(false)
            }, 2000)
          }
        }
      } else {
        toast.error("¡Error!", { description: "Hubo un error al enviar el pedido", position: "top-right", style: { color: "red" } })
        setTokenless(true)
      }
    } catch (error) {
      toast.error("¡Error!", { description: "Hubo un error al enviar el pedido", position: "top-right", style: { color: "red" } })
      setTokenless(true)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const nombre = formData.name?.trim()
    const dniRaw = (formData.dni ?? "").toString().trim()

    // Validación: método de entrega obligatorio
    if (!deliveryMethod) {
      toast.warning("Debés seleccionar Envío o Retiro en sucursal", {
        position: "top-right",
        style: { color: "orange" },
      })
      setLoading(false)
      return
    }

    // Validación campos obligatorios
    if (!nombre || !dniRaw) {
      toast.warning("El Nombre y DNI son obligatorio", {
        position: "top-right",
        style: { color: "orange" },
      })
      setLoading(false)
      return
    }

    // Elimino todo lo que no sea dígito
    const dniLimpio = dniRaw.replace(/\D/g, "")

    // Si tenía caracteres no numéricos o no tiene exactamente 8 dígitos -> warning
    const tieneCaracteresInvalidos = /\D/.test(dniRaw)
    if (tieneCaracteresInvalidos || dniLimpio.length !== 8) {
      toast.warning("Formato incorrecto de DNI. Debe contener exactamente 8 números.", {
        position: "top-right",
        style: { color: "orange" },
      })
      setLoading(false)
      return
    }

    // Validación de envío
    if (deliveryMethod === "envio") {
      if (!formData.postalCode || !formData.address) {
        toast.warning("Para envío, completá Código Postal y Dirección", {
          position: "top-right",
          style: { color: "orange" },
        })
        setLoading(false)
        return
      }
    }

    // Validación de retiro en sucursal
    if (deliveryMethod === "retiro") {
      if (!province || !city || !branch) {
        toast.warning("Para retiro, seleccioná Provincia, Localidad y Sucursal", {
          position: "top-right",
          style: { color: "orange" },
        })
        setLoading(false)
        return
      }
      formData.address = ""
      formData.postalCode = ""
    }

    // Armás el payload con el DNI ya parseado (solo 8 números)
    formData.dni = dniLimpio

    try {
      await sendToWebhook()
    } finally {
      setLoading(false)
    }
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
              link.href = `https://wa.me/+${process.env.NEXT_PUBLIC_PHONE}?text=Hola%2C%20quiero%20iniciar%20mi%20compra%20en%20Club%20Capelli.`
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
              <div>
                <Label htmlFor="dni">DNI *</Label>
                <Input
                  id="dni"
                  value={formData.dni}
                  onChange={(e) => setFormData({ ...formData, dni: e.target.value })}
                  placeholder="12345678"
                  required
                />
              </div>
            </div>

            {/* Método de entrega */}
            <div className="space-y-4">
              <h4 className="font-medium text-foreground">Método de entrega</h4>
              <RadioGroup
                value={deliveryMethod}
                onValueChange={(v) => {
                  const val = v as "envio" | "retiro"
                  setDeliveryMethod(val)
                  setNeedsShipping(val === "envio")
                  // Reset campos según el método elegido
                  if (val === "retiro") {
                    // limpiar dirección/envío opcionalmente
                  }
                  if (val === "envio") {
                    setProvince("")
                    setCity("")
                    setBranch("")
                  }
                }}
                className="grid grid-cols-1 sm:grid-cols-2 gap-3"
              >
                <div className="flex items-center space-x-2 border rounded-md p-3">
                  <RadioGroupItem value="envio" id="envio" />
                  <Label htmlFor="envio" className="cursor-pointer">Envío</Label>
                </div>
                <div className="flex items-center space-x-2 border rounded-md p-3">
                  <RadioGroupItem value="retiro" id="retiro" />
                  <Label htmlFor="retiro" className="cursor-pointer">Retiro en sucursal</Label>
                </div>
              </RadioGroup>

              {/* Datos de envío */}
              {deliveryMethod === "envio" && (
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

              {/* Datos para retiro en sucursal */}
              {deliveryMethod === "retiro" && (
                <div className="grid gap-4 mt-2">
                  <div>
                    <Label>Provincia</Label>
                    <Select
                      value={province}
                      onValueChange={(val) => {
                        setProvince(val)
                        setCity("")
                        setBranch("")
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Seleccioná una provincia" />
                      </SelectTrigger>
                      <SelectContent>
                        {PROVINCES.map((prov) => (
                          <SelectItem key={prov} value={prov}>
                            {prov}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Localidad</Label>
                    <Select
                      value={city}
                      onValueChange={(val) => {
                        setCity(val)
                        setBranch("")
                      }}
                      disabled={!province}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={province ? "Seleccioná una localidad" : "Primero elegí provincia"} />
                      </SelectTrigger>
                      <SelectContent>
                        {(province ? LOCALITIES[province as (typeof PROVINCES)[number]] : []).map((loc) => (
                          <SelectItem key={loc} value={loc}>
                            {loc}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Sucursal</Label>
                    <Select value={branch} onValueChange={setBranch} disabled={!city}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={city ? "Seleccioná una sucursal" : "Primero elegí localidad"} />
                      </SelectTrigger>
                      <SelectContent>
                        {(city ? BRANCHES_BY_LOCALITY[city] || [] : []).map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
