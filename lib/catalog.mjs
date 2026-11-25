export function catalogRecord(file,result,error,sha256){
 const warnings=[...(result?.warnings||[])];
 if(result?.kind==='table')warnings.push('Deleted records and unsupported field types are not restored.');
 if(result?.format==='RTF')warnings.push('Formatting and embedded objects are not preserved.');
 return {name:file.name,bytes:file.bytes.length,sha256,status:error?'unreadable':warnings.length?'review':'ready',format:result?.format||'Unknown',kind:result?.kind||'unknown',warnings,error:error||null,searchText:[file.name,result?.text||'',...(result?.table?.rows||[]).map(r=>r.join(' '))].join(' ').slice(0,500000)};
}
export function filterCatalog(records,query='',status='all'){
 const q=query.trim().toLowerCase();return records.filter(r=>(status==='all'||r.status===status)&&(!q||[r.name,r.format,r.searchText,...r.warnings,r.error||''].join(' ').toLowerCase().includes(q)));
}
export function catalogCSV(records){
 const cell=value=>{let s=String(value??'');if(/^[\s\x00-\x1f]*[=+\-@]/.test(s))s="'"+s;return '"'+s.replaceAll('"','""')+'"'};
 return '\ufeff'+[['Name','Bytes','Format','Status','SHA-256','Warnings','Error'],...records.map(r=>[r.name,r.bytes,r.format,r.status,r.sha256,r.warnings.join('; '),r.error])].map(r=>r.map(cell).join(',')).join('\r\n');
}
export function duplicateGroups(records){const groups=new Map();for(const r of records){if(!r.sha256)continue;const group=groups.get(r.sha256)||[];group.push(r.name);groups.set(r.sha256,group)}return [...groups.entries()].filter(([,names])=>names.length>1).map(([sha256,names])=>({sha256,names}))}
