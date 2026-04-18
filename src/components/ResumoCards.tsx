import type { ResultadoSimulacao } from '../domain/types'
import { moeda, pct } from '../utils/format'

interface Props {
  consorcio: ResultadoSimulacao
  financiamento: ResultadoSimulacao
}

function Card({ label, cVal, fVal, format }: { label: string; cVal: number; fVal: number; format: (v: number) => string }) {
  const cMenor = cVal < fVal
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
      <p className="mb-2 text-xs font-medium text-slate-500">{label}</p>
      <div className="flex justify-between gap-2">
        <div className="text-center">
          <p className="text-[10px] text-blue-600 font-semibold">CONSÓRCIO</p>
          <p className={`text-sm font-bold ${cMenor ? 'text-green-600' : 'text-red-500'}`}>{format(cVal)}</p>
        </div>
        <div className="text-center">
          <p className="text-[10px] text-orange-600 font-semibold">FINANC.</p>
          <p className={`text-sm font-bold ${!cMenor ? 'text-green-600' : 'text-red-500'}`}>{format(fVal)}</p>
        </div>
      </div>
    </div>
  )
}

export function ResumoCards({ consorcio, financiamento }: Props) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <Card label="Parcela Inicial" cVal={consorcio.parcelaInicial} fVal={financiamento.parcelaInicial} format={moeda} />
      <Card label="Total Pago" cVal={consorcio.totalPago} fVal={financiamento.totalPago} format={moeda} />
      <Card label="Crédito Liberado" cVal={consorcio.creditoLiberado} fVal={financiamento.creditoLiberado} format={moeda} />
      <Card label="TIR Anual (CET)" cVal={consorcio.tirAnual} fVal={financiamento.tirAnual} format={pct} />
      <Card label="Saldo Inicial" cVal={consorcio.saldoDevedor} fVal={financiamento.saldoDevedor} format={moeda} />
    </div>
  )
}
