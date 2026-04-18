// PMT: pagamento periódico constante (sistema Price)
export function pmt(taxa: number, n: number, pv: number): number {
  if (taxa === 0) return pv / n
  return (pv * taxa * Math.pow(1 + taxa, n)) / (Math.pow(1 + taxa, n) - 1)
}

// NPV: valor presente líquido dado um fluxo de caixa (sem o investimento inicial)
export function npv(taxa: number, fluxos: number[]): number {
  return fluxos.reduce((acc, cf, i) => acc + cf / Math.pow(1 + taxa, i + 1), 0)
}

// IRR: taxa interna de retorno por Newton-Raphson
export function irr(fluxos: number[], guess = 0.01): number {
  const MAX_ITER = 1000
  const TOLERANCIA = 1e-7
  let taxa = guess

  for (let i = 0; i < MAX_ITER; i++) {
    let f = 0
    let df = 0
    for (let t = 0; t < fluxos.length; t++) {
      const v = Math.pow(1 + taxa, t)
      f += fluxos[t] / v
      df -= t * fluxos[t] / (v * (1 + taxa))
    }
    if (Math.abs(df) < 1e-12) break
    const novaTaxa = taxa - f / df
    if (Math.abs(novaTaxa - taxa) < TOLERANCIA) return novaTaxa
    taxa = novaTaxa
  }
  return taxa
}
