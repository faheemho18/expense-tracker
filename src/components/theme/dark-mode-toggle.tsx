"use client"

import * as React from "react"
import { Moon, Sun, Monitor } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useSettings } from "@/contexts/settings-context"
import { DarkModePreference } from "@/lib/dark-mode-utils"

const darkModeOptions: { 
  value: DarkModePreference
  label: string
  icon: React.ComponentType<{ className?: string }>
}[] = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'auto', label: 'Auto', icon: Monitor },
]

export function DarkModeToggle() {
  const { darkModePreference, setDarkModePreference, isDarkMode } = useSettings()

  const currentOption = darkModeOptions.find(option => option.value === darkModePreference)
  const CurrentIcon = currentOption?.icon || Monitor

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <CurrentIcon className="h-4 w-4" />
          <span className="sr-only">Toggle dark mode</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {darkModeOptions.map((option) => {
          const Icon = option.icon
          return (
            <DropdownMenuItem
              key={option.value}
              onClick={() => setDarkModePreference(option.value)}
              className="flex items-center gap-2"
            >
              <Icon className="h-4 w-4" />
              <span>{option.label}</span>
              {darkModePreference === option.value && (
                <span className="ml-auto text-xs text-muted-foreground">
                  {option.value === 'auto' ? (isDarkMode ? 'Dark' : 'Light') : ''}
                </span>
              )}
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}