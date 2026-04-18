import type { LinhaAmortizacao, ResultadoSimulacao } from '../domain/types'
import { moeda, pct } from './format'

export function exportCSV(
  consorcio: ResultadoSimulacao,
  financiamento: ResultadoSimulacao,
) {
  const maxRows = Math.max(consorcio.linhas.length, financiamento.linhas.length)
  const rows: string[] = [
    'Mês;C_Parcela;C_Lance;C_Saldo;C_SaldoAj;C_CartaAj;F_Parcela;F_Lance;F_Saldo;F_SaldoAj;F_CartaAj',
  ]

  for (let i = 0; i < maxRows; i++) {
    const c: LinhaAmortizacao | undefined = consorcio.linhas[i]
    const f: LinhaAmortizacao | undefined = financiamento.linhas[i]
    rows.push(
      [
        i + 1,
        c ? c.parcela.toFixed(2) : '',
        c ? c.lance.toFixed(2) : '',
        c ? Math.max(0, c.saldo).toFixed(2) : '',
        c ? Math.max(0, c.saldoAjustado).toFixed(2) : '',
        c ? c.cartaAjustada.toFixed(2) : '',
        f ? f.parcela.toFixed(2) : '',
        f ? f.lance.toFixed(2) : '',
        f ? Math.max(0, f.saldo).toFixed(2) : '',
        f ? Math.max(0, f.saldoAjustado).toFixed(2) : '',
        f ? f.cartaAjustada.toFixed(2) : '',
      ].join(';'),
    )
  }

  const blob = new Blob(['\uFEFF' + rows.join('\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'simulacao-consorcio.csv'
  a.click()
  URL.revokeObjectURL(url)
}

export async function exportPDF(
  consorcio: ResultadoSimulacao,
  financiamento: ResultadoSimulacao,
) {
  const { default: jsPDF } = await import('jspdf')
  const { default: autoTable } = await import('jspdf-autotable')

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })

  doc.setFontSize(14)
  doc.text('Simulador — Comparativo Consórcio vs Financiamento', 14, 14)
  doc.setFontSize(9)

  // Resumo
  const resumo = [
    ['', 'Consórcio', 'Financiamento'],
    ['Saldo Inicial', moeda(consorcio.saldoDevedor), moeda(financiamento.saldoDevedor)],
    ['Parcela Inicial', moeda(consorcio.parcelaInicial), moeda(financiamento.parcelaInicial)],
    ['Total Pago', moeda(consorcio.totalPago), moeda(financiamento.totalPago)],
    ['TIR Anual (CET)', pct(consorcio.tirAnual), pct(financiamento.tirAnual)],
  ]

  autoTable(doc, {
    startY: 22,
    head: [resumo[0]],
    body: resumo.slice(1),
    theme: 'grid',
    styles: { fontSize: 8 },
    headStyles: { fillColor: [30, 64, 175] },
  })

  // Tabela de amortização
  const maxRows = Math.max(consorcio.linhas.length, financiamento.linhas.length)
  const tableData = Array.from({ length: maxRows }, (_, i) => {
    const c = consorcio.linhas[i]
    const f = financiamento.linhas[i]
    return [
      i + 1,
      c ? moeda(c.parcela) : '',
      c ? (c.lance > 0 ? moeda(c.lance) : '—') : '',
      c ? moeda(Math.max(0, c.saldoAjustado)) : '',
      f ? moeda(f.parcela) : '',
      f ? (f.lance > 0 ? moeda(f.lance) : '—') : '',
      f ? moeda(Math.max(0, f.saldoAjustado)) : '',
    ]
  })

  autoTable(doc, {
    startY: (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6,
    head: [['Mês', 'C_Parcela', 'C_Lance', 'C_Saldo Aj.', 'F_Parcela', 'F_Lance', 'F_Saldo Aj.']],
    body: tableData,
    theme: 'striped',
    styles: { fontSize: 6.5 },
    headStyles: { fillColor: [30, 64, 175] },
  })

  doc.save('simulacao-consorcio.pdf')
}
