import { createServer } from "node:http";
import { calculateVatDraft } from "./tax.js";
import { reconcile } from "./reconcile.js";
const port = Number(process.env.PORT || 8787);
createServer(async (req,res)=>{
  res.setHeader("content-type","application/json; charset=utf-8");
  if(req.method==="GET" && req.url==="/health"){res.end(JSON.stringify({status:"ok"}));return;}
  // No financial endpoints exposed before authentication, tenant isolation and upload security.
  res.writeHead(404);res.end(JSON.stringify({error:"not_found"}));
}).listen(port,()=>console.log("Listening on "+port));
