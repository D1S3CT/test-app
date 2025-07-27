const express = require('express')
const cors = require('cors')
const { faker } = require('@faker-js/faker')

const app = express()
const PORT = 3001

// В развернутом проекте можно вынести storage в отдельный файл
const storage = {
  records: [],
  selectionSet: new Set(), // выбранные id
  sortOrder: [], // массив id в пользовательском порядке
}

// Генерация 1 000 000 записей при старте
function generateRecords() {
  const records = []
  for (let i = 1; i <= 1_000_000; i++) {
    records.push({
      id: i,
      name: faker.person.fullName(),
      email: faker.internet.email(),
      city: faker.location.city(),
    })
  }
  return records
}

storage.records = generateRecords()

app.use(cors())
app.use(express.json())

// Помощь для фильтрации по строке (поиск)
function filterRecords(records, search) {
  if (!search) return records
  const lowerSearch = search.toLowerCase()
  return records.filter(
    (r) =>
      r.name.toLowerCase().includes(lowerSearch) ||
      r.email.toLowerCase().includes(lowerSearch) ||
      r.city.toLowerCase().includes(lowerSearch) ||
      r.id.toString().includes(lowerSearch)
  )
}

// Сортировка с учётом сохранённого порядка
function sortRecords(records, sortOrder) {
  if (!sortOrder || sortOrder.length === 0) return records

  // Создать индекс для быстрого поиска позиции в sortOrder
  const orderIndex = new Map()
  sortOrder.forEach((id, idx) => orderIndex.set(id, idx))

  // Сортировать: записи с id в sortOrder идут в порядке sortOrder,
  // остальные идут в конце (по id)
  return [...records].sort((a, b) => {
    const posA = orderIndex.has(a.id) ? orderIndex.get(a.id) : Infinity
    const posB = orderIndex.has(b.id) ? orderIndex.get(b.id) : Infinity
    if (posA !== posB) return posA - posB

    // Для элементов вне списка сортируем по id
    return a.id - b.id
  })
}

// GET /api/records?page=1&limit=20&search=&sortOrder=1,2,3,...
app.get('/api/records', (req, res) => {
  const page = Math.max(parseInt(req.query.page) || 1, 1)
  const limit = Math.min(parseInt(req.query.limit) || 20, 100)
  const search = req.query.search || ''
  let clientSortOrder = []

  if (req.query.sortOrder) {
    clientSortOrder = req.query.sortOrder
      .split(',')
      .map(Number)
      .filter((id) => !isNaN(id))
  }

  // Фильтрация по поиску
  let filtered = filterRecords(storage.records, search)

  // Сортировка по клиентскому порядку (переопределяет порядок)
  filtered = sortRecords(
    filtered,
    clientSortOrder.length > 0 ? clientSortOrder : storage.sortOrder
  )

  // Пагинация
  const totalRecords = filtered.length
  const totalPages = Math.ceil(totalRecords / limit)
  const startIndex = (page - 1) * limit
  const pageRecords = filtered.slice(startIndex, startIndex + limit)

  res.json({
    page,
    limit,
    totalRecords,
    totalPages,
    data: pageRecords,
    selection: Array.from(storage.selectionSet),
    sortOrder: storage.sortOrder,
  })
})

// POST /api/state/selection  { selectedIds: [1,2,3] }
app.post('/api/state/selection', (req, res) => {
  const { selectedIds } = req.body
  if (!Array.isArray(selectedIds)) {
    return res.status(400).json({ error: 'selectedIds должен быть массивом' })
  }
  storage.selectionSet = new Set(
    selectedIds.filter((id) => Number.isInteger(id))
  )
  res.json({ success: true })
})

// POST /api/state/sortorder  { sortOrder: [1,2,3,...] }
app.post('/api/state/sortorder', (req, res) => {
  const { sortOrder } = req.body
  if (!Array.isArray(sortOrder)) {
    return res.status(400).json({ error: 'sortOrder должен быть массивом' })
  }
  storage.sortOrder = sortOrder.filter((id) => Number.isInteger(id))
  res.json({ success: true })
})

// GET /api/state - получить текущее состояние (выбор + сортировка)
app.get('/api/state', (req, res) => {
  res.json({
    selectedIds: Array.from(storage.selectionSet),
    sortOrder: storage.sortOrder,
  })
})

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
