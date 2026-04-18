import { describe, it, expect } from 'vitest'
import { calcularConsorcio } from '../domain/consorcio'
import { calcularFinanciamento } from '../domain/financiamento'
import { pmt, irr, npv } from '../domain/financeiro'

// --- funções financeiras ---
describe('financeiro', () => {
  it('pmt: parcela constante Price', () => {
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
describe('calcularConsorcio', () => {
  const params = {
    valorCarta: 200000,
    parcelas: 90,
    taxaAdm: 0.15,
    taxaAdesao: 0,
    taxaAdesaoMode: 'percentual' as const,
    fundoReserva: 0.02,
    seguro: 0.00038,
    ipca: 0.055,
    valorizacaoImovel: 0,
    tipoContemplacao: 'sorteio' as const,
    parcelaContemplacao: 12,
    lance: 0,
    lanceMode: 'percentual' as const,
    lanceEmbutido: 0,
    lanceEmbutidoMode: 'percentual' as const,
    redutorParcela: 0,
    baseReajuste: 'totalContratado' as const,
  }

  it('saldo devedor inicial correto', () => {
    const r = calcularConsorcio(params)
    expect(r.saldoDevedor).toBeCloseTo(240840, 0)
  })

  it('parcela inicial = saldo / parcelas', () => {
    const r = calcularConsorcio(params)
    expect(r.parcelaInicial).toBeCloseTo(240840 / 90, 2)
  })

  it('total de linhas geradas = parcelas', () => {
    const r = calcularConsorcio(params)
    expect(r.linhas.length).toBe(90)
  })

  it('saldo na última parcela é zero (quitado)', () => {
    const r = calcularConsorcio(params)
    const ultima = r.linhas[r.linhas.length - 1]
    expect(ultima.saldo).toBeCloseTo(0, 0)
  })

  it('TIR anual positiva', () => {
    const r = calcularConsorcio(params)
    expect(r.tirAnual).toBeGreaterThan(0)
  })

  it('total pago maior que valor da carta', () => {
    const r = calcularConsorcio(params)
    expect(r.totalPago).toBeGreaterThan(params.valorCarta)
  })
})

// --- CET ajustado: t=k vs PV fallback ---
describe('CET ajustado (tirAnualOpp)', () => {
  const base = {
    valorCarta: 200000, parcelas: 200, taxaAdm: 0.15,
    taxaAdesao: 0, taxaAdesaoMode: 'percentual' as const, fundoReserva: 0.02,
    seguro: 0.00038, ipca: 0.055, valorizacaoImovel: 0.03,
    lance: 0, lanceMode: 'percentual' as const,
    lanceEmbutido: 0, lanceEmbutidoMode: 'percentual' as const,
    redutorParcela: 0, baseReajuste: 'totalContratado' as const,
  }

  it('sorteio k=12: CET ajustado > CET padrão (custo de espera)', () => {
    const r = calcularConsorcio({ ...base, tipoContemplacao: 'sorteio', parcelaContemplacao: 12 })
    expect(r.tirAnualOpp!).toBeGreaterThan(r.tirAnual)
  })

  it('lance 50% k=90: CET ajustado razoável (t=k converge, < 50%)', () => {
    const r = calcularConsorcio({ ...base, tipoContemplacao: 'lancePropio', parcelaContemplacao: 90, lance: 0.5 })
    expect(r.tirAnualOpp!).toBeGreaterThan(0)
    expect(r.tirAnualOpp!).toBeLessThan(0.5)
  })

  it('sorteio k=90: CET ajustado via fallback PV (positivo e finito)', () => {
    const r = calcularConsorcio({ ...base, tipoContemplacao: 'sorteio', parcelaContemplacao: 90 })
    expect(r.tirAnualOpp!).toBeGreaterThan(0)
    expect(isFinite(r.tirAnualOpp!)).toBe(true)
  })
})

// --- financiamento SAC TR ---
describe('calcularFinanciamento', () => {
  const params = {
    valorCarta: 500000,
    valorEntrada: 0,
    parcelas: 360,
    taxaJuros: 0.00910492618016678,
    taxaJurosMode: 'mensal' as const,
    taxaMensal: 0,
    seguro: 0,
    indexador: 'TR' as const,
    indiceAnual: Math.pow(1 + 0.0005, 12) - 1,
  }

  it('1ª prestação correta (planilha SAC TR)', () => {
    const r = calcularFinanciamento(params)
    // Planilha: 5944.32265496177
    expect(r.parcelaInicial).toBeCloseTo(5944.32, 0)
  })

  it('amortização mês 1 correta', () => {
    const r = calcularFinanciamento(params)
    // amortizacao_nominal × fatorAcum = (500000/360) × 1.0005 = 1389.58
    expect(r.linhas[0].amortizacao ?? 0).toBeCloseTo(1389.58, 0)
  })

  it('saldo final mês 1 correto', () => {
    const r = calcularFinanciamento(params)
    // Planilha: 498860.416666667
    expect(r.linhas[0].saldo).toBeCloseTo(498860, 0)
  })

  it('total pago maior que valor financiado', () => {
    const r = calcularFinanciamento(params)
    expect(r.totalPago).toBeGreaterThan(params.valorCarta)
  })
})
