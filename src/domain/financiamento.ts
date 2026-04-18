import type { FinanciamentoParams, LinhaAmortizacao, ResultadoSimulacao } from './types'
import { irr, npv } from './financeiro'

export function calcularFinanciamento(p: FinanciamentoParams): ResultadoSimulacao {
  // Taxa de correção mensal equivalente ao índice anual (IPCA/INCC/TR)
  const tc = Math.pow(1 + p.indiceAnual, 1 / 12) - 1

  const custas = p.fundoReserva + p.seguro
  const saldoInicial = p.valorCarta * (1 + custas)

  // SAC: amortização constante sobre o saldo inicial
  const amortizacao = saldoInicial / p.parcelas

  const linhas: LinhaAmortizacao[] = []
  let saldo = saldoInicial
  let cartaAjustada = p.valorCarta
  let totalPago = 0

  const fluxoIRR: number[] = [p.valorCarta]

  for (let mes = 1; mes <= p.parcelas; mes++) {
    // 1. Corrige saldo e carta pelo índice mensal
    saldo = saldo * (1 + tc)
    cartaAjustada = cartaAjustada * (1 + tc)

    // 2. Juros sobre saldo corrigido × taxa mensal
    const juros = saldo * p.taxaJuros

    // 3. Parcela = amortização constante + juros + tarifa mensal fixa
    const parcela = amortizacao + juros + p.taxaMensal

    // 4. Abate a amortização do saldo
    saldo = Math.max(0, saldo - amortizacao)

    totalPago += parcela
    fluxoIRR.push(-parcela)

    linhas.push({
      mes,
      parcela,
      lance: 0,
      saldo,
      saldoAjustado: saldo,
      cartaAjustada,
      amortizacao,
      juros,
    })

    if (saldo <= 0.01) break
  }

  const parcelaInicial = linhas[0]?.parcela ?? 0

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
