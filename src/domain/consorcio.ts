import type { ConsorcioParams, LinhaAmortizacao, MetodoCET, ResultadoSimulacao } from './types'
import { irr, mirr, npv } from './financeiro'
import { construirFluxoConsorcioTk } from './fluxo'

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

  // Desconto acumulado do redutor de parcela (corrigido anualmente pelo IPCA)
  let descontoAcumulado = 0

  const linhas: LinhaAmortizacao[] = []
  let totalPago = 0
  let creditoLiberado = 0

  for (let mes = 1; mes <= p.parcelas; mes++) {
    if (mes > 1 && (mes - 1) % 12 === 0) {
      const f = 1 + p.ipca
      saldoCarta = saldoCarta * f
      cartaAjustada = cartaAjustada * f
      if (p.baseReajuste === 'totalContratado') {
        saldoCustas = saldoCustas * f
      }
      // Corrige o desconto acumulado pelo mesmo índice do contrato
      descontoAcumulado = descontoAcumulado * f
      const mesesRestantes = p.parcelas - mes + 1
      parcelaCarta = saldoCarta / mesesRestantes
      parcelaCustas = saldoCustas / mesesRestantes
    }

    const parcelaBase = parcelaCarta + parcelaCustas

    // Redutor de parcela: reduz até a contemplação; após, dilui o acumulado nas parcelas restantes
    let desconto = 0
    let adicional = 0
    if (p.redutorParcela > 0) {
      if (mes < p.parcelaContemplacao) {
        desconto = parcelaBase * p.redutorParcela
        descontoAcumulado += desconto
      } else if (descontoAcumulado > 0) {
        const mesesRestantes = p.parcelas - mes + 1
        adicional = descontoAcumulado / mesesRestantes
        descontoAcumulado -= adicional
      }
    }

    const parcela = parcelaBase - desconto + adicional

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

    // Para sorteio: crédito = cartaAjustada (sem abatimentos) no mês da contemplação
    if (!temLance && mes === p.parcelaContemplacao) {
      creditoLiberado = cartaAjustada
    }

    totalPago += parcela + lancePropio

    linhas.push({
      mes,
      parcela,
      lance: lancePropio,
      saldo: Math.max(0, saldoCarta + saldoCustas),
      saldoAjustado: Math.max(0, saldoCarta + saldoCustas),
      cartaAjustada,
      desconto: desconto > 0 ? desconto : (adicional > 0 ? -adicional : 0),
      lanceEmbutido: lanceEmb,
    })
  }

  // --- Cálculo do CET conforme metodologia selecionada ---
  let tirMensal: number
  let tirAnual: number
  let metodoCETUsado: MetodoCET = p.metodoCET
  let metodoCETFallback = false

  // Fluxo PV: crédito trazido a valor presente pelo IPCA posicionado em t=0
  const creditoPV = creditoLiberado / Math.pow(1 + p.ipca, p.parcelaContemplacao / 12)
  const fluxoPV = [creditoPV, ...linhas.map(l => -(l.parcela + l.lance))]
  const calcPV = () => {
    const m = irr(fluxoPV)
    return { tirMensal: m, tirAnual: Math.pow(1 + m, 12) - 1 }
  }

  if (p.metodoCET === 'pv') {
    const r = calcPV()
    tirMensal = r.tirMensal
    tirAnual = r.tirAnual
  } else if (p.metodoCET === 'tk') {
    const fluxoTk = construirFluxoConsorcioTk(linhas, creditoLiberado, p.parcelaContemplacao)
    const m = irr(fluxoTk)
    if (isNaN(m) || !isFinite(m)) {
      // Sem troca de sinal — fallback para PV
      const r = calcPV()
      tirMensal = r.tirMensal
      tirAnual = r.tirAnual
      metodoCETUsado = 'pv'
      metodoCETFallback = true
    } else {
      tirMensal = m
      tirAnual = Math.pow(1 + m, 12) - 1
    }
  } else {
    // mirr — perspectiva do credor: parcelas = inflows, crédito = outflow
    // Negamos o fluxoTk (tomador) para obter o fluxo do credor, evitando MIRR negativo.
    const taxaOpMensal = Math.pow(1 + p.taxaOportunidadeAnual, 1 / 12) - 1
    const fluxoTk = construirFluxoConsorcioTk(linhas, creditoLiberado, p.parcelaContemplacao)
    const fluxoMirr = fluxoTk.map(v => -v)
    tirMensal = mirr(fluxoMirr, taxaOpMensal)
    tirAnual = isNaN(tirMensal) ? NaN : Math.pow(1 + tirMensal, 12) - 1
  }

  const fluxoCET = [creditoLiberado, ...linhas.map(l => -(l.parcela + l.lance))]
  const vplVal = npv(tirMensal, fluxoCET.slice(1)) + fluxoCET[0]

  const tirAnualOpp = isNaN(tirAnual) ? NaN : (1 + tirAnual) * (1 + p.valorizacaoImovel) - 1

  return {
    saldoDevedor: totalContratado,
    parcelaInicial,
    totalPago,
    creditoLiberado,
    tirMensal,
    tirAnual,
    tirAnualOpp,
    vpl: vplVal,
    linhas,
    metodoCETUsado,
    metodoCETFallback: metodoCETFallback || undefined,
  }
}
