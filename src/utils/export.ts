import type { ResultadoSimulacao } from '../domain/types'
import { moeda, pct } from './format'

// ---------- XLSX (duas abas) ----------

function buildSheet(r: ResultadoSimulacao) {
  const aoa: (string | number)[][] = [
    ['Resumo'],
    [],
    ['Parcela Inicial', r.parcelaInicial],
    ['Total Pago', r.totalPago],
    ['Crédito Liberado', r.creditoLiberado],
    ['TIR Anual (CET)', r.tirAnual],
    ['Saldo Inicial', r.saldoDevedor],
    [],
    ['Mês', 'Parcela', 'Lance', 'Saldo Devedor', 'Valor da Carta'],
    ...r.linhas.map((l) => [
      l.mes,
      l.parcela,
      l.lance,
      Math.max(0, l.saldo),
      l.cartaAjustada,
    ]),
  ]
  return aoa
}

export async function exportXLSX(
  consorcio: ResultadoSimulacao,
  financiamento: ResultadoSimulacao,
) {
  const XLSX = await import('xlsx')

  const wb = XLSX.utils.book_new()

  const wsC = XLSX.utils.aoa_to_sheet(buildSheet(consorcio))
  const wsF = XLSX.utils.aoa_to_sheet(buildSheet(financiamento))

  // Formata colunas monetárias e percentual nas linhas de resumo
  const fmtBRL = '"R$"#,##0.00'
  const fmtPct = '0.0000%'
  ;[wsC, wsF].forEach((ws) => {
    // Resumo: B3=parcelaInicial, B4=totalPago, B5=creditoLiberado, B7=saldoDevedor
    ;['B3', 'B4', 'B5', 'B7'].forEach((ref) => {
      if (ws[ref]) ws[ref].z = fmtBRL
    })
    // B6 = tirAnual
    if (ws['B6']) ws['B6'].z = fmtPct

    // Tabela de amortização: começa na linha 10 (1-indexed)
    const range = XLSX.utils.decode_range(ws['!ref'] ?? 'A1')
    for (let row = 9; row <= range.e.r; row++) {
      // col B=1 (Parcela), C=2 (Lance), D=3 (Saldo), E=4 (Carta)
      for (const col of [1, 2, 3, 4]) {
        const cell = ws[XLSX.utils.encode_cell({ r: row, c: col })]
        if (cell && typeof cell.v === 'number') cell.z = fmtBRL
      }
    }

    // Largura das colunas
    ws['!cols'] = [{ wch: 20 }, { wch: 16 }, { wch: 16 }, { wch: 18 }, { wch: 16 }]
  })

  XLSX.utils.book_append_sheet(wb, wsC, 'Consórcio')
  XLSX.utils.book_append_sheet(wb, wsF, 'Financiamento')

  XLSX.writeFile(wb, 'simulacao-consorcio.xlsx')
}

// ---------- PDF ----------

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

  const resumo = [
    ['', 'Consórcio', 'Financiamento'],
    ['Saldo Inicial', moeda(consorcio.saldoDevedor), moeda(financiamento.saldoDevedor)],
    ['Parcela Inicial', moeda(consorcio.parcelaInicial), moeda(financiamento.parcelaInicial)],
    ['Total Pago', moeda(consorcio.totalPago), moeda(financiamento.totalPago)],
    ['Crédito Liberado', moeda(consorcio.creditoLiberado), moeda(financiamento.creditoLiberado)],
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

  const maxRows = Math.max(consorcio.linhas.length, financiamento.linhas.length)
  const tableData = Array.from({ length: maxRows }, (_, i) => {
    const c = consorcio.linhas[i]
    const f = financiamento.linhas[i]
    return [
      i + 1,
      c ? moeda(c.parcela) : '',
      c ? (c.lance > 0 ? moeda(c.lance) : '—') : '',
      c ? moeda(Math.max(0, c.saldo)) : '',
      c ? moeda(c.cartaAjustada) : '',
      f ? moeda(f.parcela) : '',
      f ? (f.lance > 0 ? moeda(f.lance) : '—') : '',
      f ? moeda(Math.max(0, f.saldo)) : '',
      f ? moeda(f.cartaAjustada) : '',
    ]
  })

  autoTable(doc, {
    startY: (doc as InstanceType<typeof jsPDF> & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6,
    head: [['Mês', 'C_Parcela', 'C_Lance', 'C_Saldo', 'C_Carta', 'F_Parcela', 'F_Lance', 'F_Saldo', 'F_Carta']],
    body: tableData,
    theme: 'striped',
    styles: { fontSize: 6.5 },
    headStyles: { fillColor: [30, 64, 175] },
  })

  doc.save('simulacao-consorcio.pdf')
}
