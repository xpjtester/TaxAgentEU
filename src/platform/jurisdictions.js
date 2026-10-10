// Capability is conservative: no country is enabled for live filing.
export const JURISDICTIONS = Object.freeze([
  ["NL","Netherlands","EUR"],["BE","Belgium","EUR"],["DE","Germany","EUR"],
  ["LV","Latvia","EUR"],["LT","Lithuania","EUR"],["EE","Estonia","EUR"],
  ["SE","Sweden","SEK"],["DK","Denmark","DKK"],["FI","Finland","EUR"],
  ["NO","Norway","NOK"]
].map(([code,name,currency]) => Object.freeze({
  code, name, currency, filingCapability:"DRAFT_ONLY", euMember:code!=="NO"
})));
export function jurisdiction(code) {
  const item = JURISDICTIONS.find(x=>x.code===code);
  if (!item) throw new Error("UNSUPPORTED_JURISDICTION");
  return item;
}
