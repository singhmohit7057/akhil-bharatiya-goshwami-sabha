const MAP: Record<string, string> = {
  'shri': 'श्री', 'smt': 'श्रीमती', 'kumar': 'कुमार', 'kumari': 'कुमारी',
  'ksh': 'क्ष', 'gya': 'ज्ञ', 'tra': 'त्र', 'shr': 'श्र', 'shh': 'षः',
  'bh': 'भ', 'ch': 'च', 'dh': 'ध', 'gh': 'घ', 'jh': 'झ', 'kh': 'ख',
  'ph': 'फ', 'sh': 'श', 'th': 'थ', 'ng': 'ं',
  'aa': 'ा', 'ee': 'ी', 'oo': 'ू', 'ai': 'ै', 'au': 'ौ', 'ou': 'ौ',
  'a': 'अ', 'b': 'ब', 'c': 'क', 'd': 'द', 'e': 'ए', 'f': 'फ',
  'g': 'ग', 'h': 'ह', 'i': 'इ', 'j': 'ज', 'k': 'क', 'l': 'ल',
  'm': 'म', 'n': 'न', 'o': 'ओ', 'p': 'प', 'q': 'क', 'r': 'र',
  's': 'स', 't': 'त', 'u': 'उ', 'v': 'व', 'w': 'व', 'x': 'क्स',
  'y': 'य', 'z': 'ज़',
}

const VOWELS = new Set(['a', 'e', 'i', 'o', 'u'])
const MATRA: Record<string, string> = {
  'अ': '', 'आ': 'ा', 'इ': 'ि', 'ई': 'ी', 'उ': 'ु', 'ऊ': 'ू',
  'ए': 'े', 'ऐ': 'ै', 'ओ': 'ो', 'औ': 'ौ',
  'ा': 'ा', 'ी': 'ी', 'ू': 'ू', 'ै': 'ै', 'ौ': 'ौ',
}

export function transliterateToHindi(text: string): string {
  return text.split(' ').map(transliterateWord).join(' ')
}

function transliterateWord(word: string): string {
  if (!word) return ''
  const lower = word.toLowerCase()
  const result: string[] = []
  let i = 0
  let lastWasConsonant = false

  while (i < lower.length) {
    let matched = ''
    let hindi = ''

    for (let len = 4; len >= 1; len--) {
      const chunk = lower.substring(i, i + len)
      if (MAP[chunk]) {
        matched = chunk
        hindi = MAP[chunk]
        break
      }
    }

    if (!matched) {
      result.push(lower[i])
      lastWasConsonant = false
      i++
      continue
    }

    const isVowel = VOWELS.has(matched[0]) && matched.length <= 2 && !['bh','ch','dh','gh','jh','kh','ph','sh','th'].includes(matched)

    if (isVowel && lastWasConsonant) {
      const matra = MATRA[hindi]
      if (matra !== undefined) {
        result.push(matra)
      } else {
        result.push(hindi)
      }
      lastWasConsonant = false
    } else if (!isVowel) {
      if (lastWasConsonant) {
        result.push('्')
      }
      result.push(hindi)
      lastWasConsonant = true
    } else {
      result.push(hindi)
      lastWasConsonant = false
    }

    i += matched.length
  }

  if (lastWasConsonant) {
    result.push('्')
  }

  let finalStr = result.join('')
  finalStr = finalStr.replace(/अ्/g, '')
  finalStr = finalStr.replace(/्$/g, '')

  return finalStr
}
