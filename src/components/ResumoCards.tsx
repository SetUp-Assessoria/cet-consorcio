import type { ResultadoSimulacao } from '../domain/types'
import { moeda, pct } from '../utils/format'

interface Props {
  consorcio: ResultadoSimulacao
  financiamento: ResultadoSimulacao
}

function Hint({ text }: { text: string }) {
  return (
    <div className="group relative ml-1 inline-block">
      <span className="cursor-default select-none text-[10px] text-slate-400 hover:text-slate-600">ℹ</span>
      <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 w-56 -translate-x-1/2 rounded bg-slate-800 px-2 py-1.5 text-[10px] leading-relaxed text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
        {text}
        <div className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-slate-800" />
      </div>
    </div>
  )
}

function Card({ label, hint, cVal, fVal, format, warn }: {
  label: string; hint: string; cVal: number; fVal: number
  format: (v: number) => string; warn?: boolean
}) {
  const cMenor = cVal < fVal
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
      <div className="mb-2 flex items-center gap-1">
        <p className="text-xs font-medium text-slate-500">{label}</p>
        <Hint text={hint} />
        {warn && (
          <span title="Créditos liberados diferentes — a comparação pode não estar nos mesmos parâmetros">
            ⚠️
          </span>
        )}
      </div>
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

function CardAjuste({ creditoConsorcio, creditoFinanciamento }: { creditoConsorcio: number; creditoFinanciamento: number }) {
  const diff = creditoConsorcio - creditoFinanciamento

  if (Math.abs(diff) < 1) {
    return <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-3" />
  }

  const diffAbs = Math.abs(diff)

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
      <p className="mb-1 text-[10px] font-semibold text-amber-700">⚠️ Bases diferentes</p>
      <p className="text-[10px] text-amber-800 leading-relaxed">
        Consórcio libera <strong>{moeda(creditoConsorcio)}</strong> e o financiamento <strong>{moeda(creditoFinanciamento)}</strong>{' '}
        (diferença de <strong>{moeda(diffAbs)}</strong>). Para uma comparação justa, ajuste os parâmetros de forma que
        o crédito liberado seja o mais próximo possível entre as duas modalidades.
      </p>
    </div>
  )
}

export function ResumoCards({ consorcio, financiamento }: Props) {
  const parcelaFinalC = consorcio.linhas[consorcio.linhas.length - 1]?.parcela ?? 0
  const parcelaFinalF = financiamento.linhas[financiamento.linhas.length - 1]?.parcela ?? 0
  const custoC = consorcio.totalPago - consorcio.creditoLiberado
  const custoF = financiamento.totalPago - financiamento.creditoLiberado
  const creditosDiferem = Math.abs(consorcio.creditoLiberado - financiamento.creditoLiberado) >= 1

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {/* L1 */}
      <Card
        label="Parcela Inicial"
        hint="Valor da primeira mensalidade antes de qualquer reajuste anual."
        cVal={consorcio.parcelaInicial} fVal={financiamento.parcelaInicial} format={moeda}
      />
      <Card
        label="CET estimado"
        hint="Custo Efetivo Total anualizado. O crédito é trazido a valor presente pelo IPCA (creditoPV = crédito ÷ (1+IPCA)^(k/12)) e posicionado em t=0 para calcular a TIR."
        cVal={consorcio.tirAnual} fVal={financiamento.tirAnual} format={pct}
      />
      <Card
        label="Crédito Liberado"
        hint="Valor efetivamente disponibilizado ao contratante após descontos de lance embutido e/ou próprio."
        cVal={consorcio.creditoLiberado} fVal={financiamento.creditoLiberado} format={moeda}
        warn={creditosDiferem}
      />
      <Card
        label="Valor pago − crédito"
        hint="Custo líquido do contrato: soma de todas as parcelas e lances pagos subtraída do crédito recebido. Representa quanto a mais você pagou além do bem."
        cVal={custoC} fVal={custoF} format={moeda}
      />
      {/* L2 */}
      <Card
        label="Parcela Final"
        hint="Valor da última mensalidade após todos os reajustes anuais pelo índice contratual."
        cVal={parcelaFinalC} fVal={parcelaFinalF} format={moeda}
      />
      <Card
        label="CET c/ custo de espera estimado¹"
        hint="CET base composto com a valorização esperada do bem acima do índice: (1 + CET) × (1 + valorização) − 1. Reflete o custo real de aguardar a contemplação enquanto o imóvel se valoriza."
        cVal={consorcio.tirAnualOpp ?? consorcio.tirAnual}
        fVal={financiamento.tirAnual}
        format={pct}
      />
      <Card
        label="Total Pago"
        hint="Soma de todas as parcelas mensais mais os lances próprios desembolsados ao longo do contrato."
        cVal={consorcio.totalPago} fVal={financiamento.totalPago} format={moeda}
      />
      <CardAjuste
        creditoConsorcio={consorcio.creditoLiberado}
        creditoFinanciamento={financiamento.creditoLiberado}
      />
    </div>
  )
}
