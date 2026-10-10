// Conservative exact matching only; ambiguous matches must be reviewed.
export function reconcile(transactions, invoices) {
  const used = new Set();
  return transactions.map(tx => {
    if (!tx.id || !Number.isSafeInteger(tx.amountCents) || !/^\\d{4}-\\d{2}-\\d{2}$/.test(tx.date)) throw new Error("Invalid transaction");
    const candidates = invoices.filter(inv => !used.has(inv.id) && inv.currency === "EUR" && tx.currency === "EUR" && Number.isSafeInteger(inv.totalCents) && tx.amountCents === (inv.kind === "sale" ? inv.totalCents : -inv.totalCents) && inv.counterpartyIban && tx.counterpartyIban && inv.counterpartyIban.replace(/\\s/g,"").toUpperCase() === tx.counterpartyIban.replace(/\\s/g,"").toUpperCase() && inv.date === tx.date);
    if (candidates.length !== 1) return { transactionId: tx.id, status: "NEEDS_REVIEW", candidateInvoiceIds: candidates.map(x=>x.id) };
    used.add(candidates[0].id);
    return { transactionId: tx.id, invoiceId: candidates[0].id, status: "MATCHED_EXACT" };
  });
}
