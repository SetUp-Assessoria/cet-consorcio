import type { FinanciamentoParams, LinhaAmortizacao, ResultadoSimulacao } from './types'
import { pmt, irr, npv } from './financeiro'

export function calcularFinanciamento(p: FinanciamentoParams): ResultadoSimulacao {
  const custas = p.taxaAdesao + p.fundoReserva + p.seguro
  const saldoInicial = p.valorCarta * (1 + custas)
  const valorLance = p.lanceMode === 'financeiro' ? p.lance : saldoInicial * p.lance

  // Saldo após lance automático (aplicado antes das parcelas)
  const saldoAposLance = Math.max(0, saldoInicial - valorLance)
  const parcelaInicial = pmt(p.taxaJuros, p.parcelas, saldoAposLance)

  const linhas: LinhaAmortizacao[] = []
  let saldo = saldoInicial
  let cartaAjustada = p.valorCarta
  let totalPago = 0

  const fluxoIRR: number[] = [p.valorCarta]

  for (let mes = 1; mes <= p.parcelas; mes++) {
    // Reajuste IPCA a cada 12 meses
    if (mes > 1 && (mes - 1) % 12 === 0) {
      cartaAjustada = cartaAjustada * (1 + p.ipca)
    }

    const lanceAtual =
      p.parcelaLance > 0 && mes === p.parcelaLance && p.lance > 0
        ? valorLance
        : mes === 1 && p.parcelaLance === 0 && p.lance > 0
          ? valorLance
          : 0

    // Juros do período sobre saldo atual
    const juros = saldo * p.taxaJuros
    const amortizacao = Math.max(0, parcelaInicial - juros)
    const parcelaReal = Math.min(parcelaInicial, saldo + juros)

    saldo = Math.max(0, saldo - amortizacao - lanceAtual)
    totalPago += parcelaReal + lanceAtual
    fluxoIRR.push(-(parcelaReal + lanceAtual))

    linhas.push({
      mes,
      parcela: parcelaReal,
      lance: lanceAtual,
      saldo,
      saldoAjustado: saldo,
      cartaAjustada,
    })

    if (saldo <= 0.01) break
  }

  const tirMensal = irr(fluxoIRR)
  const tirAnual = Math.pow(1 + tirMensal, 12) - 1
  const vplVal = npv(tirMensal, fluxoIRR.slice(1)) + fluxoIRR[0]

  return {
    saldoDevedor: saldoInicial,
    parcelaInicial,
    totalPago,
    tirMensal,
    tirAnual,
    vpl: vplVal,
    linhas,
  }
}
