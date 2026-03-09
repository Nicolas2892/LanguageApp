import { Cormorant_Garamond, DM_Serif_Display } from 'next/font/google'
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

export default function BrandPreviewPage() {
  return (
    <div className={`${cormorant.variable} ${dmSerif.variable}`}>
      <BrandPreviewClient />
    </div>
  )
}
