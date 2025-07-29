// server.js
// 🛠️ Простая заготовка Express-сервера для тестового задания

// Зачем: здесь будем реализовывать все REST API для работы с нашим списком из 1 000 000 элементов
// Нужен для: получения пачек элементов, сохранения/получения состояния сортировки и выбора

const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 4000;

// Позволит фронтенду обращаться к нашему API с другого порта
app.use(cors());
// Чтобы парсить JSON в теле POST-запросov
app.use(express.json());

// --------------------
//  In-memory storage
// --------------------
// На время жизни приложения храним:
// 1) порядок элементов (array of IDs)
// 2) выбранные элементы (Set of IDs)

// Изначально порядок — просто [1, 2, 3, ..., 1000000]
let order = Array.from({ length: 1_000_000 }, (_, i) => i + 1);
// Выбранные элементы: пустой Set
const selection = new Set();

// --------------------
//  GET /items
// --------------------
// Параметры: offset, limit, search
// Возвращаем упорядоченный кусок массива, отфильтрованный по поиску
app.get('/items', (req, res) => {
  const offset = parseInt(req.query.offset) || 0;
  const limit = parseInt(req.query.limit) || 20;
  const search = req.query.search?.toString().trim() || '';

  // Фильтрация по запросу (на стороне сервера, чтобы фронтенд получил уже готовую пачку)
  let filtered = order;
  if (search) {
    filtered = order.filter(id => id.toString().includes(search));
  }

  // Берём нужную страницу
  const page = filtered.slice(offset, offset + limit);

  // Отмечаем, выбран ли каждый элемент (для чекбоксов)
  const items = page.map(id => ({ id, selected: selection.has(id) }));

  res.json({ items, total: filtered.length });
});

// --------------------
//  GET /state
// --------------------
// Возвращает текущее состояние сортировки и выбора (для инициализации на фронтенде)
app.get('/state', (req, res) => {
  res.json({ order, selection: Array.from(selection) });
});

// --------------------
//  POST /state
// --------------------
// Принимаем { order: [...], selection: [...] }
// Сохраняем в памяти
app.post('/state', (req, res) => {
  const { order: newOrder, selection: newSel } = req.body;

  // Валидация: проверяем, что новые ID существуют
  if (
    Array.isArray(newOrder) &&
    Array.isArray(newSel) &&
    newOrder.every(id => typeof id === 'number' && id >= 1 && id <= 1_000_000) &&
    newSel.every(id => typeof id === 'number' && id >= 1 && id <= 1_000_000)
  ) {
    order = newOrder;
    selection.clear();
    newSel.forEach(id => selection.add(id));
    return res.status(200).json({ success: true });
  }

  res.status(400).json({ error: 'Invalid payload' });
});

// --------------------
//  Запуск сервера
// --------------------
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
