import { PDFParse } from 'pdf-parse';

const LINE_ITEM_PATTERN = /^(\d{2}\/\d{2}(?:\/\d{2,4})?)\s+(.+?)\s+(-?[\d.]+,\d{2})$/;
const INSTALLMENT_SUFFIX_PATTERN = /^(.*?)\s+(\d{1,2})\/(\d{1,2})$/;
const IGNORED_LINE_KEYWORDS = ['TOTAL', 'SALDO', 'LIMITE', 'SUBTOTAL', 'PAGAMENTO EFETUADO', 'FATURA ANTERIOR'];

function parseBrlAmountToCents(rawAmount) {
  const normalized = rawAmount.replace(/\./g, '').replace(',', '.');
  const value = Number(normalized);
  if (!Number.isFinite(value)) return null;
  return Math.round(value * 100);
}

/**
 * Extração best-effort de itens de fatura a partir do texto de um PDF.
 * Funciona para faturas em PDF com texto selecionável (não escaneadas/foto),
 * reconhecendo linhas no padrão "DD/MM  Descrição  123,45", incluindo o
 * sufixo de parcelamento comum em faturas brasileiras ("Descrição 03/12").
 * Linhas que não seguem esse padrão (cabeçalhos, totais, etc.) são ignoradas.
 */
export function parseFaturaText(text) {
  const lines = text
    .split('\n')
    .map((line) => line.trim().replace(/\s+/g, ' '))
    .filter(Boolean);

  const items = [];

  for (const line of lines) {
    const match = line.match(LINE_ITEM_PATTERN);
    if (!match) continue;

    const [, , rawDescription, rawAmount] = match;
    const upperLine = line.toUpperCase();
    if (IGNORED_LINE_KEYWORDS.some((keyword) => upperLine.includes(keyword))) continue;

    const valorCents = parseBrlAmountToCents(rawAmount);
    if (valorCents === null || valorCents <= 0) continue;

    let descricao = rawDescription.trim();
    let parcelaAtual = null;
    let numeroParcelas = null;

    const installmentMatch = descricao.match(INSTALLMENT_SUFFIX_PATTERN);
    if (installmentMatch) {
      const [, baseDescription, current, total] = installmentMatch;
      const currentNum = Number(current);
      const totalNum = Number(total);
      if (currentNum >= 1 && totalNum >= 1 && currentNum <= totalNum && baseDescription.trim()) {
        descricao = baseDescription.trim();
        parcelaAtual = currentNum;
        numeroParcelas = totalNum;
      }
    }

    if (!descricao) continue;

    items.push({ descricao, valorCents, parcelaAtual, numeroParcelas });
  }

  return items;
}

export async function parseFaturaPdf(buffer) {
  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getText();
    return parseFaturaText(result.text ?? '');
  } finally {
    await parser.destroy?.();
  }
}
