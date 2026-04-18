export interface ConsorcioParams {
  valorCarta: number
  parcelas: number
  taxaAdm: number       // % a.m. ex: 0.0015
  taxaAdesao: number    // % ex: 0
  fundoReserva: number  // % a.m. ex: 0.0002
  seguro: number        // % a.m. ex: 0.00038
  ipca: number          // % a.a. ex: 0.055
  lance: number         // % ex: 0
  parcelaLance: number  // mês em que ocorre o lance
}

export interface FinanciamentoParams {
  valorCarta: number
  parcelas: number
  taxaJuros: number     // % a.m. ex: 0.015
  taxaAdesao: number    // % ex: 0.01
  fundoReserva: number  // % ex: 0.01
  seguro: number        // % ex: 0.01
  ipca: number          // % a.a.
  lance: number         // % ex: 0.60
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
