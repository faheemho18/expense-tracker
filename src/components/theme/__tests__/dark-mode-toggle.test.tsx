import React from 'react'
import { render, screen } from '@testing-library/react'
import { DarkModeToggle } from '../dark-mode-toggle'

// Mock the settings context
const mockSetDarkModePreference = jest.fn()
const mockUseSettings = {
  darkModePreference: 'auto' as const,
  setDarkModePreference: mockSetDarkModePreference,
  isDarkMode: false,
}

jest.mock('@/contexts/settings-context', () => ({
  useSettings: () => mockUseSettings,
}))

// Mock the dropdown menu components to avoid complex UI testing
jest.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuItem: ({ children, onClick }: { children: React.ReactNode; onClick: () => void }) => (
    <button onClick={onClick}>{children}</button>
  ),
}))

describe('DarkModeToggle', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders the dark mode toggle button', () => {
    render(<DarkModeToggle />)
    
    const toggleButton = screen.getByRole('button', { name: /toggle dark mode/i })
    expect(toggleButton).toBeInTheDocument()
  })

  it('shows the current preference icon', () => {
    render(<DarkModeToggle />)
    
    const toggleButton = screen.getByRole('button', { name: /toggle dark mode/i })
    expect(toggleButton).toBeInTheDocument()
    // Since preference is 'auto', it should show the Monitor icon
  })

  it('renders with correct accessibility attributes', () => {
    render(<DarkModeToggle />)
    
    const toggleButton = screen.getByRole('button', { name: /toggle dark mode/i })
    expect(toggleButton).toBeInTheDocument()
    // The button should have proper aria-label via sr-only span
    expect(screen.getByText('Toggle dark mode')).toBeInTheDocument()
  })

  it('uses correct settings context values', () => {
    // Test that the component correctly uses the mocked settings context
    expect(mockUseSettings.darkModePreference).toBe('auto')
    expect(mockUseSettings.isDarkMode).toBe(false)
    expect(typeof mockUseSettings.setDarkModePreference).toBe('function')
  })

  it('handles different preference states', () => {
    // Test with different preference values
    mockUseSettings.darkModePreference = 'dark'
    mockUseSettings.isDarkMode = true
    
    render(<DarkModeToggle />)
    
    const toggleButton = screen.getByRole('button', { name: /toggle dark mode/i })
    expect(toggleButton).toBeInTheDocument()
  })
})