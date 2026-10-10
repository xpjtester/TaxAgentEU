// All amounts are integer euro cents. This is a draft calculator, not a filing engine.
export function calculateVatDraft(invoices) {
  const totals = { outputVatCents: 0, inputVatCents: 0, review: [] };
  for (const invoice of invoices) {
    if (!invoice.id || !["sale", "purchase"].includes(invoice.kind) || !Number.isSafeInteger(invoice.vatCents) || invoice.vatCents < 0) {
      throw new Error("Invalid invoice");
    }
    if (invoice.reviewRequired || invoice.vatTreatment !== "domestic-standard" || invoice.kind === "purchase" && invoice.deductible !== true) {
      totals.review.push(invoice.id);
      continue;
    }
    if (invoice.kind === "sale") totals.outputVatCents += invoice.vatCents;
    else totals.inputVatCents += invoice.vatCents;
  }
  return { ...totals, estimatedPayableCents: totals.outputVatCents - totals.inputVatCents, status: "DRAFT_NOT_FOR_FILING" };
}
