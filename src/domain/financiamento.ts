import type { FinanciamentoParams, LinhaAmortizacao, ResultadoSimulacao } from './types'
import { pmt, irr, npv } from './financeiro'

export function calcularFinanciamento(p: FinanciamentoParams): ResultadoSimulacao {
  const custas = p.fundoReserva + p.seguro
  const saldoInicial = p.valorCarta * (1 + custas)
  const parcelaBase = pmt(p.taxaJuros, p.parcelas, saldoInicial)
  const parcelaInicial = parcelaBase + p.taxaMensal

  const linhas: LinhaAmortizacao[] = []
  let saldo = saldoInicial
  let cartaAjustada = p.valorCarta
  let totalPago = 0

  const fluxoIRR: number[] = [p.valorCarta]

  for (let mes = 1; mes <= p.parcelas; mes++) {
    if (mes > 1 && (mes - 1) % 12 === 0) {
      cartaAjustada = cartaAjustada * (1 + p.indiceAnual)
    }

    const juros = saldo * p.taxaJuros
    const amortizacao = Math.max(0, parcelaBase - juros)
    const parcelaJuros = Math.min(parcelaBase, saldo + juros)
    const parcelaReal = parcelaJuros + p.taxaMensal

    saldo = Math.max(0, saldo - amortizacao)
    totalPago += parcelaReal
    fluxoIRR.push(-parcelaReal)

    linhas.push({
      mes,
      parcela: parcelaReal,
      lance: 0,
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
    creditoLiberado: p.valorCarta,
    tirMensal,
    tirAnual,
    vpl: vplVal,
    linhas,
  }
}
