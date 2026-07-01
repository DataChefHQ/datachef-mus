import '@testing-library/jest-dom'
import { vi } from 'vitest'

vi.mock('@stytch/react', () => ({
  useStytchUser: vi.fn(() => ({ user: null })),
}))
