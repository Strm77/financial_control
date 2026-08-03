import type { ReactNode } from 'react'
import './Sidebar.css'

export interface MenuItem {
  id: string
  label: string
  icon: ReactNode
}

interface SidebarProps {
  items: MenuItem[]
  activeId: string
  onSelect: (id: string) => void
}

export function Sidebar({ items, activeId, onSelect }: SidebarProps) {
  return (
    <nav className="liquid-glass sidebar" aria-label="Navegação principal">
      <div className="sidebar__brand">
        <span className="sidebar__mark">FC</span>
        <span className="sidebar__brand-name">Financial Control</span>
      </div>

      <ul className="sidebar__nav">
        {items.map((item) => {
          const isActive = item.id === activeId
          return (
            <li key={item.id}>
              <button
                type="button"
                className={`sidebar__item${isActive ? ' sidebar__item--active' : ''}`}
                onClick={() => onSelect(item.id)}
                aria-current={isActive ? 'page' : undefined}
              >
                <span className="sidebar__icon">{item.icon}</span>
                <span className="sidebar__label">{item.label}</span>
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
