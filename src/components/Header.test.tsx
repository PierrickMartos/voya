import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect } from 'vitest'
import Header from './Header'

const renderHeader = (variant?: 'home' | 'explore') =>
  render(
    <MemoryRouter>
      <Header variant={variant} />
    </MemoryRouter>
  )

describe('Header', () => {
  it('renders the Voya logo', () => {
    renderHeader()
    expect(screen.getByText('Voya')).toBeInTheDocument()
  })

  it('renders navigation links', () => {
    renderHeader()
    expect(screen.getByText(/explore/i)).toBeInTheDocument()
    expect(screen.getByText(/how it works/i)).toBeInTheDocument()
  })

  it('does not render account button in home variant', () => {
    renderHeader('home')
    expect(screen.queryByLabelText(/account/i)).not.toBeInTheDocument()
  })

  it('renders account button in explore variant', () => {
    renderHeader('explore')
    expect(screen.getByLabelText(/account/i)).toBeInTheDocument()
  })
})
