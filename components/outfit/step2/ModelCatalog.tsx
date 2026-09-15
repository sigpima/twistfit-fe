'use client'

import { useOutfitFlow } from '../OutfitFlowProvider'
import type { CatalogModel } from '@/lib/modelCatalog'

export default function ModelCatalog({ models }: { models: CatalogModel[] }) {
  const { selectedModel, setSelectedModel } = useOutfitFlow()

  return (
    <div className="grid grid-cols-2 gap-space-md sm:grid-cols-3 md:grid-cols-4">
      {models.map((model) => {
        const isSelected = selectedModel.id === String(model.id)
        return (
          <button
            key={model.id}
            type="button"
            aria-pressed={isSelected}
            onClick={() =>
              setSelectedModel({
                id: String(model.id),
                name: model.name,
                image: model.image,
                sideImage: model.sideImage,
              })
            }
            className={`relative flex flex-col overflow-hidden rounded-2xl bg-surface-container-lowest text-left shadow-sm transition-all hover:shadow-md ${
              isSelected ? 'bg-gradient-to-b from-primary/5 to-secondary/10 shadow-lg' : ''
            }`}
          >
            {isSelected && (
              <div className="absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-on-primary shadow-md">
                <span className="material-symbols-outlined text-[18px]">check</span>
              </div>
            )}
            <div className="aspect-[3/4] w-full overflow-hidden bg-surface-container">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={model.image}
                alt={model.name}
                className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
              />
            </div>
            <div className="flex flex-col bg-surface-container-lowest p-space-sm">
              <span
                className={`text-label-lg font-semibold ${isSelected ? 'font-bold text-primary' : 'text-on-surface'}`}
              >
                {model.name}
              </span>
            </div>
          </button>
        )
      })}
    </div>
  )
}
