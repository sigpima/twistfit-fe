type ContrastCard = {
  title: string
  body: string
  accentClassName: string
  containerClassName?: string
}

type ContrastCardPairProps = {
  left: ContrastCard
  right: ContrastCard
}

export default function ContrastCardPair({ left, right }: ContrastCardPairProps) {
  return (
    <div className="grid grid-cols-1 gap-space-md md:grid-cols-2">
      {[left, right].map((card) => (
        <div
          key={card.title}
          className={`rounded-xl p-space-lg shadow-sm ${card.containerClassName ?? 'bg-surface-container-lowest'}`}
        >
          <h4 className={`text-headline-sm font-bold ${card.accentClassName}`}>{card.title}</h4>
          <p className="mt-space-xs text-body-md leading-relaxed text-on-surface-variant">{card.body}</p>
        </div>
      ))}
    </div>
  )
}
