import type { ConsorcioParams, FinanciamentoParams } from '../domain/types'

type FieldDef = {
  key: string
  label: string
  unit: string
  step: number
  min: number
  max: number
  isPercent?: boolean
}

const CONSORCIO_FIELDS: FieldDef[] = [
  { key: 'valorCarta', label: 'Valor da Carta', unit: 'R$', step: 1000, min: 1000, max: 10000000 },
  { key: 'parcelas', label: 'Nº Parcelas', unit: 'meses', step: 1, min: 12, max: 240 },
  { key: 'taxaAdm', label: 'Taxa Adm (total)', unit: '%', step: 0.001, min: 0, max: 0.5, isPercent: true },
  { key: 'taxaAdesao', label: 'Taxa Adesão', unit: '%', step: 0.001, min: 0, max: 0.1, isPercent: true },
  { key: 'fundoReserva', label: 'Fundo Reserva (total)', unit: '%', step: 0.001, min: 0, max: 0.1, isPercent: true },
  { key: 'seguro', label: 'Seguro Prestamista', unit: '%', step: 0.00001, min: 0, max: 0.01, isPercent: true },
  { key: 'ipca', label: 'IPCA (a.a.)', unit: '%', step: 0.001, min: 0, max: 0.3, isPercent: true },
  { key: 'lance', label: 'Lance', unit: '%', step: 0.01, min: 0, max: 1, isPercent: true },
  { key: 'parcelaLance', label: 'Parcela do Lance', unit: 'mês', step: 1, min: 1, max: 240 },
]

const FINANCIAMENTO_FIELDS: FieldDef[] = [
  { key: 'valorCarta', label: 'Valor do Bem', unit: 'R$', step: 1000, min: 1000, max: 10000000 },
  { key: 'parcelas', label: 'Nº Parcelas', unit: 'meses', step: 1, min: 12, max: 360 },
  { key: 'taxaJuros', label: 'Taxa de Juros (a.m.)', unit: '%', step: 0.001, min: 0, max: 0.05, isPercent: true },
  { key: 'taxaAdesao', label: 'Taxa Adesão', unit: '%', step: 0.001, min: 0, max: 0.1, isPercent: true },
  { key: 'fundoReserva', label: 'Fundo Reserva', unit: '%', step: 0.001, min: 0, max: 0.1, isPercent: true },
  { key: 'seguro', label: 'Seguro Prestamista', unit: '%', step: 0.001, min: 0, max: 0.1, isPercent: true },
  { key: 'ipca', label: 'IPCA (a.a.)', unit: '%', step: 0.001, min: 0, max: 0.3, isPercent: true },
  { key: 'lance', label: 'Lance', unit: '%', step: 0.01, min: 0, max: 1, isPercent: true },
  { key: 'parcelaLance', label: 'Parcela do Lance (0=início)', unit: 'mês', step: 1, min: 0, max: 360 },
]

function Campo({ field, value, onChange }: { field: FieldDef; value: number; onChange: (v: number) => void }) {
  const displayVal = field.isPercent ? +(value * 100).toFixed(5) : value

  return (
    <div className="flex flex-col gap-0.5">
      <label className="text-xs font-medium text-slate-500">{field.label}</label>
      <div className="flex items-center gap-1 rounded border border-slate-200 bg-white px-2 py-1 focus-within:border-blue-400">
        <input
          type="number"
          step={field.isPercent ? +(field.step * 100).toFixed(6) : field.step}
          min={field.isPercent ? field.min * 100 : field.min}
          max={field.isPercent ? field.max * 100 : field.max}
          value={displayVal}
          onChange={(e) => {
            const raw = parseFloat(e.target.value)
            if (isNaN(raw)) return
            onChange(field.isPercent ? raw / 100 : raw)
          }}
          className="w-full min-w-0 bg-transparent text-sm outline-none"
        />
        <span className="shrink-0 text-xs text-slate-400">{field.unit}</span>
      </div>
    </div>
  )
}

interface Props {
  consorcioParams: ConsorcioParams
  onConsorcioChange: (p: ConsorcioParams) => void
  financiamentoParams: FinanciamentoParams
  onFinanciamentoChange: (p: FinanciamentoParams) => void
}

export function InputPanel({ consorcioParams, onConsorcioChange, financiamentoParams, onFinanciamentoChange }: Props) {
  return (
    <div className="grid grid-cols-2 gap-6">
      {/* Consórcio */}
      <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-blue-700">Consórcio</h2>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {CONSORCIO_FIELDS.map((f) => (
            <Campo
              key={f.key}
              field={f}
              value={(consorcioParams as Record<string, number>)[f.key]}
              onChange={(v) => onConsorcioChange({ ...consorcioParams, [f.key]: v })}
            />
          ))}
        </div>
      </div>

      {/* Financiamento */}
      <div className="rounded-xl border border-orange-100 bg-orange-50 p-4">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-orange-700">Financiamento</h2>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {FINANCIAMENTO_FIELDS.map((f) => (
            <Campo
              key={f.key}
              field={f}
              value={(financiamentoParams as Record<string, number>)[f.key]}
              onChange={(v) => onFinanciamentoChange({ ...financiamentoParams, [f.key]: v })}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
