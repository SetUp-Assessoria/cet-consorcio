import { useState } from 'react'
import type { BaseReajuste, LanceMode, TaxaJurosMode, Indexador, ConsorcioParams, FinanciamentoParams } from '../domain/types'

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
  { key: 'fundoReserva', label: 'Fundo Reserva (total)', unit: '%', step: 0.001, min: 0, max: 0.1, isPercent: true },
  { key: 'seguro', label: 'Seguro Prestamista', unit: '%', step: 0.00001, min: 0, max: 0.01, isPercent: true },
  { key: 'ipca', label: 'IPCA (a.a.)', unit: '%', step: 0.001, min: 0, max: 0.3, isPercent: true },
  { key: 'parcelaLance', label: 'Parcela do Lance', unit: 'mês', step: 1, min: 1, max: 240 },
]

const FINANCIAMENTO_FIELDS: FieldDef[] = [
  { key: 'valorCarta', label: 'Valor do Bem', unit: 'R$', step: 1000, min: 1000, max: 10000000 },
  { key: 'parcelas', label: 'Nº Parcelas', unit: 'meses', step: 1, min: 12, max: 360 },
  { key: 'taxaMensal', label: 'Tarifa Mensal', unit: 'R$', step: 10, min: 0, max: 10000 },
  { key: 'fundoReserva', label: 'Fundo Reserva', unit: '%', step: 0.001, min: 0, max: 0.1, isPercent: true },
  { key: 'seguro', label: 'Seguro Prestamista', unit: '%', step: 0.001, min: 0, max: 0.1, isPercent: true },
]

const fmtBR = (v: number, casas = 2) =>
  v.toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas })

function Campo({ field, value, onChange }: { field: FieldDef; value: number; onChange: (v: number) => void }) {
  const [focused, setFocused] = useState(false)
  const [localStr, setLocalStr] = useState('')

  const rawDisplay = field.isPercent ? value * 100 : value
  const casas = field.isPercent ? 4 : (field.step < 1 ? 2 : 0)
  const formatted = fmtBR(rawDisplay, casas)

  return (
    <div className="flex flex-col gap-0.5">
      <label className="text-xs font-medium text-slate-500">{field.label}</label>
      <div className="flex items-center gap-1 rounded border border-slate-200 bg-white px-2 py-1 focus-within:border-blue-400">
        <input
          type="text"
          inputMode="decimal"
          value={focused ? localStr : formatted}
          onFocus={() => {
            setLocalStr(fmtBR(rawDisplay, casas))
            setFocused(true)
          }}
          onChange={(e) => setLocalStr(e.target.value)}
          onBlur={() => {
            setFocused(false)
            const parsed = parseFloat(localStr.replace(/\./g, '').replace(',', '.'))
            if (!isNaN(parsed)) onChange(field.isPercent ? parsed / 100 : parsed)
          }}
          className="w-full min-w-0 bg-transparent text-sm outline-none"
        />
        <span className="shrink-0 text-xs text-slate-400">{field.unit}</span>
      </div>
    </div>
  )
}

function CampoLance({
  lanceMode,
  lance,
  accentClass,
  borderClass,
  onModeChange,
  onLanceChange,
}: {
  lanceMode: LanceMode
  lance: number
  accentClass: string
  borderClass: string
  onModeChange: (m: LanceMode) => void
  onLanceChange: (v: number) => void
}) {
  const isPercent = lanceMode === 'percentual'
  const displayVal = isPercent ? +(lance * 100).toFixed(4) : lance

  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-slate-500">Lance</label>
        <div className={`flex rounded border ${borderClass} overflow-hidden text-xs`}>
          {(['percentual', 'financeiro'] as LanceMode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => {
                if (m === lanceMode) return
                // Reset lance to 0 when switching mode to avoid nonsensical values
                onLanceChange(0)
                onModeChange(m)
              }}
              className={`px-2 py-0.5 transition-colors ${
                lanceMode === m
                  ? `${accentClass} text-white font-medium`
                  : 'bg-white text-slate-500 hover:bg-slate-50'
              }`}
            >
              {m === 'percentual' ? '%' : 'R$'}
            </button>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-1 rounded border border-slate-200 bg-white px-2 py-1 focus-within:border-blue-400">
        <input
          type="number"
          step={isPercent ? 0.01 : 1000}
          min={0}
          max={isPercent ? 100 : undefined}
          value={displayVal}
          onChange={(e) => {
            const raw = parseFloat(e.target.value)
            if (isNaN(raw)) return
            onLanceChange(isPercent ? raw / 100 : raw)
          }}
          className="w-full min-w-0 bg-transparent text-sm outline-none"
        />
        <span className="shrink-0 text-xs text-slate-400">{isPercent ? '%' : 'R$'}</span>
      </div>
    </div>
  )
}

function CampoAdesao({
  mode, value, accentClass, borderClass, onModeChange, onChange,
}: {
  mode: LanceMode; value: number; accentClass: string; borderClass: string
  onModeChange: (m: LanceMode) => void; onChange: (v: number) => void
}) {
  const isPercent = mode === 'percentual'
  const displayVal = isPercent ? +(value * 100).toFixed(4) : value

  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-slate-500">Taxa Adesão</label>
        <div className={`flex rounded border ${borderClass} overflow-hidden text-xs`}>
          {(['percentual', 'financeiro'] as LanceMode[]).map((m) => (
            <button key={m} type="button"
              onClick={() => { onChange(0); onModeChange(m) }}
              className={`px-2 py-0.5 transition-colors ${mode === m ? `${accentClass} text-white font-medium` : 'bg-white text-slate-500 hover:bg-slate-50'}`}>
              {m === 'percentual' ? '%' : 'R$'}
            </button>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-1 rounded border border-slate-200 bg-white px-2 py-1 focus-within:border-blue-400">
        <input type="number" step={isPercent ? 0.001 : 100} min={0}
          value={displayVal}
          onChange={(e) => { const r = parseFloat(e.target.value); if (!isNaN(r)) onChange(isPercent ? r / 100 : r) }}
          className="w-full min-w-0 bg-transparent text-sm outline-none" />
        <span className="shrink-0 text-xs text-slate-400">{isPercent ? '%' : 'R$'}</span>
      </div>
    </div>
  )
}

function CampoTaxaJuros({
  taxaJuros,
  taxaJurosMode,
  onChange,
}: {
  taxaJuros: number
  taxaJurosMode: TaxaJurosMode
  onChange: (taxaJuros: number, mode: TaxaJurosMode) => void
}) {
  // taxaJuros armazenado sempre em a.m.; exibe convertido quando modo é anual
  const isAnual = taxaJurosMode === 'anual'
  const displayVal = isAnual
    ? +((Math.pow(1 + taxaJuros, 12) - 1) * 100).toFixed(4)
    : +(taxaJuros * 100).toFixed(4)

  const handleChange = (raw: number) => {
    const frac = raw / 100
    const mensal = isAnual ? Math.pow(1 + frac, 1 / 12) - 1 : frac
    onChange(mensal, taxaJurosMode)
  }

  const handleModeChange = (mode: TaxaJurosMode) => {
    onChange(taxaJuros, mode) // mantém a taxa mensal; só muda exibição
  }

  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-slate-500">Taxa de Juros</label>
        <div className="flex rounded border border-orange-200 overflow-hidden text-xs">
          {(['mensal', 'anual'] as TaxaJurosMode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => handleModeChange(m)}
              className={`px-2 py-0.5 transition-colors ${
                taxaJurosMode === m
                  ? 'bg-orange-500 text-white font-medium'
                  : 'bg-white text-slate-500 hover:bg-slate-50'
              }`}
            >
              {m === 'mensal' ? 'a.m.' : 'a.a.'}
            </button>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-1 rounded border border-slate-200 bg-white px-2 py-1 focus-within:border-blue-400">
        <input
          type="number"
          step={isAnual ? 0.01 : 0.001}
          min={0}
          value={displayVal}
          onChange={(e) => {
            const raw = parseFloat(e.target.value)
            if (!isNaN(raw)) handleChange(raw)
          }}
          className="w-full min-w-0 bg-transparent text-sm outline-none"
        />
        <span className="shrink-0 text-xs text-slate-400">%</span>
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
              value={(consorcioParams as unknown as Record<string, number>)[f.key]}
              onChange={(v) => onConsorcioChange({ ...consorcioParams, [f.key]: v })}
            />
          ))}
          <CampoAdesao
            mode={consorcioParams.taxaAdesaoMode}
            value={consorcioParams.taxaAdesao}
            accentClass="bg-blue-600"
            borderClass="border-blue-200"
            onModeChange={(m) => onConsorcioChange({ ...consorcioParams, taxaAdesaoMode: m, taxaAdesao: 0 })}
            onChange={(v) => onConsorcioChange({ ...consorcioParams, taxaAdesao: v })}
          />
          <CampoLance
            lanceMode={consorcioParams.lanceMode}
            lance={consorcioParams.lance}
            accentClass="bg-blue-600"
            borderClass="border-blue-200"
            onModeChange={(m) => onConsorcioChange({ ...consorcioParams, lanceMode: m, lance: 0 })}
            onLanceChange={(v) => onConsorcioChange({ ...consorcioParams, lance: v })}
          />
        </div>

        {/* Seletor de base do reajuste anual */}
        <div className="mt-3 flex flex-col gap-1">
          <p className="text-xs font-medium text-slate-500">Base do reajuste anual</p>
          <div className="flex gap-3">
            {([
              { value: 'totalContratado', label: 'Total contratado' },
              { value: 'valorCarta',      label: 'Valor da carta' },
            ] as { value: BaseReajuste; label: string }[]).map(({ value, label }) => (
              <label key={value} className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="baseReajuste"
                  value={value}
                  checked={consorcioParams.baseReajuste === value}
                  onChange={() => onConsorcioChange({ ...consorcioParams, baseReajuste: value })}
                  className="accent-blue-600"
                />
                <span className="text-xs text-slate-700">{label}</span>
              </label>
            ))}
          </div>
          <p className="mt-1 text-xs text-slate-400 leading-relaxed">
            {consorcioParams.baseReajuste === 'totalContratado'
              ? 'O índice reajusta carta + taxas (adm, fundo, seguro). Parcela e saldo crescem sobre o valor total — cenário mais conservador.'
              : 'O índice reajusta apenas o valor da carta. As taxas (adm, fundo, seguro) permanecem fixas no valor original — custo efetivo menor.'}
          </p>
        </div>
      </div>

      {/* Financiamento */}
      <div className="rounded-xl border border-orange-100 bg-orange-50 p-4">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-orange-700">Financiamento Imobiliário</h2>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {FINANCIAMENTO_FIELDS.map((f) => (
            <Campo
              key={f.key}
              field={f}
              value={(financiamentoParams as unknown as Record<string, number>)[f.key]}
              onChange={(v) => onFinanciamentoChange({ ...financiamentoParams, [f.key]: v })}
            />
          ))}
          <CampoTaxaJuros
            taxaJuros={financiamentoParams.taxaJuros}
            taxaJurosMode={financiamentoParams.taxaJurosMode}
            onChange={(taxa, mode) => onFinanciamentoChange({ ...financiamentoParams, taxaJuros: taxa, taxaJurosMode: mode })}
          />
        </div>

        {/* Indexador de reajuste */}
        <div className="mt-3 flex flex-col gap-1">
          <p className="text-xs font-medium text-slate-500">Indexador de reajuste anual</p>
          <div className="flex gap-3">
            {(['IPCA', 'INCC', 'TR'] as Indexador[]).map((idx) => (
              <label key={idx} className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="indexador"
                  value={idx}
                  checked={financiamentoParams.indexador === idx}
                  onChange={() => onFinanciamentoChange({ ...financiamentoParams, indexador: idx })}
                  className="accent-orange-500"
                />
                <span className="text-xs text-slate-700">{idx}</span>
              </label>
            ))}
          </div>
          <div className="mt-1">
            <Campo
              field={{ key: 'indiceAnual', label: 'Índice de Reajuste (a.a.)', unit: '%', step: 0.001, min: 0, max: 0.5, isPercent: true }}
              value={financiamentoParams.indiceAnual}
              onChange={(v) => onFinanciamentoChange({ ...financiamentoParams, indiceAnual: v })}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
