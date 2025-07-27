// Search.js
import React from 'react'

export default function Search({ value, onChange }) {
  return (
    <input
      type="text"
      placeholder="Поиск..."
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="input input-bordered w-full max-w-md mb-4"
    />
  )
}
