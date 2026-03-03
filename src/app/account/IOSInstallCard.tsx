import { Share2, PlusSquare, Smartphone } from 'lucide-react'

export function IOSInstallCard() {
  return (
    <div className="rounded-xl border p-5 space-y-3">
      <div className="flex items-center gap-2">
        <Smartphone className="h-4 w-4 text-orange-500 shrink-0" />
        <p className="text-sm font-semibold">Install on your iPhone</p>
      </div>
      <p className="text-sm text-muted-foreground">Open in Safari, then:</p>
      <ol className="space-y-2">
        <li className="flex items-center gap-3 text-sm">
          <span className="w-7 h-7 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
            <Share2 className="h-3.5 w-3.5 text-orange-600" />
          </span>
          Tap <strong>Share</strong> in Safari&apos;s toolbar
        </li>
        <li className="flex items-center gap-3 text-sm">
          <span className="w-7 h-7 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
            <PlusSquare className="h-3.5 w-3.5 text-orange-600" />
          </span>
          Tap <strong>Add to Home Screen</strong>
        </li>
      </ol>
    </div>
  )
}
