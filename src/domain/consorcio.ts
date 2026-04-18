import type { ConsorcioParams, LinhaAmortizacao, ResultadoSimulacao } from './types'
import { irr, npv } from './financeiro'

export function calcularConsorcio(p: ConsorcioParams): ResultadoSimulacao {
  const taxaAdesaoFrac = p.taxaAdesaoMode === 'financeiro' ? p.taxaAdesao / p.valorCarta : p.taxaAdesao
  const fatorCustas = p.taxaAdm + taxaAdesaoFrac + p.fundoReserva + p.seguro * p.parcelas
  const totalContratado = p.valorCarta * (1 + fatorCustas)
  const parcelaInicial = totalContratado / p.parcelas

  const hasLancePropio = p.tipoContemplacao === 'lancePropio' || p.tipoContemplacao === 'lanceEmbutidoMaisPropio'
  const hasLanceEmbutido = p.tipoContemplacao === 'lanceEmbutido' || p.tipoContemplacao === 'lanceEmbutidoMaisPropio'
  const temLance = hasLancePropio || hasLanceEmbutido

  let saldoCarta = p.valorCarta
  let saldoCustas = p.valorCarta * fatorCustas
  let cartaAjustada = p.valorCarta

  let parcelaCarta = saldoCarta / p.parcelas
  let parcelaCustas = saldoCustas / p.parcelas

  const linhas: LinhaAmortizacao[] = []
  let totalPago = 0
  let creditoLiberado = 0
  // t=0: se há contemplação com lance, crédito entra no mês da contemplação
  const fluxoIRR: number[] = [temLance ? 0 : p.valorCarta]

  for (let mes = 1; mes <= p.parcelas; mes++) {
    if (mes > 1 && (mes - 1) % 12 === 0) {
      const f = 1 + p.ipca
      saldoCarta = saldoCarta * f
      cartaAjustada = cartaAjustada * f
      if (p.baseReajuste === 'totalContratado') {
        saldoCustas = saldoCustas * f
      }
      const mesesRestantes = p.parcelas - mes + 1
      parcelaCarta = saldoCarta / mesesRestantes
      parcelaCustas = saldoCustas / mesesRestantes
    }

    const parcela = parcelaCarta + parcelaCustas

    // Lance próprio: desembolso em dinheiro (entra na coluna Lance)
    let lancePropio = 0
    if (hasLancePropio && mes === p.parcelaContemplacao && p.lance > 0) {
      lancePropio = p.lanceMode === 'financeiro'
        ? p.lance
        : (saldoCarta + saldoCustas) * p.lance
    }

    // Lance embutido: usa parte do crédito (NÃO é desembolso; não entra na coluna Lance)
    let lanceEmb = 0
    if (hasLanceEmbutido && mes === p.parcelaContemplacao && p.lanceEmbutido > 0) {
      lanceEmb = p.lanceEmbutidoMode === 'financeiro'
        ? p.lanceEmbutido
        : (saldoCarta + saldoCustas) * p.lanceEmbutido
    }

    saldoCarta -= parcelaCarta
    saldoCustas -= parcelaCustas

    const lanceTotal = lancePropio + lanceEmb

    if (lanceTotal > 0) {
      creditoLiberado = cartaAjustada - lancePropio - lanceEmb

      const propCarta = saldoCarta / (saldoCarta + saldoCustas || 1)
      saldoCarta -= lanceTotal * propCarta
      saldoCustas -= lanceTotal * (1 - propCarta)

      const mesesRestantes = p.parcelas - mes
      if (mesesRestantes > 0) {
        parcelaCarta = saldoCarta / mesesRestantes
        parcelaCustas = saldoCustas / mesesRestantes
      }
    }

    totalPago += parcela + lancePropio

    if (temLance && mes === p.parcelaContemplacao) {
      // Inflow = crédito líquido (carta − lances); outflow = parcela do mês
      fluxoIRR.push(creditoLiberado - parcela)
    } else {
      fluxoIRR.push(-parcela)
    }

    linhas.push({
      mes,
      parcela,
      lance: lancePropio,
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
    creditoLiberado,
    tirMensal,
    tirAnual,
    vpl: vplVal,
    linhas,
  }
}
