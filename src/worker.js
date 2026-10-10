// Cloudflare Worker API scaffold. All financial endpoints are intentionally disabled.
export default {
 async fetch(request,env){
  const url=new URL(request.url);
  if(request.method==="GET" && url.pathname==="/health")
   return Response.json({status:"ok",service:"nl-tax-accountant",mode:"scaffold"},{headers:{"cache-control":"no-store"}});
  return Response.json({error:"NOT_IMPLEMENTED",message:"Authenticated tenant-scoped API is not enabled"},{status:404,headers:{"cache-control":"no-store"}});
 }
};
