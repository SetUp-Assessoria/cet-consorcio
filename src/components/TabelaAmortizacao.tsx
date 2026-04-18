import type { LinhaAmortizacao } from '../domain/types'
import { moeda } from '../utils/format'

interface Props {
  linhas: LinhaAmortizacao[]
  label: string
  color: 'blue' | 'orange'
}

export function TabelaAmortizacao({ linhas, label, color }: Props) {
  const borderColor = color === 'blue' ? 'border-blue-200' : 'border-orange-200'
  const labelColor = color === 'blue' ? 'text-blue-700' : 'text-orange-700'

  return (
    <div className={`rounded-xl border ${borderColor} overflow-hidden`}>
      <p className={`px-3 py-2 text-xs font-semibold uppercase tracking-wide ${labelColor} bg-white border-b ${borderColor}`}>
        {label}
      </p>
      <div className="overflow-auto" style={{ maxHeight: 340 }}>
        <table className="w-full text-xs border-collapse">
          <thead className="sticky top-0 bg-slate-100 z-10">
            <tr>
              {['Mês', 'Parcela', 'Lance', 'Saldo', 'Saldo Aj.', 'Carta Aj.'].map((h) => (
                <th key={h} className="px-2 py-2 text-right first:text-left font-semibold text-slate-600 border-b border-slate-200">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {linhas.map((l, i) => (
              <tr key={l.mes} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                <td className="px-2 py-1 text-left text-slate-500">{l.mes}</td>
                <td className="px-2 py-1 text-right">{moeda(l.parcela)}</td>
                <td className={`px-2 py-1 text-right ${l.lance > 0 ? 'font-semibold text-purple-600' : 'text-slate-400'}`}>
                  {l.lance > 0 ? moeda(l.lance) : '—'}
                </td>
                <td className="px-2 py-1 text-right">{moeda(Math.max(0, l.saldo))}</td>
                <td className="px-2 py-1 text-right">{moeda(Math.max(0, l.saldoAjustado))}</td>
                <td className="px-2 py-1 text-right">{moeda(l.cartaAjustada)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
