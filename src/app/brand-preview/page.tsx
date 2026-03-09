import { Cormorant_Garamond, DM_Serif_Display, Plus_Jakarta_Sans } from 'next/font/google'
import { BrandPreviewClient } from './BrandPreviewClient'

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-cormorant',
})

const dmSerif = DM_Serif_Display({
  subsets: ['latin'],
  weight: ['400'],
  style: ['italic'],
  variable: '--font-dm-serif',
})

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-plus-jakarta',
})

export default function BrandPreviewPage() {
  return (
    <div className={`${cormorant.variable} ${dmSerif.variable} ${plusJakarta.variable}`}>
      <BrandPreviewClient />
    </div>
  )
}
