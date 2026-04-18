import type { ConsorcioParams, LinhaAmortizacao, ResultadoSimulacao } from './types'
import { irr, npv } from './financeiro'

export function calcularConsorcio(p: ConsorcioParams): ResultadoSimulacao {
  // 1. Total a ser pago = carta + (taxas × carta)
  const totalContratado = p.valorCarta * (1 + p.taxaAdm + p.taxaAdesao + p.fundoReserva + p.seguro)

  // 2. Parcela = total / prazo (sem juros — sistema de cotas)
  const parcelaInicial = totalContratado / p.parcelas

  // 3. Lance sobre o total contratado
  const valorLance = totalContratado * p.lance

  const linhas: LinhaAmortizacao[] = []
  let parcela = parcelaInicial
  let cartaAjustada = p.valorCarta
  let totalPago = 0

  // Fluxo IRR: contratante recebe a carta (+) e paga as parcelas (-)
  const fluxoIRR: number[] = [p.valorCarta]

  for (let mes = 1; mes <= p.parcelas; mes++) {
    // Reajuste a cada 12 meses a partir do mês 13 (aniversário da carta)
    if (mes > 1 && (mes - 1) % 12 === 0) {
      parcela = parcela * (1 + p.ipca)
      cartaAjustada = cartaAjustada * (1 + p.ipca)
    }

    const lanceAtual = mes === p.parcelaLance && p.lance > 0 ? valorLance : 0
    const pagamentoMes = parcela + lanceAtual

    totalPago += pagamentoMes
    fluxoIRR.push(-pagamentoMes)

    // Saldo = parcela_atual × meses restantes (= quanto ainda será pago, em valores de hoje)
    const mesesRestantes = p.parcelas - mes
    const saldoAtual = parcela * mesesRestantes

    linhas.push({
      mes,
      parcela,
      lance: lanceAtual,
      saldo: saldoAtual,
      saldoAjustado: saldoAtual,
      cartaAjustada,
    })
  }

  const tirMensal = irr(fluxoIRR)
  const tirAnual = Math.pow(1 + tirMensal, 12) - 1
  const vplVal = npv(tirMensal, fluxoIRR.slice(1)) + fluxoIRR[0]

  return {
    saldoDevedor: totalContratado,
    parcelaInicial,
    totalPago,
    tirMensal,
    tirAnual,
    vpl: vplVal,
    linhas,
  }
}
