
"use client"

import * as React from "react"
import { Paintbrush } from "lucide-react"

import { useLocalStorage } from "@/hooks/use-local-storage"
import type { Theme } from "@/lib/types"

import { AppLayout } from "@/components/app-layout"
import { ThemePreview } from "@/components/themes/theme-preview"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"

const PRESETS: Theme[] = [
  {
    name: "Default",
    primary: { h: 210, s: 60, l: 50 },
    background: { h: 210, s: 20, l: 95 },
    accent: { h: 180, s: 50, l: 50 },
    radius: 0.75,
  },
  {
    name: "Forest",
    primary: { h: 140, s: 50, l: 40 },
    background: { h: 100, s: 10, l: 96 },
    accent: { h: 40, s: 60, l: 60 },
    radius: 0.5,
  },
  {
    name: "Ocean",
    primary: { h: 220, s: 70, l: 55 },
    background: { h: 210, s: 40, l: 97 },
    accent: { h: 190, s: 80, l: 70 },
    radius: 1.0,
  },
  {
    name: "Sunset",
    primary: { h: 25, s: 80, l: 55 },
    background: { h: 30, s: 50, l: 98 },
    accent: { h: 330, s: 70, l: 65 },
    radius: 0.3,
  },
]

export default function ThemesPage() {
  const [theme, setTheme] = useLocalStorage<Theme>("app-theme", PRESETS[0])

  React.useEffect(() => {
    if (typeof window !== "undefined" && theme) {
      const root = document.documentElement
      root.style.setProperty(
        "--primary",
        `${theme.primary.h} ${theme.primary.s}% ${theme.primary.l}%`
      )
      root.style.setProperty(
        "--background",
        `${theme.background.h} ${theme.background.s}% ${theme.background.l}%`
      )
      root.style.setProperty(
        "--accent",
        `${theme.accent.h} ${theme.accent.s}% ${theme.accent.l}%`
      )
      root.style.setProperty("--radius", `${theme.radius}rem`)
    }
  }, [theme])

  const handleColorChange = (
    colorType: "primary" | "background" | "accent",
    channel: "h" | "s" | "l",
    value: number
  ) => {
    if (!theme) return
    setTheme({
      ...theme,
      name: "Custom",
      [colorType]: {
        ...theme[colorType],
        [channel]: value,
      },
    })
  }

  const handleRadiusChange = (value: number[]) => {
    if (!theme) return
    setTheme({
      ...theme,
      name: "Custom",
      radius: value[0],
    })
  }

  const ColorSlider = ({
    label,
    colorType,
    channel,
    value,
    max,
  }: {
    label: string
    colorType: "primary" | "background" | "accent"
    channel: "h" | "s" | "l"
    value: number
    max: number
  }) => (
    <div className="space-y-2">
      <Label>
        {label} ({value})
      </Label>
      <Slider
        value={[value]}
        max={max}
        step={1}
        onValueChange={(val) => handleColorChange(colorType, channel, val[0])}
      />
    </div>
  )

  return (
    <AppLayout>
      <div className="flex-1 space-y-4 p-4 sm:p-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Themes</h1>
        </div>
        <div className="grid gap-8 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Paintbrush /> Customize
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="mb-4 text-lg font-medium">Presets</h3>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  {PRESETS.map((preset) => (
                    <Button
                      key={preset.name}
                      variant={
                        theme?.name === preset.name ? "default" : "outline"
                      }
                      onClick={() => setTheme(preset)}
                    >
                      {preset.name}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Colors</h3>
                <div className="space-y-4 rounded-md border p-4">
                  <h4 className="font-medium">Primary</h4>
                  <ColorSlider
                    label="Hue"
                    colorType="primary"
                    channel="h"
                    value={theme?.primary.h ?? 0}
                    max={360}
                  />
                  <ColorSlider
                    label="Saturation"
                    colorType="primary"
                    channel="s"
                    value={theme?.primary.s ?? 0}
                    max={100}
                  />
                  <ColorSlider
                    label="Lightness"
                    colorType="primary"
                    channel="l"
                    value={theme?.primary.l ?? 0}
                    max={100}
                  />
                </div>
                <div className="space-y-4 rounded-md border p-4">
                  <h4 className="font-medium">Background</h4>
                  <ColorSlider
                    label="Hue"
                    colorType="background"
                    channel="h"
                    value={theme?.background.h ?? 0}
                    max={360}
                  />
                  <ColorSlider
                    label="Saturation"
                    colorType="background"
                    channel="s"
                    value={theme?.background.s ?? 0}
                    max={100}
                  />
                  <ColorSlider
                    label="Lightness"
                    colorType="background"
                    channel="l"
                    value={theme?.background.l ?? 0}
                    max={100}
                  />
                </div>
                <div className="space-y-4 rounded-md border p-4">
                  <h4 className="font-medium">Accent</h4>
                  <ColorSlider
                    label="Hue"
                    colorType="accent"
                    channel="h"
                    value={theme?.accent.h ?? 0}
                    max={360}
                  />
                  <ColorSlider
                    label="Saturation"
                    colorType="accent"
                    channel="s"
                    value={theme?.accent.s ?? 0}
                    max={100}
                  />
                  <ColorSlider
                    label="Lightness"
                    colorType="accent"
                    channel="l"
                    value={theme?.accent.l ?? 0}
                    max={100}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Border Radius</h3>
                <div className="space-y-2 rounded-md border p-4">
                  <Label>Radius ({theme?.radius.toFixed(2)}rem)</Label>
                  <Slider
                    value={[theme?.radius ?? 0.75]}
                    max={2}
                    step={0.05}
                    onValueChange={handleRadiusChange}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <ThemePreview />
        </div>
      </div>
    </AppLayout>
  )
}
