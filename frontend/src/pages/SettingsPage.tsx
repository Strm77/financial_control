import { useState } from 'react'
import { OptionEditor } from '../components/OptionEditor'
import { useSelectOptions } from '../hooks/useSelectOptions'
import './SettingsPage.css'

const SETTINGS_TABS = [
  { id: 'renda', label: 'Renda' },
  { id: 'gasto-mes', label: 'Gasto Mês' },
  { id: 'dividas', label: 'Dívidas' },
  { id: 'pagamentos-mes', label: 'Pagamentos Mês' },
]

function IncomeSettingsPanel() {
  const { byField, addOption, removeOption } = useSelectOptions('renda')

  return (
    <div className="liquid-glass settings-card">
      <p className="settings-card__intro">
        Gerencie as opções disponíveis nos campos de seleção do menu Renda. Elas aparecem na hora de cadastrar uma
        nova renda.
      </p>
      <div className="settings-card__grid">
        <OptionEditor field="fonte" label="Fonte" options={byField('fonte')} onAdd={addOption} onRemove={removeOption} />
        <OptionEditor
          field="categoria"
          label="Categoria"
          options={byField('categoria')}
          onAdd={addOption}
          onRemove={removeOption}
        />
        <OptionEditor field="tipo" label="Tipo" options={byField('tipo')} onAdd={addOption} onRemove={removeOption} />
      </div>
    </div>
  )
}

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState('renda')
  const activeLabel = SETTINGS_TABS.find((tab) => tab.id === activeTab)?.label ?? ''

  return (
    <div className="settings-page">
      <div className="liquid-glass settings-tabs">
        {SETTINGS_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`settings-tab${tab.id === activeTab ? ' settings-tab--active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'renda' ? (
        <IncomeSettingsPanel />
      ) : (
        <div className="liquid-glass dashboard-placeholder">
          <p className="dashboard-placeholder__title">Configurações indisponíveis</p>
          <p className="dashboard-placeholder__text">As configurações de {activeLabel} ainda não estão disponíveis.</p>
        </div>
      )}
    </div>
  )
}
