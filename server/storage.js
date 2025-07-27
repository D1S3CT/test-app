const { faker } = require('@faker-js/faker')

class Storage {
  constructor() {
    this.records = []
    this.selectionSet = new Set()
    this.sortOrder = []
    this._init()
  }

  // Инициализация с генерацией 1_000_000 записей
  _init() {
    console.log('Generating 1,000,000 records. This may take some time...')
    this.records = Array.from({ length: 1_000_000 }, (_, i) => ({
      id: i + 1,
      name: faker.person.fullName(),
      email: faker.internet.email(),
      city: faker.location.city(),
    }))
    console.log('Records generated.')
  }

  // Получить все записи (можно добавить тут фильтрацию/сортировку)
  getRecords() {
    return this.records
  }

  // Выборка выбранных id (Set => Array)
  getSelection() {
    return Array.from(this.selectionSet)
  }

  // Установить выбранные id (массив)
  setSelection(selectedIds) {
    this.selectionSet = new Set(selectedIds)
  }

  // Получить порядок сортировки (массив id)
  getSortOrder() {
    return this.sortOrder
  }

  // Установить порядок сортировки (массив id)
  setSortOrder(sortOrder) {
    this.sortOrder = sortOrder
  }
}

// Экспортируем один экземпляр класса (Singleton)
module.exports = new Storage()
