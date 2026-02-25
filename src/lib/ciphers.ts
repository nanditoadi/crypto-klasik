// Logika 5 Algoritma Kriptografi Klasik // 

export type Step = { d: string; v: string }
export type Result = { output: string; steps: Step[]; error?: string }
export type Mode = 'encrypt' | 'decrypt'
export type Matrix3 = number[][]

// Helpers //
export const mod = (n: number, m: number) => ((n % m) + m) % m
export const c2n = (c: string) => c.charCodeAt(0) - 65
export const n2c = (n: number) => String.fromCharCode(mod(n, 26) + 65)
export const clean = (s: string) => s.toUpperCase().replace(/[^A-Z]/g, '')

export function modInv(a: number, m: number): number {
  for (let x = 1; x < m; x++) if ((a * x) % m === 1) return x
  return -1
}

// Vigenere //
export function vigenere(input: string, key: string, mode: Mode): Result {
  const k = clean(key)
  const p = clean(input)
  if (!k) return { output: '', steps: [], error: 'Kunci tidak boleh kosong' }
  if (!p) return { output: '', steps: [] }

  const steps: Step[] = []
  let output = ''

  for (let i = 0; i < p.length; i++) {
    const pv = c2n(p[i])
    const kv = c2n(k[i % k.length])
    const cv = mode === 'encrypt' ? mod(pv + kv, 26) : mod(pv - kv, 26)
    output += n2c(cv)
    if (i < 10)
      steps.push({
        d: `${p[i]}(${pv}) ${mode === 'encrypt' ? '+' : '−'} ${k[i % k.length]}(${kv}) = ${mod(mode === 'encrypt' ? pv + kv : pv - kv, 26)} mod 26`,
        v: n2c(cv),
      })
  }
  if (p.length > 10) steps.push({ d: `... +${p.length - 10} karakter lainnya`, v: '' })
  return { output, steps }
}

// Affine //
export const VALID_A = [1, 3, 5, 7, 9, 11, 15, 17, 19, 21, 23, 25]

export function affine(input: string, a: number, b: number, mode: Mode): Result {
  if (!VALID_A.includes(a))
    return {
      output: '',
      steps: [{ d: 'Nilai a tidak valid', v: '✗' }],
      error: `a=${a} tidak valid. Harus relatif prima dengan 26.\nValid: ${VALID_A.join(', ')}`,
    }
  const p = clean(input)
  if (!p) return { output: '', steps: [] }

  const aInv = modInv(a, 26)
  const steps: Step[] = [{ d: `a=${a}, b=${b}${mode === 'decrypt' ? `, a⁻¹=${aInv}` : ''}`, v: '' }]
  let output = ''

  for (let i = 0; i < p.length; i++) {
    const pv = c2n(p[i])
    let cv: number
    if (mode === 'encrypt') {
      cv = mod(a * pv + b, 26)
      if (i < 8) steps.push({ d: `(${a}×${pv}+${b}) mod 26 = ${a * pv + b} mod 26`, v: n2c(cv) })
    } else {
      cv = mod(aInv * (pv - b), 26)
      if (i < 8) steps.push({ d: `${aInv}×(${pv}−${b}) mod 26 = ${aInv * (pv - b)} mod 26`, v: n2c(cv) })
    }
    output += n2c(cv)
  }
  if (p.length > 8) steps.push({ d: `... +${p.length - 8} karakter lagi`, v: '' })
  return { output, steps }
}

// Playfair //
function buildMatrix(keyword: string): string {
  const key = clean(keyword).replace(/J/g, 'I')
  const alpha = 'ABCDEFGHIKLMNOPQRSTUVWXYZ'
  let seen = ''
  for (const c of key + alpha) if (!seen.includes(c)) seen += c
  return seen
}

function pfPos(mx: string, ch: string): [number, number] {
  const c = ch === 'J' ? 'I' : ch
  const i = mx.indexOf(c)
  return [Math.floor(i / 5), i % 5]
}

export function playfair(input: string, keyword: string, mode: Mode): Result {
  if (!keyword) return { output: '', steps: [], error: 'Kunci tidak boleh kosong' }
  const mx = buildMatrix(keyword)
  let text = clean(input).replace(/J/g, 'I')
  if (!text) return { output: '', steps: [] }

  const dir = mode === 'encrypt' ? 1 : -1

  if (mode === 'encrypt') {
    let prep = ''
    let i = 0
    while (i < text.length) {
      prep += text[i]
      if (i + 1 < text.length) {
        if (text[i] === text[i + 1]) prep += 'X'
        else { prep += text[i + 1]; i++ }
      }
      i++
    }
    if (prep.length % 2 !== 0) prep += 'X'
    text = prep
  }

  const mxDisplay = Array.from({ length: 5 }, (_, r) =>
    mx.slice(r * 5, (r + 1) * 5).split('').join(' ')
  ).join(' | ')

  const steps: Step[] = [
    { d: `Matriks: ${mxDisplay}`, v: '' },
    { d: `Input: ${text} (${text.length / 2} bigram)`, v: '' },
  ]

  let output = ''
  for (let i = 0; i < text.length; i += 2) {
    const a = text[i], b = text[i + 1] || 'X'
    const [r1, c1] = pfPos(mx, a)
    const [r2, c2] = pfPos(mx, b)
    let ca: string, cb: string, rule: string

    if (r1 === r2) {
      ca = mx[r1 * 5 + mod(c1 + dir, 5)]
      cb = mx[r2 * 5 + mod(c2 + dir, 5)]
      rule = 'baris sama'
    } else if (c1 === c2) {
      ca = mx[mod(r1 + dir, 5) * 5 + c1]
      cb = mx[mod(r2 + dir, 5) * 5 + c2]
      rule = 'kolom sama'
    } else {
      ca = mx[r1 * 5 + c2]
      cb = mx[r2 * 5 + c1]
      rule = 'persegi panjang'
    }
    output += ca + cb
    if (steps.length < 14) steps.push({ d: `[${a}${b}] (${r1},${c1})+(${r2},${c2}) → ${rule}`, v: ca + cb })
  }
  if (text.length / 2 > 12) steps.push({ d: `... +${text.length / 2 - 12} bigram lagi`, v: '' })
  return { output, steps }
}

// Hill //
function det3(M: Matrix3): number {
  return (
    M[0][0] * (M[1][1] * M[2][2] - M[1][2] * M[2][1]) -
    M[0][1] * (M[1][0] * M[2][2] - M[1][2] * M[2][0]) +
    M[0][2] * (M[1][0] * M[2][1] - M[1][1] * M[2][0])
  )
}

function invMatrix26(M: Matrix3): Matrix3 | null {
  const d = mod(det3(M), 26)
  const di = modInv(d, 26)
  if (di === -1) return null
  const cof = (r: number, c: number): number => {
    const rs = [0, 1, 2].filter((x) => x !== r)
    const cs = [0, 1, 2].filter((x) => x !== c)
    const val = M[rs[0]][cs[0]] * M[rs[1]][cs[1]] - M[rs[0]][cs[1]] * M[rs[1]][cs[0]]
    return ((r + c) % 2 === 0 ? 1 : -1) * val
  }
  return [0, 1, 2].map((r) => [0, 1, 2].map((c) => mod(di * cof(c, r), 26)))
}

export function hill(input: string, K: Matrix3, mode: Mode): Result {
  let text = clean(input)
  if (!text) return { output: '', steps: [] }
  while (text.length % 3 !== 0) text += 'X'

  const steps: Step[] = []
  const d = mod(det3(K), 26)
  steps.push({ d: `K=[[${K[0].join(',')}],[${K[1].join(',')}],[${K[2].join(',')}]] | det mod 26=${d}`, v: '' })

  let useK = K
  if (mode === 'decrypt') {
    const inv = invMatrix26(K)
    if (!inv)
      return {
        output: '',
        steps,
        error: 'Matriks tidak invertible mod 26. Ganti nilai kunci.',
      }
    useK = inv
    steps.push({ d: `K⁻¹=[[${inv[0].join(',')}],[${inv[1].join(',')}],[${inv[2].join(',')}]]`, v: '' })
  }

  let output = ''
  for (let i = 0; i < text.length; i += 3) {
    const v = [c2n(text[i]), c2n(text[i + 1]), c2n(text[i + 2])]
    const res = useK.map((row) => mod(row.reduce((s, x, j) => s + x * v[j], 0), 26))
    const chars = res.map(n2c).join('')
    output += chars
    if (i < 30) steps.push({ d: `[${text.slice(i, i + 3)}]=(${v.join(',')})×K=(${res.join(',')})`, v: chars })
  }
  return { output, steps }
}

// Enigma //
export const DEFAULT_ROTORS = [
  'EKMFLGDQVZNTOWYHXUSPAIBRCJ',
  'AJDKSIRUXBLHWTMCQGZNPYFVOE',
  'BDFHJLCPRTXVZNYEIWGAKMUSQO',
]
const ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

export function enigma(input: string, rotors: string[], mode: Mode): Result {
  const text = clean(input)
  if (!text) return { output: '', steps: [] }
  for (const r of rotors)
    if (r.length !== 26)
      return { output: '', steps: [], error: 'Setiap rotor harus berisi tepat 26 huruf.' }

  const steps: Step[] = [{ d: 'Rotor berputar K0→K1→K2→K0→...', v: '' }]
  let output = ''

  for (let i = 0; i < text.length; i++) {
    const ri = i % 3
    const rotor = rotors[ri]
    const c = mode === 'encrypt' ? rotor[c2n(text[i])] : ALPHA[rotor.indexOf(text[i])]
    output += c
    if (i < 12) steps.push({ d: `i=${i} | K${ri} | ${text[i]} → ${c}`, v: c })
  }
  if (text.length > 12) steps.push({ d: `... +${text.length - 12} karakter lagi`, v: '' })
  return { output, steps }
}
