import { useState } from 'react'
import { useSimulacao } from './hooks/useSimulacao'
import { InputPanel } from './components/InputPanel'
import { ResumoCards } from './components/ResumoCards'
import { TabelaAmortizacao } from './components/TabelaAmortizacao'
import { Graficos } from './components/Graficos'
import { BotoesExport } from './components/BotoesExport'
import { DashboardDecisao } from './components/DashboardDecisao'

type Aba = 'simulacao' | 'analise'

export default function App() {
  const {
    consorcioParams, setConsorcioParams,
    financiamentoParams, setFinanciamentoParams,
    resultadoConsorcio, resultadoFinanciamento,
  } = useSimulacao()

  const [aba, setAba] = useState<Aba>('simulacao')

  const cC = resultadoConsorcio.creditoLiberado
  const cF = resultadoFinanciamento.creditoLiberado
  const diff = Math.abs(cC - cF) / Math.max(cC, cF, 1)
  const analiseDisponivel = diff <= 0.10

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white px-6 py-4">
        <div className="mx-auto max-w-7xl flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-slate-800">Simulador de Consórcio</h1>
            <p className="text-xs text-slate-500">Comparativo de Custo Efetivo — Consórcio vs Financiamento</p>
          </div>
          <BotoesExport consorcio={resultadoConsorcio} financiamento={resultadoFinanciamento} />
        </div>
      </header>

      {/* Navegação por abas */}
      <div className="border-b border-slate-200 bg-white px-6">
        <div className="mx-auto max-w-7xl flex gap-0">
          <button
            onClick={() => setAba('simulacao')}
            className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
              aba === 'simulacao'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Simulação
          </button>

          <div className="relative group">
            <button
              onClick={() => analiseDisponivel && setAba('analise')}
              disabled={!analiseDisponivel}
              className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
                aba === 'analise'
                  ? 'border-blue-600 text-blue-600'
                  : analiseDisponivel
                  ? 'border-transparent text-slate-500 hover:text-slate-700'
                  : 'border-transparent text-slate-300 cursor-not-allowed'
              }`}
            >
              Análise Decisória
              {!analiseDisponivel && (
                <span className="text-xs text-slate-300">🔒</span>
              )}
            </button>
            {!analiseDisponivel && (
              <div className="pointer-events-none absolute left-1/2 top-full z-20 mt-1 w-64 -translate-x-1/2 rounded bg-slate-800 px-3 py-2 text-[11px] leading-relaxed text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                Disponível quando a diferença entre os créditos liberados for de no máximo 10%.
                Diferença atual: <strong>{(diff * 100).toFixed(1)}%</strong>.
                <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-full border-4 border-transparent border-b-slate-800" />
              </div>
            )}
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-7xl space-y-6 px-6 py-6">
        {aba === 'simulacao' && (
          <>
            <InputPanel
              consorcioParams={consorcioParams}
              onConsorcioChange={setConsorcioParams}
              financiamentoParams={financiamentoParams}
              onFinanciamentoChange={setFinanciamentoParams}
            />

            <ResumoCards consorcio={resultadoConsorcio} financiamento={resultadoFinanciamento} />

            <p className="text-[11px] text-slate-400 -mt-3">
              ¹ <strong>TIR Anual (CET)</strong>: custo efetivo anualizado — o crédito liberado é trazido a valor presente
              pelo índice de reajuste contratual: creditoPV = crédito ÷ (1 + IPCA)^(k/12), posicionado em t=0.
              &nbsp;<strong>CET c/ custo de espera</strong>: compõe o CET base com a valorização esperada do bem acima
              do índice contratual — (1 + CET) × (1 + valorização) − 1 — refletindo o custo real de aguardar
              a contemplação enquanto o imóvel se valoriza. O financiamento recebe o crédito integral em t=0
              e não sofre ajuste de espera.
            </p>

            <Graficos
              consorcioLinhas={resultadoConsorcio.linhas}
              financiamentoLinhas={resultadoFinanciamento.linhas}
            />

            <div className="grid grid-cols-2 gap-6">
              <TabelaAmortizacao linhas={resultadoConsorcio.linhas} label="Amortização — Consórcio" color="blue" />
              <TabelaAmortizacao linhas={resultadoFinanciamento.linhas} label="Amortização — Financiamento" color="orange" />
            </div>
          </>
        )}

        {aba === 'analise' && analiseDisponivel && (
          <DashboardDecisao
            consorcio={resultadoConsorcio}
            financiamento={resultadoFinanciamento}
            consorcioParams={consorcioParams}
          />
        )}
      </main>
    </div>
  )
}
