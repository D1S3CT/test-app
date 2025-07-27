// App.jsx
import React, { useState, useEffect, useCallback } from 'react'
import debounce from 'lodash.debounce'

import {
  fetchRecords,
  fetchState,
  postSelection,
  postSortOrder,
} from './hooks/api'
import Search from './components/Search'
import Table from './components/Table'

export default function App() {
  // Инициализация поиска со значением из localStorage (или пустой строкой)
  const initialSearch = localStorage.getItem('search') || ''
  const [search, setSearch] = useState(initialSearch)

  const [data, setData] = useState([]) // текущие записи, упорядоченные по sortOrder
  const [page, setPage] = useState(1) // текущая страница пагинации
  const [selectedIds, setSelectedIds] = useState(new Set()) // выбранные ID
  const [sortOrder, setSortOrder] = useState([]) // порядок ID записей
  const [loading, setLoading] = useState(false) // индикатор загрузки
  const [hasMore, setHasMore] = useState(true) // есть ли ещё записи для подгрузки

  // Инициализация: загрузка сохранённого состояния и первой страницы данных с учетом saved search
  useEffect(() => {
    async function init() {
      setLoading(true)
      try {
        const state = await fetchState()
        setSelectedIds(new Set(state.selectedIds))
        setSortOrder(state.sortOrder || [])

        const resp = await fetchRecords({
          page: 1,
          limit: 20,
          search: initialSearch,
          sortOrder: state.sortOrder || [],
        })
        setData(resp.data)
        setPage(1)
        setHasMore(resp.data.length === 20) // если меньше лимита, значит конец
      } catch (e) {
        console.error('Ошибка инициализации:', e)
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [initialSearch])

  // Загрузка страницы (пагинация, фильтрация, сортировка)
  const loadPage = useCallback(
    async (pageToLoad, searchValue = search, order = sortOrder) => {
      if (loading) return
      setLoading(true)
      try {
        const resp = await fetchRecords({
          page: pageToLoad,
          limit: 20,
          search: searchValue,
          sortOrder: order,
        })

        if (pageToLoad === 1) {
          setData(resp.data)
        } else {
          setData((prev) => [...prev, ...resp.data])
        }
        setPage(pageToLoad)
        setHasMore(resp.data.length === 20)
      } catch (error) {
        console.error('Ошибка загрузки данных:', error)
      } finally {
        setLoading(false)
      }
    },
    [search, sortOrder, loading]
  )

  // Дебаунс для обновления результата при поиске
  const debouncedSearch = useCallback(
    debounce((value) => {
      setPage(1)
      loadPage(1, value, sortOrder)
    }, 500),
    [loadPage, sortOrder]
  )

  // Обработчик изменения строки поиска
  const onSearchChange = (value) => {
    setSearch(value)
    localStorage.setItem('search', value) // сохраняем в localStorage
    debouncedSearch(value)
  }

  // Обработка выбора/снятия чекбокса
  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(id)) newSet.delete(id)
      else newSet.add(id)

      postSelection(Array.from(newSet)).catch(console.error)

      return newSet
    })
  }

  // Обработка окончания drag&drop — меняем порядок локально и отправляем серверу
  const onDragEnd = (newOrderIds) => {
    setSortOrder(newOrderIds)

    setData((prevData) => {
      const map = new Map(prevData.map((item) => [item.id, item]))
      return newOrderIds.map((id) => map.get(id)).filter(Boolean)
    })

    postSortOrder(newOrderIds).catch(console.error)
  }

  // Загрузка следующей страницы при скролле (если есть ещё данные)
  const handleLoadMore = () => {
    if (loading || !hasMore) return
    loadPage(page + 1, search, sortOrder)
  }

  return (
    <div className="container mx-auto p-4 min-h-screen">
      <h1 className="text-3xl font-bold mb-6">
        Список с перетаскиванием и сохранением
      </h1>
      <Search value={search} onChange={onSearchChange} />
      {loading && page === 1 && <p className="mb-4 text-center">Загрузка...</p>}
      <Table
        data={data}
        selectedIds={selectedIds}
        onToggleSelect={toggleSelect}
        onDragEnd={onDragEnd}
        onLoadMore={handleLoadMore}
      />
      {loading && page > 1 && <p className="mt-2 text-center">Загрузка...</p>}
      {!hasMore && (
        <p className="mt-4 text-center text-gray-500">Больше данных нет</p>
      )}
    </div>
  )
}
