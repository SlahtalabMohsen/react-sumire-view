const PARTICLES = new Set([
  'は', 'が', 'を', 'に', 'で', 'と', 'も', 'の', 'から', 'まで',
  'より', 'へ', 'ば', 'として', 'について', 'にとって', 'によって',
]);

const POSTPOSITIONS = new Set([
  'さん', 'くん', 'ちゃん', 'たち', 'ら', '様', '様たち',
]);

const PUNCTUATION = /[。、！？.!?,;:…・-]/;

export function segmentJapanese(text: string): string {
  const result: string[] = [];
  let i = 0;

  while (i < text.length) {
    if (PUNCTUATION.test(text[i])) {
      result.push(text[i]);
      i++;
      continue;
    }

    let matched = false;

    for (const p of PARTICLES) {
      if (text.startsWith(p, i) && i > 0) {
        result.push('\u2009' + p);
        i += p.length;
        matched = true;
        break;
      }
    }
    if (matched) continue;

    for (const pp of POSTPOSITIONS) {
      if (text.startsWith(pp, i)) {
        result.push(pp);
        i += pp.length;
        matched = true;
        break;
      }
    }
    if (matched) continue;

    if (text[i] === ' ' || text[i] === '\u3000') {
      result.push(' ');
      i++;
      continue;
    }

    result.push(text[i]);
    i++;
  }

  return result.join('');
}
