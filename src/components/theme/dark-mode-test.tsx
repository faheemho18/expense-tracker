"use client"

import { useDarkMode } from "@/hooks/use-dark-mode"
import { Button } from "@/components/ui/button"

/**
 * Test component to verify dark mode functionality
 * This can be temporarily added to any page for testing
 */
export function DarkModeTest() {
  const { preference, setPreference, isDark } = useDarkMode()

  return (
    <div className="p-4 border rounded-lg">
      <h3 className="font-bold mb-2">Dark Mode Test</h3>
      <p className="mb-2">
        Current preference: <strong>{preference}</strong>
      </p>
      <p className="mb-2">
        Currently dark: <strong>{isDark ? "Yes" : "No"}</strong>
      </p>
      <div className="flex gap-2">
        <Button
          variant={preference === "light" ? "default" : "outline"}
          onClick={() => setPreference("light")}
        >
          Light
        </Button>
        <Button
          variant={preference === "dark" ? "default" : "outline"}
          onClick={() => setPreference("dark")}
        >
          Dark
        </Button>
        <Button
          variant={preference === "auto" ? "default" : "outline"}
          onClick={() => setPreference("auto")}
        >
          Auto
        </Button>
      </div>
    </div>
  )
}