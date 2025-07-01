
"use client"

import * as React from "react"
import { Paintbrush, Save } from "lucide-react"

import { useLocalStorage } from "@/hooks/use-local-storage"
import { DEFAULT_THEME, PRESETS } from "@/lib/constants"
import type { Theme } from "@/lib/types"

import { AppLayout } from "@/components/app-layout"
import { ThemePreview } from "@/components/themes/theme-preview"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "@/hooks/use-toast"

export default function ThemesPage() {
  const [savedTheme, setSavedTheme] = useLocalStorage<Theme>(
    "app-theme",
    DEFAULT_THEME
  )
  const [draftTheme, setDraftTheme] = React.useState<Theme | null>(null)

  React.useEffect(() => {
    setDraftTheme(savedTheme)
  }, [savedTheme])

  const handleColorChange = (
    colorType: "primary" | "background" | "accent",
    channel: "h" | "s" | "l",
    value: number
  ) => {
    if (!draftTheme) return
    setDraftTheme({
      ...draftTheme,
      name: "Custom",
      [colorType]: {
        ...draftTheme[colorType],
        [channel]: value,
      },
    })
  }

  const handleRadiusChange = (value: number[]) => {
    if (!draftTheme) return
    setDraftTheme({
      ...draftTheme,
      name: "Custom",
      radius: value[0],
    })
  }

  const handleSaveChanges = () => {
    if (draftTheme) {
      setSavedTheme(draftTheme)
      toast({
        title: "Theme Saved",
        description: "Your new theme has been applied.",
      })
    }
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

  if (!draftTheme) {
    return (
      <AppLayout>
        <div className="flex-1 space-y-4 p-4 sm:p-8">
          <div className="flex items-center justify-between">
            <Skeleton className="h-9 w-48" />
          </div>
          <div className="grid gap-8 lg:grid-cols-2">
            <Skeleton className="h-[800px] w-full" />
            <Skeleton className="h-[700px] w-full" />
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="flex-1 space-y-4 p-4 sm:p-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Themes</h1>
          <Button onClick={handleSaveChanges}>
            <Save className="mr-2 h-4 w-4" /> Save Changes
          </Button>
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
                        draftTheme.name === preset.name ? "default" : "outline"
                      }
                      onClick={() => setDraftTheme(preset)}
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
                    value={draftTheme.primary.h}
                    max={360}
                  />
                  <ColorSlider
                    label="Saturation"
                    colorType="primary"
                    channel="s"
                    value={draftTheme.primary.s}
                    max={100}
                  />
                  <ColorSlider
                    label="Lightness"
                    colorType="primary"
                    channel="l"
                    value={draftTheme.primary.l}
                    max={100}
                  />
                </div>
                <div className="space-y-4 rounded-md border p-4">
                  <h4 className="font-medium">Background</h4>
                  <ColorSlider
                    label="Hue"
                    colorType="background"
                    channel="h"
                    value={draftTheme.background.h}
                    max={360}
                  />
                  <ColorSlider
                    label="Saturation"
                    colorType="background"
                    channel="s"
                    value={draftTheme.background.s}
                    max={100}
                  />
                  <ColorSlider
                    label="Lightness"
                    colorType="background"
                    channel="l"
                    value={draftTheme.background.l}
                    max={100}
                  />
                </div>
                <div className="space-y-4 rounded-md border p-4">
                  <h4 className="font-medium">Accent</h4>
                  <ColorSlider
                    label="Hue"
                    colorType="accent"
                    channel="h"
                    value={draftTheme.accent.h}
                    max={360}
                  />
                  <ColorSlider
                    label="Saturation"
                    colorType="accent"
                    channel="s"
                    value={draftTheme.accent.s}
                    max={100}
                  />
                  <ColorSlider
                    label="Lightness"
                    colorType="accent"
                    channel="l"
                    value={draftTheme.accent.l}
                    max={100}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Border Radius</h3>
                <div className="space-y-2 rounded-md border p-4">
                  <Label>Radius ({draftTheme.radius.toFixed(2)}rem)</Label>
                  <Slider
                    value={[draftTheme.radius]}
                    max={2}
                    step={0.05}
                    onValueChange={handleRadiusChange}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <ThemePreview theme={draftTheme} />
        </div>
      </div>
    </AppLayout>
  )
}
