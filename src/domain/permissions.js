export const PERMISSIONS = Object.freeze({
 owner:["org:read","org:manage","members:manage","documents:write","review:write","filing:approve","filing:submit"],
 admin:["org:read","org:manage","members:manage","documents:write","review:write"],
 bookkeeper:["org:read","documents:write","review:write"],
 reviewer:["org:read","review:write","filing:approve"],
 submitter:["org:read","filing:submit"]
});
export function can(membership,permission,orgId){
 return !!membership && membership.orgId===orgId && membership.status==="active" && (PERMISSIONS[membership.role]??[]).includes(permission);
}
export function requirePermission(membership,permission,orgId){
 if(!can(membership,permission,orgId))throw new Error("FORBIDDEN");
}
