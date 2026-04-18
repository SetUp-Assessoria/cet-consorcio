export type BaseReajuste = 'totalContratado' | 'valorCarta'

export type LanceMode = 'percentual' | 'financeiro'

export interface ConsorcioParams {
  valorCarta: number
  parcelas: number
  taxaAdm: number
  taxaAdesao: number
  fundoReserva: number
  seguro: number
  ipca: number
  lance: number        // fração (0–1) se percentual; R$ absoluto se financeiro
  lanceMode: LanceMode
  parcelaLance: number
  baseReajuste: BaseReajuste
}

export interface FinanciamentoParams {
  valorCarta: number
  parcelas: number
  taxaJuros: number     // % a.m. ex: 0.015
  taxaAdesao: number    // % ex: 0.01
  fundoReserva: number  // % ex: 0.01
  seguro: number        // % ex: 0.01
  ipca: number          // % a.a.
  lance: number         // fração (0–1) se percentual; R$ absoluto se financeiro
  lanceMode: LanceMode
  parcelaLance: number  // mês (0 = sem lance)
}

export interface LinhaAmortizacao {
  mes: number
  parcela: number
  lance: number
  saldo: number
  saldoAjustado: number
  cartaAjustada: number
}

export interface ResultadoSimulacao {
  saldoDevedor: number
  parcelaInicial: number
  totalPago: number
  tirMensal: number
  tirAnual: number
  vpl: number
  linhas: LinhaAmortizacao[]
}
