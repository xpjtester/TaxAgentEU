// Schema validation for manually extracted invoice data; OCR integration is pending.
export function normalizeInvoice(raw){
  if(!raw||typeof raw!=="object")throw Error("Invoice required");
  const {id,kind,date,currency,totalCents,vatCents,counterpartyIban}=raw;
  if(typeof id!=="string"||!id.trim()||!["purchase","sale"].includes(kind)||!/^\d{4}-\d{2}-\d{2}$/.test(date)||currency!=="EUR"||!Number.isSafeInteger(totalCents)||totalCents<0||!Number.isSafeInteger(vatCents)||vatCents<0||vatCents>totalCents)throw Error("Invalid invoice");
  return {id,kind,date,currency,totalCents,vatCents,counterpartyIban:typeof counterpartyIban==="string"?counterpartyIban:"",vatTreatment:raw.vatTreatment??"unknown",deductible:raw.deductible===true,reviewRequired:true,source:"MANUAL_UNVERIFIED"};
}
