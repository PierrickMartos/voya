import { describe, expect, it } from 'vitest'
import { validateTripRequest } from './tripPreflight'

describe('validateTripRequest destination extraction', () => {
  it('returns the destination when a freeform request is qualified', async () => {
    const result = await validateTripRequest({
      mode: 'freeform',
      naturalLanguage: 'A relaxed food trip in Rome with my wife in May',
    })

    expect(result.ready).toBe(true)
    expect(result.destinationKnown).toBe(true)
    expect(result.destination).toBe('Rome')
    expect(result.missingFields).not.toContain('destination')
  })

  it('does not treat timing words as destinations', async () => {
    const result = await validateTripRequest({
      mode: 'freeform',
      naturalLanguage: 'A relaxed food trip with my wife in May',
    })

    expect(result.ready).toBe(false)
    expect(result.destinationKnown).toBe(false)
    expect(result.destination).toBe('')
    expect(result.missingFields).toContain('destination')
  })

  it('extracts multi-word capitalized destinations', async () => {
    const result = await validateTripRequest({
      mode: 'freeform',
      naturalLanguage: 'A luxury culture trip to Amalfi Coast with my wife next summer',
    })

    expect(result.ready).toBe(true)
    expect(result.destination).toBe('Amalfi Coast')
  })
})
