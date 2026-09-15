type FaqRelatedQuestionsProps = {
  heading: string
  items: { id: number; question: string }[]
  onSelect: (id: number) => void
}

export default function FaqRelatedQuestions({ heading, items, onSelect }: FaqRelatedQuestionsProps) {
  if (items.length === 0) return null

  return (
    <div className="mt-space-md border-t border-outline-variant pt-space-md">
      <h5 className="text-label-md font-semibold text-on-surface">{heading}</h5>
      <ul className="mt-space-xs space-y-1">
        {items.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => onSelect(item.id)}
              className="text-left text-body-sm text-primary hover:underline"
            >
              {item.question}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
