// PMT: pagamento periódico constante (sistema Price)
export function pmt(taxa: number, n: number, pv: number): number {
  if (taxa === 0) return pv / n
  return (pv * taxa * Math.pow(1 + taxa, n)) / (Math.pow(1 + taxa, n) - 1)
}

// NPV: valor presente líquido dado um fluxo de caixa (sem o investimento inicial)
export function npv(taxa: number, fluxos: number[]): number {
  return fluxos.reduce((acc, cf, i) => acc + cf / Math.pow(1 + taxa, i + 1), 0)
}

// IRR: bissecção + Newton-Raphson para fluxos irregulares
export function irr(fluxos: number[], LO = -0.99, HI = 10): number {
  const npvAt = (r: number) =>
    fluxos.reduce((acc, cf, t) => acc + cf / Math.pow(1 + r, t), 0)

  // Busca um intervalo com troca de sinal no range fornecido
  const STEPS = 2000
  let lo = NaN
  let hi = NaN
  let prev = npvAt(LO)
  for (let i = 1; i <= STEPS; i++) {
    const r = LO + (HI - LO) * (i / STEPS)
    const cur = npvAt(r)
    if (prev * cur <= 0) { lo = r - (HI - LO) / STEPS; hi = r; break }
    prev = cur
  }
  if (isNaN(lo)) return NaN

  // Bisseção para precisão de 1e-9
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2
    if (npvAt(lo) * npvAt(mid) <= 0) hi = mid; else lo = mid
    if (hi - lo < 1e-9) break
  }

  // Newton-Raphson a partir do centro da bissecção
  let taxa = (lo + hi) / 2
  for (let i = 0; i < 200; i++) {
    let f = 0, df = 0
    for (let t = 0; t < fluxos.length; t++) {
      const v = Math.pow(1 + taxa, t)
      f += fluxos[t] / v
      df -= t * fluxos[t] / (v * (1 + taxa))
    }
    if (Math.abs(df) < 1e-12) break
    const nova = taxa - f / df
    if (Math.abs(nova - taxa) < 1e-10) return nova
    taxa = nova
  }
  return taxa
}
