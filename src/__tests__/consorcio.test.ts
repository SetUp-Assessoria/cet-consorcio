import { describe, it, expect } from 'vitest'
import { calcularConsorcio } from '../domain/consorcio'
import { calcularFinanciamento } from '../domain/financiamento'
import { pmt, irr, npv } from '../domain/financeiro'

// --- funções financeiras ---
describe('financeiro', () => {
  it('pmt: parcela constante Price', () => {
    // Validação: PMT(0.015, 200, 200000) calculado analiticamente
    const result = pmt(0.015, 200, 200000)
    expect(result).toBeCloseTo(3160.92, 0)
  })

  it('irr: retorna taxa para fluxo simples', () => {
    const taxa = irr([-100, 110])
    expect(taxa).toBeCloseTo(0.1, 5)
  })

  it('npv: valor presente líquido', () => {
    const resultado = npv(0.1, [110])
    expect(resultado).toBeCloseTo(100, 1)
  })
})

// --- consórcio ---
// Parâmetros espelho da planilha (taxas são % total sobre carta, não mensal)
// taxaAdm=15%, fundoReserva=2%, seguro=0.038% conforme análise
describe('calcularConsorcio', () => {
  const params = {
    valorCarta: 200000,
    parcelas: 90,
    taxaAdm: 0.15,      // 15% total
    taxaAdesao: 0,
    fundoReserva: 0.02, // 2% total
    seguro: 0.00038,    // 0.038%
    ipca: 0.055,
    lance: 0,
    parcelaLance: 12,
  }

  it('saldo devedor inicial correto', () => {
    const r = calcularConsorcio(params)
    // 200000 × (1 + 0.15 + 0 + 0.02 + 0.00038) = 200000 × 1.17038 = 234076
    expect(r.saldoDevedor).toBeCloseTo(234076, 0)
  })

  it('parcela inicial = saldo / parcelas', () => {
    const r = calcularConsorcio(params)
    expect(r.parcelaInicial).toBeCloseTo(234076 / 90, 2)
  })

  it('total de linhas geradas = parcelas', () => {
    const r = calcularConsorcio(params)
    expect(r.linhas.length).toBe(90)
  })

  it('saldo ajustado final ≈ zero (quitado)', () => {
    const r = calcularConsorcio(params)
    const ultima = r.linhas[r.linhas.length - 1]
    // saldoAjustado pode ter resíduo mínimo por arredondamento IPCA
    expect(Math.abs(ultima.saldoAjustado)).toBeLessThan(50)
  })

  it('TIR anual positiva (custo efetivo acima de zero)', () => {
    const r = calcularConsorcio(params)
    expect(r.tirAnual).toBeGreaterThan(0)
  })

  it('total pago maior que valor da carta', () => {
    const r = calcularConsorcio(params)
    expect(r.totalPago).toBeGreaterThan(params.valorCarta)
  })
})

// --- financiamento ---
describe('calcularFinanciamento', () => {
  const params = {
    valorCarta: 200000,
    parcelas: 200,
    taxaJuros: 0.015,
    taxaAdesao: 0.01,
    fundoReserva: 0.01,
    seguro: 0.01,
    ipca: 0.055,
    lance: 0.60,
    parcelaLance: 0,
  }

  it('saldo devedor inicial correto', () => {
    const r = calcularFinanciamento(params)
    // 200000 × (1 + 0.01 + 0.01 + 0.01) = 206000
    expect(r.saldoDevedor).toBeCloseTo(206000, 0)
  })

  it('parcela inicial positiva', () => {
    const r = calcularFinanciamento(params)
    expect(r.parcelaInicial).toBeGreaterThan(0)
  })

  it('total pago maior que valor da carta', () => {
    const r = calcularFinanciamento(params)
    expect(r.totalPago).toBeGreaterThan(params.valorCarta)
  })

  it('TIR anual coerente (positiva)', () => {
    const r = calcularFinanciamento(params)
    expect(r.tirAnual).toBeGreaterThan(0)
  })
})
