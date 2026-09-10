import Link from 'next/link'

export default function HomePage() {
  return (
    <main className="flex h-[100dvh] w-full items-center justify-center bg-neutral-100">
      <Link
        href="/camera-frame"
        className="rounded-full bg-neutral-900 px-8 py-4 text-lg font-medium text-white"
      >
        Thử tính năng Camera Frame
      </Link>
    </main>
  )
}
