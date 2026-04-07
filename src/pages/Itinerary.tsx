import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import Header from '../components/Header'
import type { Itinerary } from '../types/trip'

// ─── Mock data (Amalfi Coast — will be replaced by AI response) ───────────────
const MOCK: Itinerary = {
  destination: 'Amalfi Coast',
  subtitle: 'The Italian Coast',
  duration: 7,
  vibe: 'luxury',
  heroImageUrl:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuAPC4zr4zVv4OGwDwupZ933qmYE7fEp6ktcLyrGrFwOLsvIc6ZcLm_jW4-ScwlfHW5CKBAicHEG_Wbr59a0wmiBY1SV5qzOBmm3o5AoM68hFfLkZnRTzK-Zt6aX6Hbz7HtrHEDLmULdve-axeFSA5ti1qrSI30uougKlkTTVy3qlZ6iWIsbyrgAJyAQ1mebkpoh8NOlOqeDHUV3F6syGIqauyMtVjQoxlx4HN4LuBgNVMIlvfdhatHtoqEaq5xOE8eJaG34ZvVfCcSo',
  heroQuote: {
    text: 'The sea is the only language I understand.',
    author: 'Local Captain, Praiano',
  },
  days: [
    {
      day: 1,
      title: 'Arrival in Amalfi Town',
      description: 'Settle into the historic heart. Wander the Piazza del Duomo before a private twilight terrace dinner at Lo Smeraldino.',
      imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAAV0S3LACB-DmCZ-nD4QhIe0BnvLzba2e8x8NnSiFBSugytXVn5XWnxxEek7tSn__T7wu5N0VM9DW4SgQPAecsN06s_oV0XqgDas-QTLmGNT-Wxib-kFrl8V4vLRDclwORWGDMkmltdGGe88zIl3vhpaQqbdk3NG1bqHnG761wxR9tVOEF-qGWooYrYfhwITIh4VP-2XTryD5KL9F9emJsAErb2XJZDPwYhRWFTjmKG57Q1kSXEYcJ9IqClQK1Ic9024SSnJdPij0x',
      activities: [],
    },
    {
      day: 2,
      title: 'The Path of the Gods',
      description: 'Trek from Agerola to Nocelle at dawn. High-altitude views that touch the edge of the divine, followed by lunch in a family trattoria.',
      imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBuMPNrh-nuG4V3-NR86ACIHB7hdwuqnJ_uGAWiEUWrf-o0-oROfJbkM174_bfFgOOjI03B_7CedwZPWNxDZ1gkjtRxMZ1FHV6BwHbsXO7K1NBcVUrnZSm5ZwKjXslA7E_ahP1b7eeCbLVshtOZPfXdOjgvkjyp6ceh0sWFvrYHvM86ku3fpctvIxPhUQdDjLOiDnHl3xB4cj1Htkh0gafK4kFxl19WMGMozDKz7M5Cbl3TPl6_2dbELFwE9HNLozlnbX5V4dpfDxiM',
      activities: [],
    },
    {
      day: 3,
      title: 'Capri & the Blue Grotto',
      description: 'Charter a private gozzo at sunrise. Drift through the Blue Grotto, swim in hidden coves, and lunch at La Fontelina beach club.',
      imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAlbtOyHaVy7awFUrV2ZRhxsY1kz0aZ_ao2Nvw8tyTxuKWieMOZYtLKrhEA8WiAOH-t5E2s3MwGyitM6TKo4LQcVSvMiHsu0_VB45QLsQ9DY_0mOD0O5PJwQ9-CDPR2kXUremPJrTB4rSmaqHHJ46F2x2nRDwESJU6n9O2JGJmJpSQArknnWzm_WBd7HKUSLmG4Oo-Gla7SVd7IXOC8eq_6MOQxn3hWs-s-zMC8oemCzInxaZ_ZYrkWL_2zI9vVuvm-ugu7hIeSgYkl',
      activities: [],
    },
    {
      day: 4,
      title: 'Ravello & Villa Cimbrone',
      description: 'Ascend to the clifftop village of Ravello. Stroll the Terrace of Infinity, attend a summer concert at Villa Rufolo, and dine under the stars.',
      imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCrcAKxTyobY8LGgzZWOUyN5dNAg7zwXLRuZeqAmt2DljiStLosLuZxx9cItoF1cceSR-puB4T3-67rK7L9uGVyQIgaGnZL0OmC7W_EXdvc4R6VAHACmcvIwN9n9JPdBBUoPbEUOP2sSHt-Je5OsTNXNFHjRblHHDrPlbTMjxAXn7waGkp5JroIODUEWKY9q68A_qkf1rZoiJvjJPdVWxpi3QVp4G0pfRFdgnSu0HKeMD36os5OsTJGVBFoymrwFoXDf96u--cIbwTH',
      activities: [],
    },
    {
      day: 5,
      title: 'Positano & Spiaggia Grande',
      description: 'Lose the morning on Positano\'s iconic beach. Browse ceramic shops on Via dei Mulini, then sip negronis at Franco\'s Bar as the sun melts into the sea.',
      imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC2qlRpizS5k3GF1wBYo-E-ov_O4QcNXoed8CGHeikPv56bbBqzV_jQB-Mq9Xn1PrUUn08DleRA6LwPK3JaOxIGLokD9xVJHyq9bmaZQq7KBsu-yVzoh8Wv14YO81SplbhUc9j-4BWQd_RH3OqNruOB83AsfNj3mGXZxbFkcXaqB6_EHjnDWd2WV1P8B2WBDDW8obYhO9j2NTjopzgnzhpFdeExt8OHlTtDYPNOB1s9hnqs3sqx6BD64n8uvfSIBcSqPdBljtQ_aRQu',
      activities: [],
    },
    {
      day: 6,
      title: 'Praiano & Hidden Coves',
      description: 'Escape the crowds in Praiano, Positano\'s quieter twin. Find secret beaches only accessible by boat, and end the evening at a clifftop restaurant with a local family recipe.',
      imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDfo_ZHR4an7JdSEZcdbXg-dl7HVPR9we320h9T6suCGSTRO0_mBaWYl09sRj0bw0vSBxxwpEzH97Gjxxx0WU-VhubjBwffwr7zfrwfjz4kFgqshHPNvmMCUZ0dp07tOmLrPtHIFjfiWOYbjDDyqlrNCWqxIMhgE5t5sYgYKuW4oOoCBN5yXSh43mWI-5McXtD3ZQNq6Mgtq5emgDQb9JxdaNYy3yjB0mFTya348-eJt_ZzM20bBuv6NXGWl8QR2g4-E_NoUBxG5RyY',
      activities: [],
    },
    {
      day: 7,
      title: 'Farewell Morning in Amalfi',
      description: 'One last espresso at Bar delle Sirene, a final walk through the duomo cloisters, and a slow drive up the coast road before heading to Naples.',
      imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAPC4zr4zVv4OGwDwupZ933qmYE7fEp6ktcLyrGrFwOLsvIc6ZcLm_jW4-ScwlfHW5CKBAicHEG_Wbr59a0wmiBY1SV5qzOBmm3o5AoM68hFfLkZnRTzK-Zt6aX6Hbz7HtrHEDLmULdve-axeFSA5ti1qrSI30uougKlkTTVy3qlZ6iWIsbyrgAJyAQ1mebkpoh8NOlOqeDHUV3F6syGIqauyMtVjQoxlx4HN4LuBgNVMIlvfdhatHtoqEaq5xOE8eJaG34ZvVfCcSo',
      activities: [],
    },
  ],
  sight: {
    name: 'Spiaggia Grande',
    description:
      'The pulsating heart of Positano. A kaleidoscope of orange umbrellas and cobalt blue sea, framed by the vertical architecture of the gods.',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDfo_ZHR4an7JdSEZcdbXg-dl7HVPR9we320h9T6suCGSTRO0_mBaWYl09sRj0bw0vSBxxwpEzH97Gjxxx0WU-VhubjBwffwr7zfrwfjz4kFgqshHPNvmMCUZ0dp07tOmLrPtHIFjfiWOYbjDDyqlrNCWqxIMhgE5t5sYgYKuW4oOoCBN5yXSh43mWI-5McXtD3ZQNq6Mgtq5emgDQb9JxdaNYy3yjB0mFTya348-eJt_ZzM20bBuv6NXGWl8QR2g4-E_NoUBxG5RyY',
  },
  dining: {
    name: 'Chez Black',
    description:
      'Since 1949, the go-to spot for spaghetti with sea urchins and people-watching on the beachfront.',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuA7XeaDSYjWwMQGxshrAbqwF7QIqEL5Mc2T7HUCAgbngmGkdbdb6curvuiaMAuhtCBuQhPz5y5UUhrkc886zpxRc-qf0O-V_ikshqBuTTARmIewS5BrHG0iLfh9gK0OZGk3IzhaR2S076ugWiR8n-Rs5QtotvqQAipDDeCvia05Vcso92W2rYIk3LEtEs4t4J9Y0op9Ht1tlm68lb3GZEqm8qqiSDbcKRBScqmsXxHiaMkNJUETsBs3nYXgpXdGhjC3y7TmBrgVmFVZ',
  },
  stay: {
    name: 'Le Sirenuse',
    quote:
      '"A dream place that isn\'t quite real when you are there and becomes beckoningly real after you have gone." — John Steinbeck',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuA2_SF1DZEm085ibHmgphRnI-qCD96T-cVhFsVmKvgxDxSLskFQbV3c0W3koaEU48imbBjeJ-hZGlbs7GoE_F4EcOCDLPCcgWdqGg6hCF54wuNkMT7-hNQi7dZh7GAKlhSg1soOECW5f2ojLwhGQOhvxap5v6NUZD_4zzyiGzL53JWpZKoqTpMoYvmVUxcx7ye8I2lMwo9nznD8tYqPrNyPP_g7Z0PuCOAXGtbvc0vqz0rKfgQXqGFcgqGpT-9JFaXcZwglNEiWGLcA',
  },
  logistics: [
    { icon: 'flight', label: 'NAP International Airport (75 mins)' },
    { icon: 'directions_car', label: 'Private Chauffeur Included' },
    { icon: 'directions_boat', label: 'Daily Yacht Allocation' },
  ],
  bestTime: { months: 'May – Oct', reason: 'Warm seas, fewer crowds' },
  generalTips: [],
}

// ─── Mock #2: Rome (from LLMLayer) ────────────────────────────────────────────
const MOCK_ROME: Itinerary = {
  destination: 'Rome',
  subtitle: 'The Eternal City',
  duration: 3,
  vibe: 'mid-range',
  heroImageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCrcAKxTyobY8LGgzZWOUyN5dNAg7zwXLRuZeqAmt2DljiStLosLuZxx9cItoF1cceSR-puB4T3-67rK7L9uGVyQIgaGnZL0OmC7W_EXdvc4R6VAHACmcvIwN9n9JPdBBUoPbEUOP2sSHt-Je5OsTNXNFHjRblHHDrPlbTMjxAXn7waGkp5JroIODUEWKY9q68A_qkf1rZoiJvjJPdVWxpi3QVp4G0pfRFdgnSu0HKeMD36os5OsTJGVBFoymrwFoXDf96u--cIbwTH',
  heroQuote: {
    text: 'Rome is the city of echoes, the city of illusions, and the city of yearning.',
    author: 'Giotto di Bondone',
  },
  days: [
    {
      day: 1,
      title: "Monti's Secret Corners & Trastevere at Dusk",
      description: 'Start slow in the cobblestone lanes of Monti before crossing the Tiber as the light turns gold. No rushing, no queues — just the city as Romans know it.',
      imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBuMPNrh-nuG4V3-NR86ACIHB7hdwuqnJ_uGAWiEUWrf-o0-oROfJbkM174_bfFgOOjI03B_7CedwZPWNxDZ1gkjtRxMZ1FHV6BwHbsXO7K1NBcVUrnZSm5ZwKjXslA7E_ahP1b7eeCbLVshtOZPfXdOjgvkjyp6ceh0sWFvrYHvM86ku3fpctvIxPhUQdDjLOiDnHl3xB4cj1Htkh0gafK4kFxl19WMGMozDKz7M5Cbl3TPl6_2dbELFwE9HNLozlnbX5V4dpfDxiM',
      activities: [
        {
          name: 'Panificio Bonci',
          description: 'Freshly baked cornetto and a caffè macchiato at the bar — a beloved local spot, far from the tourist rush.',
          type: 'restaurant',
          timeOfDay: 'morning',
          priceRange: '€',
          address: 'Via Trionfale 36, 00187 Rome',
        },
        {
          name: 'Galleria Sciarra & Basilica di San Clemente',
          description: 'Wander into the tucked-away Galleria Sciarra for its Art Nouveau courtyard, then explore the three-layered history of San Clemente.',
          type: 'activity',
          timeOfDay: 'morning',
          address: 'Via Labicana 138, Rome',
        },
        {
          name: 'Osteria della Suburra',
          description: 'House-made pasta and a stellar cacio e pepe in a low-key, candle-lit setting.',
          type: 'restaurant',
          timeOfDay: 'afternoon',
          priceRange: '€€',
          address: 'Via in Arcione 19, 00186 Rome',
        },
        {
          name: 'Villa Torlonia',
          description: 'The Casa delle Civette offers an Art Nouveau wonderland; the surrounding gardens are a peaceful escape from the streets.',
          type: 'activity',
          timeOfDay: 'afternoon',
          address: 'Via Nomentana 70, Rome',
        },
        {
          name: 'VinAllegro',
          description: 'A tiny wine bar draped in ivy on Via della Lungaretta — perfect for a sunset aperitivo before dinner.',
          type: 'restaurant',
          timeOfDay: 'evening',
          priceRange: '€€',
          address: 'Via di S. Francesco a Ripa 106, 00153 Rome',
        },
        {
          name: 'La Tavernetta 29 da Tony e Andrea',
          description: 'Cacio e pepe and fried zucchini blossoms in an atmosphere that feels like a private family gathering.',
          type: 'restaurant',
          timeOfDay: 'evening',
          priceRange: '€€',
          address: 'Piazza di San Francesco a Ripa 30, 00153 Rome',
        },
      ],
    },
    {
      day: 2,
      title: 'Aventine Hill Views & Jewish Ghetto Charms',
      description: "A day between two of Rome's most atmospheric quarters — the ancient Jewish Ghetto and the hilltop silence of the Aventine.",
      imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDfo_ZHR4an7JdSEZcdbXg-dl7HVPR9we320h9T6suCGSTRO0_mBaWYl09sRj0bw0vSBxxwpEzH97Gjxxx0WU-VhubjBwffwr7zfrwfjz4kFgqshHPNvmMCUZ0dp07tOmLrPtHIFjfiWOYbjDDyqlrNCWqxIMhgE5t5sYgYKuW4oOoCBN5yXSh43mWI-5McXtD3ZQNq6Mgtq5emgDQb9JxdaNYy3yjB0mFTya348-eJt_ZzM20bBuv6NXGWl8QR2g4-E_NoUBxG5RyY',
      activities: [
        {
          name: 'Caffè Letterario',
          description: "Strong espresso on a terrace with a view of the Tiber's quiet morning flow.",
          type: 'restaurant',
          timeOfDay: 'morning',
          address: 'Via di San Francesco a Ripa 88, 00153 Rome',
        },
        {
          name: 'Jewish Ghetto walk',
          description: 'Wander the ancient streets, stop at Piperno for chocolate-filled pastries, and visit the Great Synagogue for its extraordinary mosaics.',
          type: 'activity',
          timeOfDay: 'morning',
          address: 'Via del Tempio di Giano 12, Rome',
        },
        {
          name: "Ba' Ghetto",
          description: "Artichoke pizza and seasonal antipasti showcasing the neighbourhood's culinary heritage.",
          type: 'restaurant',
          timeOfDay: 'afternoon',
          priceRange: '€€',
          address: "Via del Portico d'Africa 15, Rome",
        },
        {
          name: 'Keyhole of the Knights of Malta',
          description: "Peek through the famous keyhole on the Aventine for a perfectly framed view of St. Peter's dome — one of Rome's best kept secrets.",
          type: 'activity',
          timeOfDay: 'afternoon',
          address: 'Piazza dei Cavalieri di Malta, Rome',
        },
        {
          name: 'Giardino degli Aranci',
          description: "Sweeping panoramic views over the city's domes from the Orange Garden — the benches here are made for lingering.",
          type: 'activity',
          timeOfDay: 'afternoon',
        },
        {
          name: 'Ristorante Il Sanlorenzo',
          description: 'Fresh seafood in an elegant but unstuffy setting — the kind of dinner that stays with you.',
          type: 'restaurant',
          timeOfDay: 'evening',
          priceRange: '€€€',
          address: 'Via dei Chiavari 2, 00186 Rome',
        },
        {
          name: 'Furore',
          description: 'A hidden speakeasy in the Trastevere backstreets. Dim lighting, curated cocktails, and the right kind of intimacy.',
          type: 'activity',
          timeOfDay: 'evening',
          address: 'Via di San Francesco a Ripa 86, Rome',
        },
      ],
    },
    {
      day: 3,
      title: 'Testaccio Market, Cooking & Sunset on Janiculum',
      description: 'The most Roman day of the three — from a working-class market to an ancient hilltop with the whole city spread below you.',
      imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC2qlRpizS5k3GF1wBYo-E-ov_O4QcNXoed8CGHeikPv56bbBqzV_jQB-Mq9Xn1PrUUn08DleRA6LwPK3JaOxIGLokD9xVJHyq9bmaZQq7KBsu-yVzoh8Wv14YO81SplbhUc9j-4BWQd_RH3OqNruOB83AsfNj3mGXZxbFkcXaqB6_EHjnDWd2WV1P8B2WBDDW8obYhO9j2NTjopzgnzhpFdeExt8OHlTtDYPNOB1s9hnqs3sqx6BD64n8uvfSIBcSqPdBljtQ_aRQu',
      activities: [
        {
          name: 'Pasticceria Regoli',
          description: 'Their maritozzo — a sweet brioche split and filled with whipped cream — is a Roman morning ritual.',
          type: 'restaurant',
          timeOfDay: 'morning',
          priceRange: '€',
          address: 'Via dello Statuto 41, 00185 Rome',
        },
        {
          name: 'Testaccio Market',
          description: 'Browse stalls of fresh mozzarella, tomatoes, and cured meats. Grab a supplì from the market counter — fried rice balls, hot and salty.',
          type: 'activity',
          timeOfDay: 'morning',
          address: 'Via Galvani, Rome',
        },
        {
          name: 'Casa di Cucina cooking class',
          description: 'A hands-on session making authentic Roman pasta — carbonara, cacio e pepe — then eating what you made for lunch.',
          type: 'activity',
          timeOfDay: 'morning',
          address: 'Via di San Martino ai Monti 6, Rome',
        },
        {
          name: 'Tiber promenade walk',
          description: 'A gentle stroll from Ponte Sisto to Ponte Cestio, watching the city slow down in the afternoon heat.',
          type: 'activity',
          timeOfDay: 'afternoon',
        },
        {
          name: 'Janiculum Terrace at sunset',
          description: "The panoramic view over Rome's domes from the Gianicolo is spectacular — and the crowd is minimal at this hour.",
          type: 'activity',
          timeOfDay: 'evening',
        },
        {
          name: 'Osteria Fratelli Marrazzo',
          description: 'A tasting menu of seasonal Roman dishes in a cosy, candle-lit dining room — the right note to end on.',
          type: 'restaurant',
          timeOfDay: 'evening',
          priceRange: '€€',
          address: 'Via dei Giubbonari 16, 00186 Rome',
        },
      ],
    },
  ],
  sight: {
    name: 'Basilica di San Clemente',
    description: 'Three churches stacked on top of each other: a 12th-century basilica, a 4th-century church, and a 1st-century Mithraic temple below. Quiet, ancient, and completely overlooked by most visitors.',
    imageUrl: undefined,
  },
  dining: {
    name: 'Osteria della Suburra',
    description: 'Handmade pasta and Roman classics in a candlelit room in Monti. No tourist menus, no rushed service — exactly the kind of place you wish you had a regular table at.',
    imageUrl: undefined,
  },
  stay: {
    name: 'Hotel Santa Maria',
    quote: '"A 16th-century former convent in the heart of Trastevere, with a courtyard of orange trees and the sound of the neighbourhood at night."',
    imageUrl: undefined,
  },
  logistics: [
    { icon: 'flight', label: 'Fiumicino Airport — 45 min by train' },
    { icon: 'train', label: 'Leonardo Express to Termini — €14' },
    { icon: 'directions_walk', label: 'Trastevere & Monti best explored on foot' },
  ],
  bestTime: { months: 'Apr – Jun, Sep – Oct', reason: 'Mild weather, fewer tourists than summer' },
  generalTips: [
    'Book restaurants for dinner — Romans eat late, 8:30pm is normal',
    'Most churches are free and completely empty before 9am',
    'Trastevere gets loud after midnight — ask for a courtyard room',
    'Buy a day pass for buses rather than taxis — €1.50 and surprisingly efficient',
  ],
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function EditorialHero({
  itinerary,
  blurred,
  onToggleBlur,
}: {
  itinerary: Itinerary
  blurred: boolean
  onToggleBlur: () => void
}) {
  return (
    <section className="relative h-[80vh] min-h-[600px] overflow-hidden flex items-center px-8 md:px-20">
      {/* Background image */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-r from-[#f8f9fa] via-[#f8f9fa]/20 to-transparent z-10" />
        {itinerary.heroImageUrl && (
          <img
            src={itinerary.heroImageUrl}
            alt={itinerary.destination}
                  className={`w-full h-full object-cover transition-all duration-500 ${blurred ? 'blur-md scale-105' : ''}`}
          />
        )}
      </div>

      {/* Content */}
      <div className="relative z-20 max-w-4xl">
        <span className="inline-block px-4 py-1.5 rounded-full bg-[#fed65b] text-[#745c00] font-label text-[10px] uppercase tracking-widest font-bold mb-6">
          {itinerary.duration}-Day Journey · {itinerary.subtitle}
        </span>
        <h1 className="font-headline text-6xl md:text-8xl lg:text-9xl text-[#001e40] leading-[0.9] tracking-tighter mb-8 italic">
          {itinerary.destination}:<br />
          <span className="not-italic font-bold">Your Perfect<br />Journey</span>
        </h1>
        {/* Anti-spoiler toggle */}
        <button
          onClick={onToggleBlur}
          className="flex items-center gap-3 px-4 py-3 bg-[#edeeef] rounded-full"
        >
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#737780]">
            Anti-Spoiler
          </span>
            <div className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${blurred ? 'bg-[#001e40]' : 'bg-[#c3c6d1]/50'}`}>
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-300 ${blurred ? 'translate-x-6' : 'translate-x-0'}`} />
          </div>
        </button>
      </div>

      {/* Best time badge (desktop) */}
      {itinerary.bestTime && (
        <div className="absolute bottom-16 right-16 hidden lg:block z-30">
          <div className="bg-white/90 backdrop-blur rounded-2xl shadow-xl px-8 py-6">
            <p className="text-[10px] uppercase tracking-[0.25em] font-bold text-[#737780] mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">wb_sunny</span>
              Best Time to Visit
            </p>
            <p className="font-headline text-3xl font-bold text-[#001e40] leading-none">{itinerary.bestTime.months}</p>
            <p className="text-xs text-[#43474f] mt-2">{itinerary.bestTime.reason}</p>
          </div>
        </div>
      )}
    </section>
  )
}

function DayTimeline({ itinerary, blurred }: { itinerary: Itinerary; blurred: boolean }) {
  return (
    <section id="itinerary" className="py-24 overflow-x-clip">
      <div className="px-8 md:px-20 max-w-screen-2xl mx-auto flex flex-col md:flex-row justify-between items-baseline mb-16 gap-8">
        <div>
          <h2 className="font-headline text-5xl text-[#001e40] mb-3">
            The {itinerary.duration}-Day Rhythm
          </h2>
          <p className="text-[#43474f] max-w-md">
            An intentionally paced journey through coastal secrets and ancient echoes.
          </p>
        </div>
        <div className="hidden md:block h-px grow bg-[#c3c6d1]/20 mx-8 self-center" />
        <div className="flex gap-4 shrink-0">
          <button className="w-12 h-12 flex items-center justify-center rounded-full border border-[#c3c6d1]/30 text-[#737780] hover:bg-[#e7e8e9] transition-colors">
            <span className="material-symbols-outlined">chevron_left</span>
          </button>
          <button className="w-12 h-12 flex items-center justify-center rounded-full border border-[#c3c6d1]/30 text-[#737780] hover:bg-[#e7e8e9] transition-colors">
            <span className="material-symbols-outlined">chevron_right</span>
          </button>
        </div>
      </div>

      {/* Horizontal scroll track — px mirrors the section padding */}
      <div className="flex gap-8 overflow-x-auto pb-12 pt-8 snap-x no-scrollbar px-8 md:px-20">
        {itinerary.days.map((day, i) => (
          <div
            key={day.day}
          className={`flex-none w-[300px] md:w-[350px] snap-start ${i % 2 === 0 ? 'mt-12' : ''}`}
          >
            <div className="relative mb-8 group">
              {day.imageUrl && (
                <img
                  src={day.imageUrl}
                  alt={day.title}
                  className={`w-full aspect-[3/4] object-cover rounded-xl shadow-lg transition-all duration-500 ${blurred ? 'blur-md scale-[1.02]' : 'group-hover:scale-[1.02]'}`}
                />
              )}
              <div className="absolute -top-6 -left-4 font-headline text-7xl text-[#fed65b]/80 select-none leading-none pointer-events-none">
                {String(day.day).padStart(2, '0')}
              </div>
            </div>
            <h3 className="font-headline text-2xl text-[#001e40] mb-2">{day.title}</h3>
            <p className="text-sm text-[#43474f] leading-relaxed">{day.description}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

function CuratedSection({ itinerary, blurred }: { itinerary: Itinerary; blurred: boolean }) {
  if (!itinerary.sight && !itinerary.dining && !itinerary.stay) return null

  return (
    <section className="py-24 bg-[#f3f4f5] relative">
      <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-[#f8f9fa] to-transparent" />
      <div className="max-w-screen-2xl mx-auto px-8 md:px-20 relative z-10">
        <div className="mb-16">
          <h2 className="font-headline text-5xl text-[#001e40] mb-2">Curated Selection</h2>
          <p className="font-label uppercase tracking-widest text-[#735c00] font-bold text-sm">
            The Editorial Picks
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          {/* Sight — large hero card */}
          {itinerary.sight && (
            <div id="sight" className="md:col-span-8 bg-white rounded-xl overflow-hidden shadow-sm group">
              <div className="grid md:grid-cols-2 gap-0">
                <div className="aspect-square md:aspect-auto md:min-h-[380px] overflow-hidden">
                  <img
                    src={itinerary.sight.imageUrl}
                    alt={itinerary.sight.name}
                    className={`w-full h-full object-cover transition-all duration-500 ${blurred ? 'blur-md scale-105' : 'group-hover:scale-105'}`}
                  />
                </div>
                <div className="p-8 md:p-10 flex flex-col justify-center">
                  <span className="text-xs font-bold text-[#735c00] uppercase tracking-tighter mb-4">
                    Must-See Sight
                  </span>
                  <h3 className="font-headline text-4xl text-[#001e40] mb-6">{itinerary.sight.name}</h3>
                  <p className="text-[#43474f] mb-8 leading-relaxed">{itinerary.sight.description}</p>
                  <div className="flex gap-3 flex-wrap">
                    <button className="px-5 py-2.5 border border-[#c3c6d1]/30 rounded-full text-sm font-bold flex items-center gap-2 hover:bg-[#f8f9fa] transition-colors">
                      <span className="material-symbols-outlined text-sm">location_on</span>
                      Google Maps
                    </button>
                    <button className="px-5 py-2.5 border border-[#c3c6d1]/30 rounded-full text-sm font-bold flex items-center gap-2 hover:bg-[#f8f9fa] transition-colors">
                      <span className="material-symbols-outlined text-sm">language</span>
                      Website
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Dining — vertical card */}
          {itinerary.dining && (
            <div id="dining" className="md:col-span-4 bg-white p-8 rounded-xl shadow-sm md:mt-20">
              <img
                src={itinerary.dining.imageUrl}
                alt={itinerary.dining.name}
                className={`w-full aspect-video object-cover rounded-lg mb-6 transition-all duration-500 ${blurred ? 'blur-md' : ''}`}
              />
              <span className="text-xs font-bold text-[#735c00] uppercase tracking-tighter mb-2 block">
                Iconic Dining
              </span>
              <h3 className="font-headline text-3xl text-[#001e40] mb-4">{itinerary.dining.name}</h3>
              <p className="text-sm text-[#43474f] mb-6 leading-relaxed">{itinerary.dining.description}</p>
              <div className="flex flex-col gap-3">
                <button className="w-full py-3 bg-[#f8f9fa] border border-[#c3c6d1]/30 rounded-lg text-sm font-bold flex items-center justify-center gap-2 hover:bg-[#edeeef] transition-colors">
                  <span className="material-symbols-outlined text-sm">restaurant</span>
                  Reserve Table
                </button>
                <button className="w-full py-3 border border-[#c3c6d1]/30 rounded-lg text-sm font-bold flex items-center justify-center gap-2 hover:bg-[#f8f9fa] transition-colors">
                  <span className="material-symbols-outlined text-sm">location_on</span>
                  Map Directions
                </button>
              </div>
            </div>
          )}

          {/* Stay — full-width dark card */}
          {itinerary.stay && (
            <div id="stay" className="md:col-span-12 bg-[#001e40] text-white rounded-xl overflow-hidden flex flex-col md:flex-row mt-4">
              <div className="md:w-1/2 p-10 md:p-12 flex flex-col justify-center">
                <span className="text-xs font-bold text-[#fed65b] uppercase tracking-widest mb-4">
                  Ultimate Stay
                </span>
                <h3 className="font-headline text-5xl mb-6">{itinerary.stay.name}</h3>
                <p className="text-white/80 mb-8 text-lg leading-relaxed font-headline italic">
                  {itinerary.stay.quote}
                </p>
                <div className="flex gap-4 flex-wrap">
                  <button className="px-8 py-4 bg-[#fed65b] text-[#745c00] rounded-xl font-bold hover:brightness-110 transition-all">
                    Book The Experience
                  </button>
                  <button className="px-8 py-4 bg-white/10 backdrop-blur rounded-xl font-bold hover:bg-white/20 transition-all border border-white/20">
                    Official Gallery
                  </button>
                </div>
              </div>
              <div className="md:w-1/2 h-72 md:h-auto">
                <img
                  src={itinerary.stay.imageUrl}
                  alt={itinerary.stay.name}
                  className={`w-full h-full object-cover transition-all duration-500 ${blurred ? 'blur-md scale-105' : ''}`}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

function LogisticsSection({ itinerary }: { itinerary: Itinerary }) {
  if (!itinerary.logistics?.length) return null

  return (
    <section className="py-24 px-8 md:px-20 max-w-screen-2xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-16 items-center">
        <div className="space-y-6">
          <h4 className="font-headline text-3xl text-[#001e40]">Logistical Ease</h4>
          <p className="text-[#43474f]">
            Every detail coordinated, from transfers to boat moorings.
          </p>
          <ul className="space-y-4">
            {itinerary.logistics.map((item) => (
              <li key={item.label} className="flex items-center gap-4 text-sm font-bold">
                <span className="w-8 h-8 rounded-full bg-[#cfe5ff] flex items-center justify-center text-[#001d34]">
                  <span className="material-symbols-outlined text-lg">{item.icon}</span>
                </span>
                {item.label}
              </li>
            ))}
          </ul>
        </div>

        <div className="md:col-span-2 relative">
          <div className="aspect-video rounded-3xl overflow-hidden shadow-2xl relative bg-[#edeeef]">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="p-8 bg-white/90 backdrop-blur rounded-2xl shadow-xl max-w-sm text-center">
                <span className="material-symbols-outlined text-4xl text-[#735c00] mb-4 block">map</span>
                <h5 className="font-headline text-2xl text-[#001e40] mb-2">Interactive Map</h5>
                <p className="text-xs text-[#43474f] mb-6">
                  Explore the precise waypoints of your journey.
                </p>
                <button className="px-6 py-2 bg-[#001e40] text-white rounded-full text-xs font-bold">
                  Open Full Map
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ItineraryPage() {
  const [searchParams] = useSearchParams()
  const itinerary = searchParams.get('dest') === 'rome' ? MOCK_ROME : MOCK
  const [antiSpoiler, setAntiSpoiler] = useState(false)

  return (
    <div className="bg-[#f8f9fa] min-h-screen">
      <Header variant="explore" />
      <main className="pt-20">
        <EditorialHero itinerary={itinerary} blurred={antiSpoiler} onToggleBlur={() => setAntiSpoiler(v => !v)} />
        <DayTimeline itinerary={itinerary} blurred={antiSpoiler} />
        <CuratedSection itinerary={itinerary} blurred={antiSpoiler} />
        <LogisticsSection itinerary={itinerary} />
      </main>
    </div>
  )
}
