import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import type { LinhaAmortizacao } from '../domain/types'
import { moeda } from '../utils/format'

interface Props {
  consorcioLinhas: LinhaAmortizacao[]
  financiamentoLinhas: LinhaAmortizacao[]
}

function buildData(c: LinhaAmortizacao[], f: LinhaAmortizacao[]) {
  const maxMes = Math.max(c.length, f.length)
  return Array.from({ length: maxMes }, (_, i) => ({
    mes: i + 1,
    saldoC: c[i] ? Math.max(0, c[i].saldoAjustado) : undefined,
    saldoF: f[i] ? Math.max(0, f[i].saldoAjustado) : undefined,
    parcelaC: c[i]?.parcela,
    parcelaF: f[i]?.parcela,
  }))
}

const tickFormatter = (v: number) => {
  if (v >= 1000000) return `R$${(v / 1000000).toFixed(1)}M`
  if (v >= 1000) return `R$${(v / 1000).toFixed(0)}k`
  return moeda(v)
}

export function Graficos({ consorcioLinhas, financiamentoLinhas }: Props) {
  const data = buildData(consorcioLinhas, financiamentoLinhas)

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* Saldo Devedor */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <p className="mb-3 text-sm font-semibold text-slate-700">Saldo Devedor Ajustado (IPCA)</p>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={data} margin={{ top: 4, right: 12, left: 0, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="mes" tick={{ fontSize: 10 }} label={{ value: 'Mês', position: 'insideBottom', offset: -2, fontSize: 10 }} />
            <YAxis tickFormatter={tickFormatter} tick={{ fontSize: 10 }} width={60} />
            <Tooltip formatter={(v: number) => moeda(v)} labelFormatter={(l) => `Mês ${l}`} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Line dataKey="saldoC" name="Consórcio" stroke="#3b82f6" dot={false} strokeWidth={2} connectNulls />
            <Line dataKey="saldoF" name="Financiamento" stroke="#f97316" dot={false} strokeWidth={2} connectNulls />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Parcela */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <p className="mb-3 text-sm font-semibold text-slate-700">Evolução da Parcela</p>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={data} margin={{ top: 4, right: 12, left: 0, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="mes" tick={{ fontSize: 10 }} label={{ value: 'Mês', position: 'insideBottom', offset: -2, fontSize: 10 }} />
            <YAxis tickFormatter={tickFormatter} tick={{ fontSize: 10 }} width={60} />
            <Tooltip formatter={(v: number) => moeda(v)} labelFormatter={(l) => `Mês ${l}`} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Line dataKey="parcelaC" name="Consórcio" stroke="#3b82f6" dot={false} strokeWidth={2} connectNulls />
            <Line dataKey="parcelaF" name="Financiamento" stroke="#f97316" dot={false} strokeWidth={2} connectNulls />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
