import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import Hero from './Hero'

// matchMedia is not available in jsdom
beforeEach(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: query.includes('768px') ? false : true,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  })
})

const renderHero = () =>
  render(
    <MemoryRouter>
      <Hero />
    </MemoryRouter>
  )

describe('Hero — freeform mode (default)', () => {
  it('shows the freeform textarea by default', () => {
    renderHero()
    expect(screen.getByText(/tell us about your dream trip/i)).toBeInTheDocument()
  })

  it('pre-fills the textarea with the default prompt', () => {
    renderHero()
    const textarea = screen.getByRole('textbox')
    expect((textarea as HTMLTextAreaElement).value).toMatch(/rome/i)
  })

  it('shows the "Free text" toggle label', () => {
    renderHero()
    expect(screen.getByText(/free text/i)).toBeInTheDocument()
  })
})

describe('Hero — toggle to guided mode', () => {
  it('switches to guided mode when the toggle is clicked', async () => {
    renderHero()
    const toggle = screen.getByRole('button', { name: /toggle input mode/i })
    await userEvent.click(toggle)
    expect(screen.getByText(/who are you and with whom/i)).toBeInTheDocument()
    expect(screen.getByText(/where to/i)).toBeInTheDocument()
    expect(screen.getByText(/the vibe/i)).toBeInTheDocument()
    expect(screen.getByText(/when/i)).toBeInTheDocument()
  })

  it('shows the "Guided" toggle label in guided mode', async () => {
    renderHero()
    const toggle = screen.getByRole('button', { name: /toggle input mode/i })
    await userEvent.click(toggle)
    expect(screen.getByText(/guided/i)).toBeInTheDocument()
  })

  it('switches back to freeform when toggled again', async () => {
    renderHero()
    await userEvent.click(screen.getByRole('button', { name: /toggle input mode/i }))
    await userEvent.click(screen.getByRole('button', { name: /toggle input mode/i }))
    expect(screen.getByText(/tell us about your dream trip/i)).toBeInTheDocument()
  })
})

describe('Hero — CTA', () => {
  it('renders the generate itinerary button', () => {
    renderHero()
    expect(
      screen.getByRole('button', { name: /generate my itinerary/i })
    ).toBeInTheDocument()
  })

  it('asks for the destination when it is missing from a freeform request', async () => {
    renderHero()
    const textarea = screen.getByRole('textbox')
    await userEvent.clear(textarea)
    await userEvent.type(textarea, 'A relaxed food trip with my wife in May')

    await userEvent.click(screen.getByRole('button', { name: /generate my itinerary/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/where you want to go/i)
  })

  it('asks for timing when it is missing from a freeform request', async () => {
    renderHero()
    const textarea = screen.getByRole('textbox')
    await userEvent.clear(textarea)
    await userEvent.type(textarea, 'A relaxed food trip in Rome with my wife')

    await userEvent.click(screen.getByRole('button', { name: /generate my itinerary/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/when you want to travel/i)
  })

  it('allows an open destination when the user asks Voya to choose', async () => {
    renderHero()
    const textarea = screen.getByRole('textbox')
    await userEvent.clear(textarea)
    await userEvent.type(textarea, 'Find a romantic food destination for me and my wife next summer')

    await userEvent.click(screen.getByRole('button', { name: /generate my itinerary/i }))

    expect(await screen.findByText(/curating your trip/i)).toBeInTheDocument()
  })
})
