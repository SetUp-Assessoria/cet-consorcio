import { useMemo, useState } from 'react'
import type { ConsorcioParams, FinanciamentoParams } from '../domain/types'
import { calcularConsorcio } from '../domain/consorcio'
import { calcularFinanciamento } from '../domain/financiamento'

export const DEFAULT_CONSORCIO: ConsorcioParams = {
  valorCarta: 200000,
  parcelas: 90,
  taxaAdm: 0.15,
  taxaAdesao: 0,
  taxaAdesaoMode: 'percentual',
  fundoReserva: 0.02,
  seguro: 0.00038,
  ipca: 0.055,
  lance: 0,
  lanceMode: 'percentual',
  parcelaLance: 12,
  baseReajuste: 'totalContratado',
}

export const DEFAULT_FINANCIAMENTO: FinanciamentoParams = {
  valorCarta: 200000,
  parcelas: 200,
  taxaJuros: 0.015,
  taxaJurosMode: 'mensal',
  taxaMensal: 0,
  fundoReserva: 0.01,
  seguro: 0.01,
  indexador: 'IPCA',
  indiceAnual: 0.055,
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
