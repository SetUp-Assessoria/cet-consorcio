export type BaseReajuste = 'totalContratado' | 'valorCarta'
export type LanceMode = 'percentual' | 'financeiro'
export type TipoContemplacao = 'sorteio' | 'lancePropio' | 'lanceEmbutido' | 'lanceEmbutidoMaisPropio'

export interface ConsorcioParams {
  valorCarta: number
  parcelas: number
  taxaAdm: number
  taxaAdesao: number
  taxaAdesaoMode: LanceMode
  fundoReserva: number
  seguro: number
  ipca: number
  valorizacaoImovel: number      // valorização esperada do imóvel acima do IPCA (a.a.)
  tipoContemplacao: TipoContemplacao
  parcelaContemplacao: number
  lance: number
  lanceMode: LanceMode
  lanceEmbutido: number
  lanceEmbutidoMode: LanceMode
  redutorParcela: number         // fração (0–1) — reduz a parcela até a contemplação
  baseReajuste: BaseReajuste
}

export type TaxaJurosMode = 'mensal' | 'anual'
export type Indexador = 'IPCA' | 'INCC' | 'TR'

export interface FinanciamentoParams {
  valorCarta: number            // valor do bem
  valorEntrada: number          // entrada (não financiada)
  parcelas: number
  taxaJuros: number
  taxaJurosMode: TaxaJurosMode
  taxaMensal: number
  seguro: number
  indexador: Indexador
  indiceAnual: number
}

export interface LinhaAmortizacao {
  mes: number
  parcela: number
  lance: number
  saldo: number
  saldoAjustado: number
  cartaAjustada: number
  // SAC breakdown (financiamento only)
  amortizacao?: number
  juros?: number
  correcao?: number
  // Consórcio com redutor: desconto aplicado na parcela neste mês
  desconto?: number
  // Consórcio: lance embutido (sai do crédito, não do bolso)
  lanceEmbutido?: number
}

export interface ResultadoSimulacao {
  saldoDevedor: number
  parcelaInicial: number
  totalPago: number
  creditoLiberado: number
  tirMensal: number
  tirAnual: number
  tirAnualOpp?: number   // CET: t=k para contempl. < 48 meses; t=0 para ≥ 48
  vpl: number
  linhas: LinhaAmortizacao[]
}
