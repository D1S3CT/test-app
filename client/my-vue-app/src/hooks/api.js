// api.js

export async function fetchRecords({
  page,
  limit = 20,
  search = '',
  sortOrder = [],
}) {
  const params = new URLSearchParams({
    page,
    limit,
    search,
    sortOrder: sortOrder.join(','),
  })
  const res = await fetch(`/api/records?${params.toString()}`)
  if (!res.ok) throw new Error('Ошибка загрузки записей')
  return await res.json()
}

export async function fetchState() {
  const res = await fetch('/api/state')
  if (!res.ok) throw new Error('Ошибка загрузки состояния')
  return await res.json()
}

export async function postSelection(selectedIds) {
  const res = await fetch('/api/state/selection', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ selectedIds }),
  })
  if (!res.ok) throw new Error('Ошибка сохранения выбора')
  return await res.json()
}

export async function postSortOrder(sortOrder) {
  const res = await fetch('/api/state/sortorder', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sortOrder }),
  })
  if (!res.ok) throw new Error('Ошибка сохранения порядка сортировки')
  return await res.json()
}
