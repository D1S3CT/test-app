// App.js
import React, { useState, useEffect, useCallback } from 'react'
import debounce from 'lodash.debounce'

import { fetchRecords, fetchState, postSelection, postSortOrder } from './api'
import Search from './Search'
import Table from './Table'

function App() {
  const [data, setData] = useState([]) // загруженные записи
  const [page, setPage] = useState(1) // текущая страница
  const [search, setSearch] = useState('') // строка поиска
  const [selectedIds, setSelectedIds] = useState(new Set()) // выбранные id
  const [sortOrder, setSortOrder] = useState([]) // порядок сортировки
  const [loading, setLoading] = useState(false)

  // Загрузка сохранённого состояния и первой страницы при монтировании
  useEffect(() => {
    async function init() {
      try {
        setLoading(true)
        const state = await fetchState()
        setSelectedIds(new Set(state.selectedIds))
        setSortOrder(state.sortOrder || [])

        const recordsResp = await fetchRecords({
          page: 1,
          limit: 20,
          search: '',
          sortOrder: state.sortOrder || [],
        })
        setData(recordsResp.data)
        setPage(1)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [])

  // Функция подгрузки страницы (для пагинации и поиска)
  const loadPage = useCallback(
    async (pageToLoad, searchValue = search, order = sortOrder) => {
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
      } catch (error) {
        console.error('Ошибка загрузки данных:', error)
      } finally {
        setLoading(false)
      }
    },
    [search, sortOrder]
  )

  // Дебаунс поиск: обновлять данные с задержкой при вводе
  const debouncedSearch = useCallback(
    debounce((value) => {
      setPage(1)
      setData([])
      loadPage(1, value, sortOrder)
    }, 500),
    [loadPage, sortOrder]
  )

  // Обработчик изменения строки поиска
  const onSearchChange = (value) => {
    setSearch(value)
    debouncedSearch(value)
  }

  // Обработчик выбора одной записи (чекбокс)
  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(id)) newSet.delete(id)
      else newSet.add(id)

      // Отправляем изменения выбора на сервер
      postSelection(Array.from(newSet)).catch(console.error)

      return newSet
    })
  }

  // Обработчик изменения порядка сортировки через Drag&Drop
  const onDragEnd = (newOrderIds) => {
    setSortOrder(newOrderIds)
    postSortOrder(newOrderIds).catch(console.error)
  }

  // При скролле или запросе загрузить следующую страницу
  const handleLoadMore = () => {
    if (loading) return
    loadPage(page + 1, search, sortOrder)
  }

  return (
    <div>
      <Search value={search} onChange={onSearchChange} />
      {loading && <p>Загрузка...</p>}
      <Table
        data={data}
        selectedIds={selectedIds}
        onToggleSelect={toggleSelect}
        onDragEnd={onDragEnd}
        onLoadMore={handleLoadMore}
      />
    </div>
  )
}

export default App
