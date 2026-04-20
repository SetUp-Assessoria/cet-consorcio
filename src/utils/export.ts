import type { ConsorcioParams, ResultadoSimulacao } from '../domain/types'
import { calcularConsorcio } from '../domain/consorcio'
import { construirFluxoConsorcioTk } from '../domain/fluxo'
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

// ---------- Auditoria CET (3 abas) ----------

export async function exportAuditoriaCET(params: ConsorcioParams) {
  const XLSX = await import('xlsx')

  const resPV   = calcularConsorcio({ ...params, metodoCET: 'pv'   })
  const resTK   = calcularConsorcio({ ...params, metodoCET: 'tk'   })
  const resMIRR = calcularConsorcio({ ...params, metodoCET: 'mirr' })

  const k      = params.parcelaContemplacao
  const ipca   = params.ipca
  const credit = resPV.creditoLiberado
  const fmtBRL = '"R$"#,##0.00'
  const fmtPct = '0.0000%'
  const fmtPct2 = '0.00%'

  // ── ABA 1: PV por Índice ──────────────────────────────────────────────────
  const creditoPV = credit / Math.pow(1 + ipca, k / 12)
  const aoaPV: (string | number)[][] = [
    ['METODOLOGIA: PV por Índice — Crédito descontado ao índice de reajuste e posicionado em t=0'],
    [],
    ['PARÂMETROS'],
    ['Crédito Liberado', credit, 'Índice de Reajuste (a.a.)', ipca, 'Parcela de Contemplação (k)', k],
    ['creditoPV', creditoPV, `= crédito ÷ (1 + índice)^(k/12)`],
    ['CET Mensal', resPV.tirMensal, 'CET Anual', resPV.tirAnual],
    [],
    ['FLUXO DE CAIXA'],
    ['t', 'Descrição', 'Fluxo CET (R$)'],
    [0, 'Crédito (VP) — posicionado em t=0', creditoPV],
    ...resPV.linhas.map(l => [
      l.mes,
      l.mes === k ? `Parcela ${l.mes} + Lance (mês contemplação)` : `Parcela ${l.mes}${l.lance > 0 ? ' + Lance' : ''}`,
      -(l.parcela + l.lance),
    ]),
  ]

  const wsPV = XLSX.utils.aoa_to_sheet(aoaPV)
  // Formatação
  if (wsPV['B4']) wsPV['B4'].z = fmtBRL
  if (wsPV['D4']) wsPV['D4'].z = fmtPct2
  if (wsPV['B5']) wsPV['B5'].z = fmtBRL
  if (wsPV['B6']) wsPV['B6'].z = fmtPct
  if (wsPV['D6']) wsPV['D6'].z = fmtPct2
  const rangePV = XLSX.utils.decode_range(wsPV['!ref'] ?? 'A1')
  for (let row = 9; row <= rangePV.e.r; row++) {
    const cellC = wsPV[XLSX.utils.encode_cell({ r: row, c: 2 })]
    if (cellC && typeof cellC.v === 'number') cellC.z = fmtBRL
  }
  wsPV['!cols'] = [{ wch: 5 }, { wch: 42 }, { wch: 18 }, { wch: 22 }, { wch: 8 }, { wch: 26 }]
  // Destaque linha contemplação (t=k)
  const contemplRowPV = 9 + k // row index 0-based: header=row9(idx8), t=0=row10(idx9), t=1=row11...
  const cellPVContempl = wsPV[XLSX.utils.encode_cell({ r: contemplRowPV, c: 2 })]
  if (cellPVContempl) cellPVContempl.s = { fill: { fgColor: { rgb: 'DBEAFE' } } }

  // ── ABA 2: t=k Real ───────────────────────────────────────────────────────
  const fluxoTk = construirFluxoConsorcioTk(resTK.linhas, credit, k)
  const lanceK = resTK.linhas[k - 1]?.lance ?? 0

  const aoaTK: (string | number | boolean)[][] = [
    ['METODOLOGIA: t=k Real — Crédito posicionado no mês real da contemplação'],
    [],
    ['PARÂMETROS'],
    ['Crédito Liberado', credit, 'k (contemplação)', k, 'Fallback PV?', resTK.metodoCETFallback ? 'Sim' : 'Não'],
    ['CET Mensal', resTK.tirMensal, 'CET Anual', resTK.tirAnual],
    ...(resTK.metodoCETFallback
      ? [['⚠ ATENÇÃO: TIR não convergiu (sem troca de sinal no fluxo). Resultado via fallback PV.']]
      : []),
    [],
    ['FLUXO DE CAIXA'],
    ['t', 'Descrição', 'Fluxo (R$)'],
    [0, '—', 0],
    ...resTK.linhas.map((l, i) => {
      const v = fluxoTk[i + 1]
      const desc = l.mes === k
        ? `Crédito (${moeda(credit)}) − Parcela ${l.mes}${lanceK > 0 ? ' − Lance' : ''}`
        : `Parcela ${l.mes}${l.lance > 0 ? ' + Lance' : ''}`
      return [l.mes, desc, v]
    }),
  ]

  const wsTK = XLSX.utils.aoa_to_sheet(aoaTK as (string | number)[][])
  if (wsTK['B4']) wsTK['B4'].z = fmtBRL
  if (wsTK['B5']) wsTK['B5'].z = fmtPct
  if (wsTK['D5']) wsTK['D5'].z = fmtPct2
  const headerRowTK = resTK.metodoCETFallback ? 8 : 7 // 0-based index of "t | Descrição" header
  const rangeTK = XLSX.utils.decode_range(wsTK['!ref'] ?? 'A1')
  for (let row = headerRowTK + 1; row <= rangeTK.e.r; row++) {
    const cellC = wsTK[XLSX.utils.encode_cell({ r: row, c: 2 })]
    if (cellC && typeof cellC.v === 'number') cellC.z = fmtBRL
  }
  wsTK['!cols'] = [{ wch: 5 }, { wch: 48 }, { wch: 18 }]

  // ── ABA 3: MIRR ───────────────────────────────────────────────────────────
  const taxaOpMensal = Math.pow(1 + params.taxaOportunidadeAnual, 1 / 12) - 1
  const fluxoMirr    = fluxoTk.map(v => -v)
  const n            = fluxoMirr.length - 1
  let fvTotal = 0, pvTotal = 0
  const mirrRows: (string | number)[][] = []

  fluxoMirr.forEach((v, t) => {
    const isMes = t > 0
    const linhaIdx = t - 1
    const linhaMes = isMes ? resMIRR.linhas[linhaIdx] : null
    const fvCell = v > 0 ? v * Math.pow(1 + taxaOpMensal, n - t) : 0
    const pvCell = v < 0 ? Math.abs(v) / Math.pow(1 + taxaOpMensal, t) : 0
    fvTotal += fvCell
    pvTotal += pvCell

    let desc: string
    if (t === 0) desc = '—'
    else if (t === k) desc = `Crédito desembolsado (${moeda(credit)}) − Parcela ${t}${lanceK > 0 ? ' − Lance' : ''}`
    else desc = `Parcela recebida${(linhaMes?.lance ?? 0) > 0 ? ' + Lance' : ''} — mês ${t}`

    mirrRows.push([t, desc, v, fvCell > 0 ? fvCell : '', pvCell > 0 ? pvCell : ''])
  })

  const aoaMIRR: (string | number)[][] = [
    ['METODOLOGIA: MIRR — Taxa Interna de Retorno Modificada (perspectiva do credor)'],
    [],
    ['PARÂMETROS'],
    ['Taxa de Oportunidade a.a.', params.taxaOportunidadeAnual, 'Taxa de Oportunidade a.m.', taxaOpMensal, 'n (meses)', n],
    ['CET Mensal (MIRR)', resMIRR.tirMensal, 'CET Anual', resMIRR.tirAnual],
    [],
    ['FLUXO DE CAIXA — Perspectiva do Credor (parcelas = entrada, crédito liberado = saída)'],
    ['t', 'Descrição', 'Fluxo Credor (R$)', 'FV(entrada) capitalizado a t=n', 'PV(saída) descontado a t=0'],
    ...mirrRows,
    [],
    ['', 'TOTAL', '', fvTotal, pvTotal],
    ['', `MIRR mensal = (ΣFV ÷ ΣPV)^(1/n) − 1 = (${moeda(fvTotal)} ÷ ${moeda(pvTotal)})^(1/${n}) − 1`, '', resMIRR.tirMensal, ''],
    ['', 'CET Anual = (1 + MIRR_mensal)^12 − 1', '', resMIRR.tirAnual, ''],
  ]

  const wsMIRR = XLSX.utils.aoa_to_sheet(aoaMIRR)
  if (wsMIRR['B4']) wsMIRR['B4'].z = fmtPct2
  if (wsMIRR['D4']) wsMIRR['D4'].z = fmtPct
  if (wsMIRR['B5']) wsMIRR['B5'].z = fmtPct
  if (wsMIRR['D5']) wsMIRR['D5'].z = fmtPct2
  const rangeMIRR = XLSX.utils.decode_range(wsMIRR['!ref'] ?? 'A1')
  for (let row = 8; row <= rangeMIRR.e.r; row++) {
    for (const col of [2, 3, 4]) {
      const cell = wsMIRR[XLSX.utils.encode_cell({ r: row, c: col })]
      if (cell && typeof cell.v === 'number') cell.z = fmtBRL
    }
  }
  // Linha de totais e MIRR result — formatação percentual
  const totalRow = 8 + fluxoMirr.length + 1 // após linhas + linha vazia
  const mirrRow1 = totalRow + 1
  const mirrRow2 = totalRow + 2
  ;[mirrRow1, mirrRow2].forEach(r => {
    const cell = wsMIRR[XLSX.utils.encode_cell({ r, c: 3 })]
    if (cell && typeof cell.v === 'number') cell.z = fmtPct
  })
  wsMIRR['!cols'] = [{ wch: 5 }, { wch: 52 }, { wch: 18 }, { wch: 28 }, { wch: 26 }]

  // ── Montar workbook ───────────────────────────────────────────────────────
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, wsPV,   'PV por Índice')
  XLSX.utils.book_append_sheet(wb, wsTK,   't=k Real')
  XLSX.utils.book_append_sheet(wb, wsMIRR, 'MIRR')

  XLSX.writeFile(wb, 'auditoria-cet-consorcio.xlsx')
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
