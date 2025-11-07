"use client"

import { useEffect, useRef } from "react"

export function DynamicTitle() {
  const originalTitleRef = useRef<string>("")
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const messageIndexRef = useRef(0)

  useEffect(() => {
    // Store the original title
    originalTitleRef.current = document.title

    const messages = ["No te lo pierdas...", "¡Volve!"]

    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Tab is hidden - start cycling through messages
        messageIndexRef.current = 0

        // Change title immediately
        document.title = messages[messageIndexRef.current]

        // Set up interval to cycle through messages
        intervalRef.current = setInterval(() => {
          messageIndexRef.current = (messageIndexRef.current + 1) % messages.length
          document.title = messages[messageIndexRef.current]
        }, 1200) // Change message every 1.2 seconds
      } else {
        // Tab is visible - restore original title
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
          intervalRef.current = null
        }
        document.title = originalTitleRef.current
      }
    }

    // Add event listener
    document.addEventListener("visibilitychange", handleVisibilityChange)

    // Cleanup
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      // Restore original title on unmount
      document.title = originalTitleRef.current
    }
  }, [])

  return null // This component doesn't render anything
}
