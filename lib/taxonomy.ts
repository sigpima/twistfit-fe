export type TaxonomyValue = {
  id: number
  key: string
  label: string
  sortOrder: number
}

export type TaxonomyGroup = {
  id: number
  key: string
  label: string
  sortOrder: number
  values: TaxonomyValue[]
}

export function findGroup(groups: TaxonomyGroup[], key: string): TaxonomyGroup | undefined {
  return groups.find((group) => group.key === key)
}
