import type { ReactNode } from 'react'
import './Sidebar.css'

export interface MenuItem {
  id: string
  label: string
  icon: ReactNode
}

interface SidebarProps {
  items: MenuItem[]
  footerItems?: MenuItem[]
  activeId: string
  onSelect: (id: string) => void
}

function renderItems(items: MenuItem[], activeId: string, onSelect: (id: string) => void) {
  return items.map((item) => {
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
  })
}

export function Sidebar({ items, footerItems, activeId, onSelect }: SidebarProps) {
  return (
    <nav className="neo-panel sidebar" aria-label="Navegação principal">
      <div className="sidebar__brand">
        <span className="sidebar__mark">FC</span>
        <span className="sidebar__brand-name">Financial Control</span>
      </div>

      <ul className="sidebar__nav">{renderItems(items, activeId, onSelect)}</ul>

      {footerItems && footerItems.length > 0 && (
        <div className="sidebar__footer">
          <div className="sidebar__divider" aria-hidden="true" />
          <ul className="sidebar__nav">{renderItems(footerItems, activeId, onSelect)}</ul>
        </div>
      )}
    </nav>
  )
}
