import type { ConsorcioParams, LinhaAmortizacao, ResultadoSimulacao } from './types'
import { irr, npv } from './financeiro'

export function calcularConsorcio(p: ConsorcioParams): ResultadoSimulacao {
  // taxaAdm, fundoReserva, seguro, taxaAdesao são % totais sobre a carta
  const custas = p.taxaAdm + p.taxaAdesao + p.fundoReserva + p.seguro
  const saldoInicial = p.valorCarta * (1 + custas)
  const valorLance = saldoInicial * p.lance

  const linhas: LinhaAmortizacao[] = []

  // saldo (col F): não cresce com IPCA — referência nominal
  // saldoAj (col G): cresce com IPCA = referência real (base para TIR)
  let saldo = saldoInicial
  let saldoAj = saldoInicial
  let parcela = saldoInicial / p.parcelas
  let cartaAjustada = p.valorCarta
  let totalPago = 0

  // fluxo IRR: quem contrata recebe a carta (entrada positiva) e paga parcelas (saída negativa)
  const fluxoIRR: number[] = [p.valorCarta]

  const parcelaInicial = parcela

  for (let mes = 1; mes <= p.parcelas; mes++) {
    // Reajuste IPCA a cada 12 meses (primeiro reajuste no mês 13)
    if (mes > 1 && (mes - 1) % 12 === 0) {
      const fator = 1 + p.ipca
      parcela = parcela * fator
      saldoAj = saldoAj * fator   // saldo ajustado cresce com IPCA
      cartaAjustada = cartaAjustada * fator
    }

    const lanceAtual = mes === p.parcelaLance && p.lance > 0 ? valorLance : 0

    saldo = saldo - parcela - lanceAtual
    saldoAj = saldoAj - parcela - lanceAtual

    totalPago += parcela + lanceAtual
    fluxoIRR.push(-(parcela + lanceAtual))

    linhas.push({
      mes,
      parcela,
      lance: lanceAtual,
      saldo,
      saldoAjustado: saldoAj,
      cartaAjustada,
    })
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
