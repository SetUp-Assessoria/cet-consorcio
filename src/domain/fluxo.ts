import type { LinhaAmortizacao } from './types'

// Constrói o fluxo de caixa do consórcio com o crédito posicionado em t=k (mês da contemplação).
// O fluxo retornado tem comprimento = linhas.length + 1 (t=0 até t=n).
// t=0: 0 (sem desembolso inicial).
// t=mes: -(parcela + lance); e no mês da contemplação o crédito é somado ao fluxo daquele mês.
export function construirFluxoConsorcioTk(
  linhas: LinhaAmortizacao[],
  creditoLiberado: number,
  mesContemplacao: number,
): number[] {
  const fluxo: number[] = [0, ...linhas.map(l => -(l.parcela + l.lance))]
  const idx = Math.min(mesContemplacao, linhas.length) // t=k (1-based → index k)
  if (idx >= 1 && idx < fluxo.length) {
    fluxo[idx] += creditoLiberado
  }
  return fluxo
}
