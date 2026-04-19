import type { ResultadoSimulacao, ConsorcioParams } from '../domain/types'
import { moeda, pct } from '../utils/format'

interface Props {
  consorcio: ResultadoSimulacao
  financiamento: ResultadoSimulacao
  consorcioParams: ConsorcioParams
}

interface Metrica {
  label: string
  labelCurta: string
  consorcioVal: number
  financiamentoVal: number
  formatar: (v: number) => string
}

function wins(a: number, b: number): 'a' | 'b' | 'empate' {
  if (a < b) return 'a'
  if (b < a) return 'b'
  return 'empate'
}

export function DashboardDecisao({ consorcio, financiamento, consorcioParams }: Props) {
  const metricas: Metrica[] = [
    {
      label: 'CET estimado',
      labelCurta: 'CET estimado',
      consorcioVal: consorcio.tirAnual,
      financiamentoVal: financiamento.tirAnual,
      formatar: pct,
    },
    {
      label: 'CET c/ custo de espera',
      labelCurta: 'CET c/ espera',
      consorcioVal: consorcio.tirAnualOpp ?? consorcio.tirAnual,
      financiamentoVal: financiamento.tirAnualOpp ?? financiamento.tirAnual,
      formatar: pct,
    },
    {
      label: 'Total Pago',
      labelCurta: 'Total Pago',
      consorcioVal: consorcio.totalPago,
      financiamentoVal: financiamento.totalPago,
      formatar: moeda,
    },
    {
      label: 'Parcela Inicial',
      labelCurta: 'Parcela Inicial',
      consorcioVal: consorcio.parcelaInicial,
      financiamentoVal: financiamento.parcelaInicial,
      formatar: moeda,
    },
    {
      label: 'Custo líquido',
      labelCurta: 'Custo líquido',
      consorcioVal: consorcio.totalPago - consorcio.creditoLiberado,
      financiamentoVal: financiamento.totalPago - financiamento.creditoLiberado,
      formatar: moeda,
    },
  ]

  const resultados = metricas.map(m => wins(m.consorcioVal, m.financiamentoVal))
  const vitoriasCons = resultados.filter(r => r === 'a').length
  const vitoriasFinanc = resultados.filter(r => r === 'b').length
  const vencedor = vitoriasCons >= 3 ? 'Consórcio' : 'Financiamento'
  const vencedorEhCons = vencedor === 'Consórcio'
  const nVitorias = vencedorEhCons ? vitoriasCons : vitoriasFinanc

  const contemplacaoTardia = consorcioParams.parcelaContemplacao > 12

  return (
    <div className="space-y-5">
      {/* 1. Veredito */}
      <div
        className={`rounded-xl border-2 px-6 py-5 ${
          vencedorEhCons
            ? 'border-blue-400 bg-blue-50'
            : 'border-orange-400 bg-orange-50'
        }`}
      >
        <div className="flex items-start gap-3">
          <span
            className={`mt-0.5 text-xl font-bold ${
              vencedorEhCons ? 'text-blue-600' : 'text-orange-600'
            }`}
          >
            ✓
          </span>
          <div>
            <p
              className={`text-lg font-semibold ${
                vencedorEhCons ? 'text-blue-800' : 'text-orange-800'
              }`}
            >
              <span className="font-bold">{vencedor}</span> apresenta menor custo em{' '}
              <span className="font-bold">{nVitorias} de 5</span> critérios analisados
            </p>
            {contemplacaoTardia && (
              <p className="mt-2 text-sm text-slate-600">
                O consórcio contempla no mês {consorcioParams.parcelaContemplacao} — considere o prazo de espera.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 2. Tabela comparativa */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="px-4 py-3 text-left font-semibold text-slate-600">Critério</th>
              <th className="px-4 py-3 text-right font-semibold text-blue-700">Consórcio</th>
              <th className="px-4 py-3 text-right font-semibold text-orange-700">Financiamento</th>
              <th className="px-4 py-3 text-center font-semibold text-slate-600">Vantagem</th>
            </tr>
          </thead>
          <tbody>
            {metricas.map((m, i) => {
              const res = resultados[i]
              const consVence = res === 'a'
              const financVence = res === 'b'
              return (
                <tr key={m.label} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-3 font-medium text-slate-700">{m.label}</td>
                  <td
                    className={`px-4 py-3 text-right tabular-nums ${
                      consVence
                        ? 'font-semibold text-green-700'
                        : financVence
                        ? 'text-slate-400'
                        : 'text-slate-600'
                    }`}
                  >
                    {m.formatar(m.consorcioVal)}
                  </td>
                  <td
                    className={`px-4 py-3 text-right tabular-nums ${
                      financVence
                        ? 'font-semibold text-green-700'
                        : consVence
                        ? 'text-slate-400'
                        : 'text-slate-600'
                    }`}
                  >
                    {m.formatar(m.financiamentoVal)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {res === 'empate' ? (
                      <span className="inline-block rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
                        Empate
                      </span>
                    ) : consVence ? (
                      <span className="inline-block rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">
                        ● Consórcio
                      </span>
                    ) : (
                      <span className="inline-block rounded-full bg-orange-100 px-2 py-0.5 text-xs font-semibold text-orange-700">
                        ● Financ.
                      </span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* 3. Score visual */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-xl border border-blue-200 bg-blue-50 px-5 py-4">
          <p className="mb-2 text-sm font-semibold text-blue-800">
            Consórcio — {vitoriasCons}/5
          </p>
          <div className="flex gap-1.5">
            {Array.from({ length: 5 }, (_, i) => (
              <span
                key={i}
                className={`text-lg leading-none ${
                  i < vitoriasCons ? 'text-blue-600' : 'text-blue-200'
                }`}
              >
                {i < vitoriasCons ? '●' : '○'}
              </span>
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-orange-200 bg-orange-50 px-5 py-4">
          <p className="mb-2 text-sm font-semibold text-orange-800">
            Financiamento — {vitoriasFinanc}/5
          </p>
          <div className="flex gap-1.5">
            {Array.from({ length: 5 }, (_, i) => (
              <span
                key={i}
                className={`text-lg leading-none ${
                  i < vitoriasFinanc ? 'text-orange-500' : 'text-orange-200'
                }`}
              >
                {i < vitoriasFinanc ? '●' : '○'}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Cards situacionais */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-xl border border-blue-200 bg-blue-50 px-5 py-4">
          <p className="mb-3 text-sm font-semibold text-blue-800">
            Consórcio pode ser ideal se...
          </p>
          <ul className="space-y-1.5 text-sm text-blue-900">
            <li className="flex items-start gap-2">
              <span className="mt-0.5 shrink-0 text-blue-500">●</span>
              Não necessita do bem imediatamente
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 shrink-0 text-blue-500">●</span>
              Tem capital disponível para lance
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 shrink-0 text-blue-500">●</span>
              Busca menor custo efetivo no longo prazo
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 shrink-0 text-blue-500">●</span>
              Aceita parcelas com reajuste anual pelo índice contratual
            </li>
          </ul>
        </div>
        <div className="rounded-xl border border-orange-200 bg-orange-50 px-5 py-4">
          <p className="mb-3 text-sm font-semibold text-orange-800">
            Financiamento pode ser ideal se...
          </p>
          <ul className="space-y-1.5 text-sm text-orange-900">
            <li className="flex items-start gap-2">
              <span className="mt-0.5 shrink-0 text-orange-500">●</span>
              Necessita do bem imediatamente
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 shrink-0 text-orange-500">●</span>
              Prefere previsibilidade no fluxo de caixa
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 shrink-0 text-orange-500">●</span>
              Dispõe de boa entrada para reduzir o custo total
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 shrink-0 text-orange-500">●</span>
              Aceita pagar prêmio pelo acesso imediato ao crédito
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
