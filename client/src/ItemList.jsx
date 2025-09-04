// client/src/ItemList.jsx
// Компонент отображает список элементов с сервера, по 20 штук с подгрузкой и выбором чекбоксами

import { useEffect, useState, useRef, useCallback } from 'react';

export default function ItemList() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selection, setSelection] = useState(new Set());
  const listRef = useRef(null);

  const fetchItems = useCallback(async () => {
    if (loading || (offset > 0 && items.length >= total)) return;
    setLoading(true);
    const res = await fetch(`http://localhost:4000/items?offset=${offset}&limit=20`);
    const data = await res.json();
    setItems(prev => [...prev, ...data.items]);
    setTotal(data.total);
    setOffset(prev => prev + 20);
    setLoading(false);
  }, [offset, loading, items.length, total]);

  useEffect(() => {
    fetchItems();
  }, []);

  // Получение актуального состояния order и выбора с сервера
  useEffect(() => {
    fetch('http://localhost:4000/state')
      .then(res => res.json())
      .then(data => {
        setSelection(new Set(data.selection));
      });
  }, []);

  // Подгрузка при скролле
  const handleScroll = () => {
    const el = listRef.current;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 10) {
      fetchItems();
    }
  };

  const toggleSelect = (id) => {
    const newSelection = new Set(selection);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelection(newSelection);
    // Обновляем состояние на сервере
    fetch('http://localhost:4000/state', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        order: items.map(i => i.id),
        selection: Array.from(newSelection),
      })
    });
  };

  return (
    <div>
      <h1>Список элементов</h1>
      <div
        ref={listRef}
        onScroll={handleScroll}
        style={{ height: '400px', overflowY: 'auto', border: '1px solid #ccc', padding: '10px' }}
      >
        {items.map(item => (
          <div key={item.id} style={{ display: 'flex', alignItems: 'center' }}>
            <input
              type="checkbox"
              checked={selection.has(item.id)}
              onChange={() => toggleSelect(item.id)}
            />
            <span style={{ marginLeft: '8px' }}>{item.id}</span>
          </div>
        ))}
        {loading && <p>Загрузка...</p>}
      </div>
    </div>
  );
}
