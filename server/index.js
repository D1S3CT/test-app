const express = require('express')
const cors = require('cors')
const path = require('path')
const { faker } = require('@faker-js/faker')

const app = express()
const PORT = process.env.PORT || 3001
const HOST = '0.0.0.0'

// Временное хранилище в памяти
const storage = {
  records: [],
  selectionSet: new Set(),
  sortOrder: [],
}

app.listen(PORT, HOST, () => {
  console.log(`Server running on http://${HOST}:${PORT}`)
})

// Генерация записей
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

// Отдача статических файлов из client/my-vue-app/dist
const staticPath = path.join(__dirname, '..', 'client', 'my-vue-app', 'dist')
app.use(express.static(staticPath))

// --- API маршруты ---

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

function sortRecords(records, sortOrder) {
  if (!sortOrder || sortOrder.length === 0) return records

  const orderIndex = new Map()
  sortOrder.forEach((id, idx) => orderIndex.set(id, idx))

  return [...records].sort((a, b) => {
    const posA = orderIndex.has(a.id) ? orderIndex.get(a.id) : Infinity
    const posB = orderIndex.has(b.id) ? orderIndex.get(b.id) : Infinity
    if (posA !== posB) return posA - posB
    return a.id - b.id
  })
}

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

  let filtered = filterRecords(storage.records, search)
  filtered = sortRecords(
    filtered,
    clientSortOrder.length > 0 ? clientSortOrder : storage.sortOrder
  )

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

app.post('/api/state/sortorder', (req, res) => {
  const { sortOrder } = req.body
  if (!Array.isArray(sortOrder)) {
    return res.status(400).json({ error: 'sortOrder должен быть массивом' })
  }
  storage.sortOrder = sortOrder.filter((id) => Number.isInteger(id))
  res.json({ success: true })
})

app.get('/api/state', (req, res) => {
  res.json({
    selectedIds: Array.from(storage.selectionSet),
    sortOrder: storage.sortOrder,
  })
})

// --- Отдача React-приложения для не-API маршрутов ---

app.get('/*splat', (req, res) => {
  // Если путь начинается с /api — вернуть 404, чтобы не мешать API
  if (req.path.startsWith('/api')) {
    return res.status(404).send('API route not found')
  }
  // Отдаём index.html React-приложения
  res.sendFile(path.join(staticPath, 'index.html'))
})

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
