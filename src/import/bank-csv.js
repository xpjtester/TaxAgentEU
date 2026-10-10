// Conservative ING-style CSV parser. No guessing: unknown layouts are rejected.
// Inputs are text; never upload customer data to this prototype.
const MAX_BYTES = 5_000_000;
function parseRows(text, delimiter) {
  const rows=[]; let row=[],field="",quoted=false;
  for(let i=0;i<text.length;i++){
    const ch=text[i];
    if(quoted){if(ch==='"'&&text[i+1]==='"'){field+='"';i++;}else if(ch==='"')quoted=false;else field+=ch;}
    else if(ch==='"'){if(field!=="")throw Error("Malformed CSV quote");quoted=true;}
    else if(ch===delimiter){row.push(field);field="";}
    else if(ch==='\n'){row.push(field.replace(/\r$/,""));rows.push(row);row=[];field="";}
    else field+=ch;
  }
  if(quoted)throw Error("Unclosed CSV quote");
  if(field!==""||row.length){row.push(field.replace(/\r$/,""));rows.push(row);}
  return rows.filter(r=>r.some(c=>c.trim()!==""));
}
function amountCents(raw) {
  const value=raw.trim().replace(/\s/g,"");
  if(!/^-?\d+(?:[,.]\d{1,2})?$/.test(value))throw Error("Invalid amount");
  const neg=value.startsWith("-"),[whole,decimal=""]=value.replace("-","").split(/[,.]/);
  const n=Number(whole)*100+Number(decimal.padEnd(2,"0"));
  if(!Number.isSafeInteger(n))throw Error("Amount overflow");
  return neg?-n:n;
}
function isoDate(raw){
  if(!/^\d{8}$/.test(raw))throw Error("Unsupported date");
  const iso=`${raw.slice(0,4)}-${raw.slice(4,6)}-${raw.slice(6,8)}`;
  const d=new Date(iso+"T00:00:00Z");
  if(Number.isNaN(d.getTime())||d.toISOString().slice(0,10)!==iso)throw Error("Invalid date");
  return iso;
}
export function parseIngCsv(text){
  if(typeof text!=="string"||Buffer.byteLength(text,"utf8")>MAX_BYTES)throw Error("CSV size invalid");
  const rows=parseRows(text.replace(/^\uFEFF/,""),";");
  if(rows.length<2)throw Error("CSV has no transactions");
  const header=rows.shift().map(x=>x.trim().toLowerCase());
  const required=["date","name / description","account","counterparty","code","debit/credit","amount (eur)"];
  // ING exports vary: intentionally require exact validated header before processing.
  for(const h of required)if(!header.includes(h))throw Error("Unsupported bank CSV layout: "+h);
  if(new Set(header).size!==header.length)throw Error("Duplicate headers");
  const idx=k=>header.indexOf(k);
  const transactions=rows.map((r,i)=>{
    if(r.length!==header.length)throw Error("Malformed row "+(i+2));
    const side=r[idx("debit/credit")].trim().toLowerCase();
    if(!["debit","credit"].includes(side))throw Error("Unknown debit/credit");
    const value=amountCents(r[idx("amount (eur)")]);
    if(value<0)throw Error("Signed amount not expected");
    return {id:`csv-${i+2}`,date:isoDate(r[idx("date")]),amountCents:side==="debit"?-value:value,currency:"EUR",description:r[idx("name / description")],accountIban:r[idx("account")].replace(/\s/g,"").toUpperCase(),counterpartyIban:r[idx("counterparty")].replace(/\s/g,"").toUpperCase(),sourceRow:i+2};
  });
  return {transactions,requiresReview:true,source:"ING_CSV_UNVERIFIED"};
}
