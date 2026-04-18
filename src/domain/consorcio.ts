import type { ConsorcioParams, LinhaAmortizacao, ResultadoSimulacao } from './types'
import { irr, npv } from './financeiro'

export function calcularConsorcio(p: ConsorcioParams): ResultadoSimulacao {
  const fatorCustas = p.taxaAdm + p.taxaAdesao + p.fundoReserva + p.seguro
  const totalContratado = p.valorCarta * (1 + fatorCustas)
  const valorLance = totalContratado * p.lance

  // Divide o total em componente carta e componente custas
  // Isso permite reajustar só a carta quando baseReajuste = 'valorCarta'
  let parcelaCarta = p.valorCarta / p.parcelas
  let parcelaCustas = (p.valorCarta * fatorCustas) / p.parcelas

  // Saldo também é rastreado em duas partes para o mesmo motivo
  let saldoCarta = p.valorCarta
  let saldoCustas = p.valorCarta * fatorCustas
  let cartaAjustada = p.valorCarta

  const linhas: LinhaAmortizacao[] = []
  let totalPago = 0
  const fluxoIRR: number[] = [p.valorCarta]

  for (let mes = 1; mes <= p.parcelas; mes++) {
    if (mes > 1 && (mes - 1) % 12 === 0) {
      const f = 1 + p.ipca
      // Carta sempre reajustada
      parcelaCarta = parcelaCarta * f
      saldoCarta = saldoCarta * f
      cartaAjustada = cartaAjustada * f

      // Custas: reajustadas só se baseReajuste = 'totalContratado'
      if (p.baseReajuste === 'totalContratado') {
        parcelaCustas = parcelaCustas * f
        saldoCustas = saldoCustas * f
      }
    }

    const parcela = parcelaCarta + parcelaCustas
    const lanceAtual = mes === p.parcelaLance && p.lance > 0 ? valorLance : 0
    const pagamentoMes = parcela + lanceAtual

    saldoCarta -= parcelaCarta
    saldoCustas -= parcelaCustas
    totalPago += pagamentoMes
    fluxoIRR.push(-pagamentoMes)

    linhas.push({
      mes,
      parcela,
      lance: lanceAtual,
      saldo: Math.max(0, saldoCarta + saldoCustas),
      saldoAjustado: Math.max(0, saldoCarta + saldoCustas),
      cartaAjustada,
    })
  }

  const parcelaInicial = p.valorCarta * (1 + fatorCustas) / p.parcelas
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
