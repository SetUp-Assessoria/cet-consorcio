import { useSimulacao } from './hooks/useSimulacao'
import { InputPanel } from './components/InputPanel'
import { ResumoCards } from './components/ResumoCards'
import { TabelaAmortizacao } from './components/TabelaAmortizacao'
import { Graficos } from './components/Graficos'
import { BotoesExport } from './components/BotoesExport'

export default function App() {
  const {
    consorcioParams, setConsorcioParams,
    financiamentoParams, setFinanciamentoParams,
    resultadoConsorcio, resultadoFinanciamento,
  } = useSimulacao()

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

      <main className="mx-auto max-w-7xl space-y-6 px-6 py-6">
        <InputPanel
          consorcioParams={consorcioParams}
          onConsorcioChange={setConsorcioParams}
          financiamentoParams={financiamentoParams}
          onFinanciamentoChange={setFinanciamentoParams}
        />

        <ResumoCards consorcio={resultadoConsorcio} financiamento={resultadoFinanciamento} />

        <p className="text-[11px] text-slate-400 -mt-3">
          ¹ CET c/ custo de espera: acrescenta ao CET do consórcio o custo de oportunidade de aguardar o crédito,
          estimado pelo mesmo índice de reajuste do contrato (IPCA) — financiamento recebe o crédito em t=0, sem ajuste.
        </p>

        <Graficos
          consorcioLinhas={resultadoConsorcio.linhas}
          financiamentoLinhas={resultadoFinanciamento.linhas}
        />

        <div className="grid grid-cols-2 gap-6">
          <TabelaAmortizacao linhas={resultadoConsorcio.linhas} label="Amortização — Consórcio" color="blue" />
          <TabelaAmortizacao linhas={resultadoFinanciamento.linhas} label="Amortização — Financiamento" color="orange" />
        </div>
      </main>
    </div>
  )
}
