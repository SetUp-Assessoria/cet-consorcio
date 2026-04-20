import { useMemo, useState } from 'react'
import type { ConsorcioParams } from '../domain/types'
import { calcularConsorcio } from '../domain/consorcio'
import { construirFluxoConsorcioTk } from '../domain/fluxo'
import { moeda, pct, num } from '../utils/format'
import { exportAuditoriaCET } from '../utils/export'

interface Props {
  consorcioParams: ConsorcioParams
}

function MetodoSection({
  numero, titulo, subtitulo, ativo, fallback,
  formula, passos, pros, contras,
}: {
  numero: number
  titulo: string
  subtitulo: string
  ativo: boolean
  fallback?: boolean
  formula: string
  passos: string[]
  pros: string[]
  contras: string[]
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className={`px-4 py-3 border-b border-slate-100 flex flex-wrap items-center gap-2 ${ativo ? 'bg-blue-50' : 'bg-slate-50'}`}>
        <span className="text-xs font-bold text-slate-400">{numero}.</span>
        <h3 className="text-sm font-semibold text-slate-700">{titulo}</h3>
        <span className="text-xs text-slate-400">{subtitulo}</span>
        {ativo && (
          <span className="ml-auto text-[10px] bg-blue-600 text-white rounded px-1.5 py-0.5 font-medium">
            metodologia ativa
          </span>
        )}
        {fallback && (
          <span className="ml-auto text-[10px] bg-amber-100 text-amber-700 border border-amber-200 rounded px-1.5 py-0.5 font-medium">
            ⚠ fallback PV ocorreu neste cenário
          </span>
        )}
      </div>

      <div className="p-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* Fórmula + Passo a passo */}
        <div className="sm:col-span-2 space-y-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-1">Fórmula</p>
            <pre className="text-xs bg-slate-50 border border-slate-200 rounded px-3 py-2 text-slate-700 whitespace-pre-wrap font-mono leading-relaxed">
              {formula}
            </pre>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-1">
              Passo a passo — cenário atual
            </p>
            <div className="space-y-1">
              {passos.map((p, i) => (
                <div
                  key={i}
                  className={`text-xs rounded px-2 py-1 font-mono ${
                    p.startsWith('⚠')
                      ? 'bg-amber-50 text-amber-700'
                      : 'bg-slate-50 text-slate-600'
                  }`}
                >
                  {p}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Vantagens e Limitações */}
        <div className="space-y-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-green-600 mb-1">
              Vantagens
            </p>
            <ul className="space-y-1.5">
              {pros.map((p, i) => (
                <li key={i} className="flex gap-1.5 text-xs text-slate-600">
                  <span className="text-green-500 shrink-0 font-bold mt-0.5">+</span>
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-red-500 mb-1">
              Limitações
            </p>
            <ul className="space-y-1.5">
              {contras.map((c, i) => (
                <li key={i} className="flex gap-1.5 text-xs text-slate-600">
                  <span className="text-red-400 shrink-0 font-bold mt-0.5">−</span>
                  <span>{c}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export function AbaMetodologias({ consorcioParams }: Props) {
  const [exportLoading, setExportLoading] = useState(false)

  const resultPV   = useMemo(() => calcularConsorcio({ ...consorcioParams, metodoCET: 'pv'   }), [consorcioParams])
  const resultTK   = useMemo(() => calcularConsorcio({ ...consorcioParams, metodoCET: 'tk'   }), [consorcioParams])
  const resultMIRR = useMemo(() => calcularConsorcio({ ...consorcioParams, metodoCET: 'mirr' }), [consorcioParams])

  const k              = consorcioParams.parcelaContemplacao
  const ipca           = consorcioParams.ipca
  const creditoLiberado = resultPV.creditoLiberado
  const creditoPV      = creditoLiberado / Math.pow(1 + ipca, k / 12)
  const parcelaK       = resultPV.linhas[k - 1]?.parcela ?? 0
  const lanceK         = resultPV.linhas[k - 1]?.lance ?? 0
  const fluxoKNet      = creditoLiberado - parcelaK - lanceK
  const taxaOpMensal   = Math.pow(1 + consorcioParams.taxaOportunidadeAnual, 1 / 12) - 1
  const ativo          = consorcioParams.metodoCET

  const { fvTotal, pvTotal } = useMemo(() => {
    const fluxoTk   = construirFluxoConsorcioTk(resultPV.linhas, creditoLiberado, k)
    const fluxoMirr = fluxoTk.map(v => -v)
    const n         = fluxoMirr.length - 1
    let fv = 0, pv = 0
    fluxoMirr.forEach((v, t) => {
      if (v > 0) fv += v * Math.pow(1 + taxaOpMensal, n - t)
      else if (v < 0) pv += Math.abs(v) / Math.pow(1 + taxaOpMensal, t)
    })
    return { fvTotal: fv, pvTotal: pv }
  }, [resultPV.linhas, creditoLiberado, k, taxaOpMensal])

  const handleExport = async () => {
    setExportLoading(true)
    try { await exportAuditoriaCET(consorcioParams) }
    finally { setExportLoading(false) }
  }

  return (
    <div className="space-y-6">
      {/* Comparativo topo */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-slate-700">Comparativo — Cenário Atual</h2>
          <button
            onClick={handleExport}
            disabled={exportLoading}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 active:scale-95 transition-transform disabled:opacity-60"
          >
            {exportLoading ? 'Gerando...' : 'Exportar Auditoria Excel'}
          </button>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {/* PV */}
          <div className={`rounded-lg border p-3 ${ativo === 'pv' ? 'border-blue-300 bg-blue-50' : 'border-slate-200'}`}>
            <div className="flex flex-wrap items-center gap-1.5 mb-1">
              <span className="text-xs font-semibold text-slate-600">PV por Índice</span>
              {ativo === 'pv' && (
                <span className="text-[10px] bg-blue-600 text-white rounded px-1 font-medium">ativo</span>
              )}
            </div>
            <p className="text-xl font-bold text-slate-800">{pct(resultPV.tirAnual)}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">CET a.a.</p>
            <p className="text-[10px] text-slate-400">{pct(resultPV.tirMensal)} a.m.</p>
          </div>

          {/* t=k */}
          <div className={`rounded-lg border p-3 ${ativo === 'tk' ? 'border-blue-300 bg-blue-50' : 'border-slate-200'}`}>
            <div className="flex flex-wrap items-center gap-1.5 mb-1">
              <span className="text-xs font-semibold text-slate-600">t=k Real</span>
              {ativo === 'tk' && (
                <span className="text-[10px] bg-blue-600 text-white rounded px-1 font-medium">ativo</span>
              )}
              {resultTK.metodoCETFallback && (
                <span className="text-[10px] text-amber-600 font-medium">⚠ fallback PV</span>
              )}
            </div>
            <p className="text-xl font-bold text-slate-800">{pct(resultTK.tirAnual)}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">CET a.a.</p>
            <p className="text-[10px] text-slate-400">{pct(resultTK.tirMensal)} a.m.</p>
          </div>

          {/* MIRR */}
          <div className={`rounded-lg border p-3 ${ativo === 'mirr' ? 'border-blue-300 bg-blue-50' : 'border-slate-200'}`}>
            <div className="flex flex-wrap items-center gap-1.5 mb-1">
              <span className="text-xs font-semibold text-slate-600">MIRR</span>
              {ativo === 'mirr' && (
                <span className="text-[10px] bg-blue-600 text-white rounded px-1 font-medium">ativo</span>
              )}
              <span className="text-[10px] text-slate-400">taxa op. {pct(consorcioParams.taxaOportunidadeAnual)}</span>
            </div>
            <p className="text-xl font-bold text-slate-800">{pct(resultMIRR.tirAnual)}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">CET a.a.</p>
            <p className="text-[10px] text-slate-400">{pct(resultMIRR.tirMensal)} a.m.</p>
          </div>
        </div>
      </div>

      {/* 1. PV */}
      <MetodoSection
        numero={1}
        titulo="PV por Índice"
        subtitulo="Crédito descontado ao índice de reajuste e posicionado em t=0"
        ativo={ativo === 'pv'}
        formula={[
          `creditoPV = creditoLiberado ÷ (1 + índice)^(k/12)`,
          `fluxo    = [+creditoPV, −p₁, −p₂, ..., −pₙ]`,
          `CET      = (1 + TIR(fluxo))^12 − 1`,
        ].join('\n')}
        passos={[
          `Crédito liberado:  ${moeda(creditoLiberado)}`,
          `Índice de reajuste: ${pct(ipca)} a.a.   |   k = ${k} (mês de contemplação)`,
          `creditoPV = ${moeda(creditoLiberado)} ÷ (1 + ${num(ipca * 100, 2)}%)^(${k}/12) = ${moeda(creditoPV)}`,
          `Fluxo: [+${moeda(creditoPV)}, −p₁, −p₂, ..., −p${consorcioParams.parcelas}]`,
          `TIR mensal = ${pct(resultPV.tirMensal)}   →   CET anual = ${pct(resultPV.tirAnual)}`,
        ]}
        pros={[
          'Sempre converge — fluxo tem exatamente uma troca de sinal',
          'Comparável diretamente com o financiamento (ambos posicionam o crédito em t=0)',
          'Resultado estável, sem premissa externa de taxa',
          'Representa o piso conservador do custo efetivo',
        ]}
        contras={[
          `Desconta pelo índice de reajuste (${pct(ipca)}/a.a.), não pelo custo real de capital`,
          'Subestima o CET quando a TIR real do contrato é maior que o índice',
          'Crédito em t=0 é fictício — na prática o consorciado recebe em t=k',
          'Custo real de espera só aparece parcialmente no campo "CET c/ custo de espera"',
        ]}
      />

      {/* 2. t=k */}
      <MetodoSection
        numero={2}
        titulo="t=k Real"
        subtitulo="Crédito posicionado no mês real da contemplação"
        ativo={ativo === 'tk'}
        fallback={resultTK.metodoCETFallback}
        formula={[
          `fluxo[0]   = 0`,
          `fluxo[t]   = −(parcela_t + lance_t)   para t ≠ k`,
          `fluxo[k]  += creditoLiberado           (crédito entra no mês real)`,
          `CET        = (1 + TIR(fluxo))^12 − 1`,
        ].join('\n')}
        passos={
          resultTK.metodoCETFallback
            ? [
                `Crédito liberado: ${moeda(creditoLiberado)}   |   k = ${k}`,
                `Fluxo[${k}] = ${moeda(creditoLiberado)} − ${moeda(parcelaK + lanceK)} = ${moeda(fluxoKNet)}`,
                `⚠ TIR não convergiu — IRR retornou NaN (sem troca de sinal no fluxo para este cenário)`,
                `Fallback automático para metodologia PV → CET = ${pct(resultTK.tirAnual)}`,
              ]
            : [
                `Crédito liberado: ${moeda(creditoLiberado)}   |   k = ${k}`,
                `Parcela no mês k: ${moeda(parcelaK)}${lanceK > 0 ? `   |   Lance: ${moeda(lanceK)}` : ''}`,
                `Fluxo[${k}] = ${moeda(creditoLiberado)} − ${moeda(parcelaK + lanceK)} = ${moeda(fluxoKNet)}`,
                `Fluxo: [0, −p₁, ..., −p${k - 1}, +${moeda(fluxoKNet)}, −p${k + 1}, ..., −p${consorcioParams.parcelas}]`,
                `TIR mensal = ${pct(resultTK.tirMensal)}   →   CET anual = ${pct(resultTK.tirAnual)}`,
              ]
        }
        pros={[
          'Representa o fluxo que o consorciado realmente experimenta mês a mês',
          'Captura integralmente o custo de esperar k meses antes de receber o bem',
          'Não exige premissa externa de taxa ou fator de desconto',
          'Mais rigoroso que PV quando o custo de capital supera o índice de reajuste',
        ]}
        contras={[
          'Pode não convergir — IRR exige troca de sinal (crédito > parcela_k)',
          'Fallback automático para PV pode mascarar cenários problemáticos',
          'Fluxo começa em 0 (sem desembolso em t=0), o que pode gerar múltiplas raízes em casos raros',
          'Não comparável diretamente com o financiamento, que posiciona o crédito em t=0',
        ]}
      />

      {/* 3. MIRR */}
      <MetodoSection
        numero={3}
        titulo="MIRR"
        subtitulo="Taxa Interna de Retorno Modificada — perspectiva do credor"
        ativo={ativo === 'mirr'}
        formula={[
          `fluxoMirr = −fluxoTk  (perspectiva do credor: parcelas = entrada, crédito = saída)`,
          `FV = Σ parcela_t × (1 + r)^(n−t)   para fluxoMirr[t] > 0`,
          `PV = Σ |crédito_k| ÷ (1 + r)^k      para fluxoMirr[t] < 0`,
          `MIRR = (FV ÷ PV)^(1/n) − 1`,
          `CET  = (1 + MIRR_mensal)^12 − 1`,
        ].join('\n')}
        passos={[
          `Taxa de oportunidade: ${pct(consorcioParams.taxaOportunidadeAnual)} a.a. → ${pct(taxaOpMensal)} a.m.   |   n = ${consorcioParams.parcelas} meses`,
          `Perspectiva credor: parcelas recebidas = inflows (+); crédito em t=k = outflow (−)`,
          `FV(parcelas) capitalizado até t=n: ${moeda(fvTotal)}`,
          `PV(crédito líquido) descontado para t=0: ${moeda(pvTotal)}`,
          `MIRR mensal = (${moeda(fvTotal)} ÷ ${moeda(pvTotal)})^(1/${consorcioParams.parcelas}) − 1 = ${pct(resultMIRR.tirMensal)}`,
          `CET anual = ${pct(resultMIRR.tirAnual)}`,
        ]}
        pros={[
          'Sempre converge — não depende de troca de sinal no fluxo',
          'Incorpora explicitamente o custo de oportunidade do consultor ou do cliente',
          'Elimina o problema de múltiplas raízes da TIR convencional',
          'Útil quando há uma taxa de referência clara (CDI, SELIC, retorno esperado)',
        ]}
        contras={[
          'Resultado depende da taxa de oportunidade informada — não é taxa pura do contrato',
          'Dois consultores com premissas diferentes chegam a CETs distintos para o mesmo contrato',
          `Com taxa op. ${pct(consorcioParams.taxaOportunidadeAnual)}, o MIRR converge para próximo desse valor`,
          'Não comparável diretamente com a TIR do financiamento, que não usa taxa externa',
        ]}
      />
    </div>
  )
}
