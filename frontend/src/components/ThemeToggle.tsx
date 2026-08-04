import { useTheme } from '../context/ThemeContext'
import { IconMoon, IconSun } from './icons'
import './ThemeToggle.css'

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggleTheme}
      aria-label={theme === 'light' ? 'Ativar modo escuro' : 'Ativar modo claro'}
      title={theme === 'light' ? 'Modo escuro' : 'Modo claro'}
    >
      {theme === 'light' ? <IconMoon width={17} height={17} /> : <IconSun width={17} height={17} />}
    </button>
  )
}
