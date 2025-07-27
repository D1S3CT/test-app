// Table.jsx
import React, { useRef, useCallback } from 'react'
import { FixedSizeList as List } from 'react-window'
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd'

// Отдельный компонент строки, принимает draggable props
const Row = React.memo(({ index, style, data }) => {
  const item = data.items[index]
  const {
    selectedIds,
    onToggleSelect,
    providedDraggableProps,
    providedDragHandleProps,
    innerRef,
  } = data

  return (
    <div
      ref={innerRef}
      {...providedDraggableProps}
      {...providedDragHandleProps}
      style={{ ...style, ...providedDraggableProps.style }}
      className="flex items-center border-b border-base-300 p-3 hover:bg-base-200 transition-colors"
    >
      <input
        type="checkbox"
        className="checkbox checkbox-primary mr-4"
        checked={selectedIds.has(item.id)}
        onChange={() => onToggleSelect(item.id)}
      />
      <div className="flex-1 grid grid-cols-4 gap-4 text-sm">
        <div>
          <b>ID:</b> {item.id}
        </div>
        <div>
          <b>Имя:</b> {item.name}
        </div>
        <div>
          <b>Email:</b> {item.email}
        </div>
        <div>
          <b>Город:</b> {item.city}
        </div>
      </div>
    </div>
  )
})

export default function Table({
  data,
  selectedIds,
  onToggleSelect,
  onDragEnd,
  onLoadMore,
}) {
  const listRef = useRef()

  // Рендер строки с драггбл
  const renderRow = useCallback(
    ({ index, style }) => {
      const item = data[index]
      if (!item) return null

      return (
        <Draggable draggableId={item.id.toString()} index={index} key={item.id}>
          {(provided) => (
            <Row
              index={index}
              style={style}
              data={{
                items: data,
                selectedIds,
                onToggleSelect,
                providedDraggableProps: provided.draggableProps,
                providedDragHandleProps: provided.dragHandleProps,
                innerRef: provided.innerRef,
              }}
            />
          )}
        </Draggable>
      )
    },
    [data, selectedIds, onToggleSelect]
  )

  // Обработка окончания drag&drop
  const handleDragEnd = (result) => {
    if (!result.destination) return

    const items = Array.from(data)
    const [removed] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, removed)

    // Передаем вверх новый упорядоченный массив id
    onDragEnd(items.map((i) => i.id))
  }

  // Обработчик подгрузки по достижении почти конца списка
  const onItemsRendered = ({ visibleStopIndex }) => {
    if (visibleStopIndex >= data.length - 5) {
      onLoadMore()
    }
  }

  return (
    <div className="card bg-base-100 shadow-md rounded-box p-4">
      <h2 className="text-xl font-semibold mb-4">Список записей</h2>
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable
          droppableId="list"
          mode="virtual"
          renderClone={(provided, snapshot, rubric) => {
            return (
              <Row
                index={rubric.source.index}
                style={{}}
                data={{
                  items: data,
                  selectedIds,
                  onToggleSelect,
                  providedDraggableProps: provided.draggableProps,
                  providedDragHandleProps: provided.dragHandleProps,
                  innerRef: provided.innerRef,
                }}
              />
            )
          }}
        >
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="overflow-auto rounded-lg border border-base-300"
              style={{ height: 600 }}
            >
              {/* Заголовок таблицы */}
              <div className="grid grid-cols-[40px_repeat(4,minmax(0,1fr))] bg-base-200 sticky top-0 z-10 p-3 border-b border-base-300 font-semibold">
                <div></div> {/* Чекбокс-сетка */}
                <div>ID</div>
                <div>Имя</div>
                <div>Email</div>
                <div>Город</div>
              </div>

              <List
                height={600}
                itemCount={data.length}
                itemSize={70}
                width="100%"
                onItemsRendered={onItemsRendered}
                ref={listRef}
                itemData={{ items: data, selectedIds, onToggleSelect }}
              >
                {renderRow}
              </List>
              {/* В режиме virtual не рендерим provided.placeholder */}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  )
}
