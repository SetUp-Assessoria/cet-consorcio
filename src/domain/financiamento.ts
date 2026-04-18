import type { FinanciamentoParams, LinhaAmortizacao, ResultadoSimulacao } from './types'
import { irr, npv } from './financeiro'

export function calcularFinanciamento(p: FinanciamentoParams): ResultadoSimulacao {
  // Taxa mensal do indexador (TR, IPCA ou INCC) — equivalente ao índice anual
  const tc = Math.pow(1 + p.indiceAnual, 1 / 12) - 1

  const valorFinanciado = Math.max(0, p.valorCarta - p.valorEntrada)
  const saldoInicial = valorFinanciado * (1 + p.seguro)

  // Amortização nominal (SAC): fixa sobre o PV original
  const amortizacaoNominal = saldoInicial / p.parcelas

  const linhas: LinhaAmortizacao[] = []
  let saldo = saldoInicial
  let cartaAjustada = valorFinanciado
  let fatorAcum = 1       // fator TR/índice acumulado (começa em 1)
  let totalPago = 0

  const fluxoIRR: number[] = [valorFinanciado]

  for (let mes = 1; mes <= p.parcelas; mes++) {
    // 1. Acumula o fator do indexador
    fatorAcum = fatorAcum * (1 + tc)

    // 2. Corrige o saldo devedor pelo indexador mensal
    const saldoCorrigido = saldo * (1 + tc)
    const correcao = saldoCorrigido - saldo

    // 3. Amortização corrigida = amortização nominal × fator acumulado (cresce com o índice)
    const amortizacao = amortizacaoNominal * fatorAcum

    // 4. Juros sobre saldo corrigido
    const juros = saldoCorrigido * p.taxaJuros

    // 5. Prestação = amortização corrigida + juros + tarifa mensal fixa
    const parcela = amortizacao + juros + p.taxaMensal

    // 6. Novo saldo = SD corrigido − amortização corrigida
    saldo = Math.max(0, saldoCorrigido - amortizacao)

    // 7. Atualiza carta pelo mesmo indexador
    cartaAjustada = cartaAjustada * (1 + tc)

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
      correcao,
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
    creditoLiberado: valorFinanciado,
    tirMensal,
    tirAnual,
    vpl: vplVal,
    linhas,
  }
}
