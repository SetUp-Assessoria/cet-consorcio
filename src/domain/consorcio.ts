import type { ConsorcioParams, LinhaAmortizacao, ResultadoSimulacao } from './types'
import { irr, npv } from './financeiro'

export function calcularConsorcio(p: ConsorcioParams): ResultadoSimulacao {
  const fatorCustas = p.taxaAdm + p.taxaAdesao + p.fundoReserva + p.seguro * p.parcelas
  const totalContratado = p.valorCarta * (1 + fatorCustas)
  const valorLance = p.lanceMode === 'financeiro' ? p.lance : totalContratado * p.lance
  const parcelaInicial = totalContratado / p.parcelas

  // Saldo rastreado em dois componentes para aplicar reajuste seletivo
  let saldoCarta = p.valorCarta
  let saldoCustas = p.valorCarta * fatorCustas
  let cartaAjustada = p.valorCarta

  // Parcelas calculadas proporcionalmente ao saldo de cada componente
  let parcelaCarta = saldoCarta / p.parcelas
  let parcelaCustas = saldoCustas / p.parcelas

  const linhas: LinhaAmortizacao[] = []
  let totalPago = 0
  const fluxoIRR: number[] = [p.valorCarta]

  for (let mes = 1; mes <= p.parcelas; mes++) {
    // Reajuste anual (antes da dedução do mês)
    if (mes > 1 && (mes - 1) % 12 === 0) {
      const f = 1 + p.ipca
      saldoCarta = saldoCarta * f
      cartaAjustada = cartaAjustada * f
      if (p.baseReajuste === 'totalContratado') {
        saldoCustas = saldoCustas * f
      }
      // Recalcula parcelas com base no novo saldo e nos meses restantes
      const mesesRestantes = p.parcelas - mes + 1
      parcelaCarta = saldoCarta / mesesRestantes
      parcelaCustas = saldoCustas / mesesRestantes
    }

    const parcela = parcelaCarta + parcelaCustas
    const lanceAtual = mes === p.parcelaLance && p.lance > 0 ? valorLance : 0

    // Abate a parcela do mês
    saldoCarta -= parcelaCarta
    saldoCustas -= parcelaCustas

    // Abate o lance e recalcula as parcelas sobre o novo saldo
    if (lanceAtual > 0) {
      const propCarta = saldoCarta / (saldoCarta + saldoCustas || 1)
      saldoCarta -= lanceAtual * propCarta
      saldoCustas -= lanceAtual * (1 - propCarta)

      const mesesRestantes = p.parcelas - mes
      if (mesesRestantes > 0) {
        parcelaCarta = saldoCarta / mesesRestantes
        parcelaCustas = saldoCustas / mesesRestantes
      }
    }

    totalPago += parcela + lanceAtual
    fluxoIRR.push(-(parcela + lanceAtual))

    linhas.push({
      mes,
      parcela,
      lance: lanceAtual,
      saldo: Math.max(0, saldoCarta + saldoCustas),
      saldoAjustado: Math.max(0, saldoCarta + saldoCustas),
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
