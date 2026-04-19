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
      </main>
    </div>
  )
}
