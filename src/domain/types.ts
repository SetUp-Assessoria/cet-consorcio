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

export type TaxaJurosMode = 'mensal' | 'anual'
export type Indexador = 'IPCA' | 'INCC' | 'TR'

export interface FinanciamentoParams {
  valorCarta: number
  parcelas: number
  taxaJuros: number         // sempre % a.m. (domínio usa esta)
  taxaJurosMode: TaxaJurosMode
  taxaMensal: number        // tarifa mensal fixa em R$
  fundoReserva: number      // % ex: 0.01
  seguro: number            // % ex: 0.01
  indexador: Indexador
  indiceAnual: number       // taxa a.a. do indexador escolhido
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
  creditoLiberado: number  // valor da carta no mês do lance subtraído o lance
  tirMensal: number
  tirAnual: number
  vpl: number
  linhas: LinhaAmortizacao[]
}
