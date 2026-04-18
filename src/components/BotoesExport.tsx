import { useState } from 'react'
import type { ResultadoSimulacao } from '../domain/types'
import { exportXLSX, exportPDF } from '../utils/export'

interface Props {
  consorcio: ResultadoSimulacao
  financiamento: ResultadoSimulacao
}

export function BotoesExport({ consorcio, financiamento }: Props) {
  const [pdfLoading, setPdfLoading] = useState(false)
  const [xlsxLoading, setXlsxLoading] = useState(false)

  const handleXLSX = async () => {
    setXlsxLoading(true)
    try {
      await exportXLSX(consorcio, financiamento)
    } finally {
      setXlsxLoading(false)
    }
  }

  const handlePDF = async () => {
    setPdfLoading(true)
    try {
      await exportPDF(consorcio, financiamento)
    } finally {
      setPdfLoading(false)
    }
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={handleXLSX}
        disabled={xlsxLoading}
        className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 active:scale-95 transition-transform disabled:opacity-60"
      >
        {xlsxLoading ? 'Gerando...' : 'Exportar Excel'}
      </button>
      <button
        onClick={handlePDF}
        disabled={pdfLoading}
        className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 active:scale-95 transition-transform disabled:opacity-60"
      >
        {pdfLoading ? 'Gerando...' : 'Exportar PDF'}
      </button>
    </div>
  )
}
