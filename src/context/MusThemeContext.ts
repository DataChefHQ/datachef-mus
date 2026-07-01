import { createContext, useContext } from 'react'

export const MusThemeContext = createContext<'light' | 'dark'>('dark')

export function useMusTheme(): 'light' | 'dark' {
  return useContext(MusThemeContext)
}
