import { useMemo, useState } from 'react'
import type { ConsorcioParams, FinanciamentoParams } from '../domain/types'
import { calcularConsorcio } from '../domain/consorcio'
import { calcularFinanciamento } from '../domain/financiamento'

export const DEFAULT_CONSORCIO: ConsorcioParams = {
  valorCarta: 200000,
  parcelas: 200,
  taxaAdm: 0.15,
  taxaAdesao: 0,
  taxaAdesaoMode: 'percentual',
  fundoReserva: 0.02,
  seguro: 0.00038,
  ipca: 0.055,
  tipoContemplacao: 'sorteio',
  parcelaContemplacao: 12,
  lance: 0,
  lanceMode: 'percentual',
  lanceEmbutido: 0,
  lanceEmbutidoMode: 'percentual',
  redutorParcela: 0,
  baseReajuste: 'totalContratado',
}

export const DEFAULT_FINANCIAMENTO: FinanciamentoParams = {
  valorCarta: 200000,
  valorEntrada: 40000,
  parcelas: 200,
  taxaJuros: Math.pow(1.11, 1 / 12) - 1,
  taxaJurosMode: 'anual',
  taxaMensal: 25,
  seguro: 0,
  indexador: 'TR',
  indiceAnual: 0.006,
}

export function useSimulacao() {
  const [consorcioParams, setConsorcioParams] = useState<ConsorcioParams>(DEFAULT_CONSORCIO)
  const [financiamentoParams, setFinanciamentoParams] = useState<FinanciamentoParams>(DEFAULT_FINANCIAMENTO)

  const resultadoConsorcio = useMemo(() => calcularConsorcio(consorcioParams), [consorcioParams])
  const resultadoFinanciamento = useMemo(() => calcularFinanciamento(financiamentoParams), [financiamentoParams])

  return {
    consorcioParams,
    setConsorcioParams,
    financiamentoParams,
    setFinanciamentoParams,
    resultadoConsorcio,
    resultadoFinanciamento,
  }
}
