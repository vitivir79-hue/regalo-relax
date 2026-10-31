'use strict';
const $=id=>document.getElementById(id);let pdfUrl=null;
const decode=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
async function decryptVoucher(password,config,data){
 const material=await crypto.subtle.importKey('raw',new TextEncoder().encode(password),'PBKDF2',false,['deriveKey']);
 const key=await crypto.subtle.deriveKey({name:'PBKDF2',salt:decode(config.salt),iterations:config.iterations,hash:'SHA-256'},material,{name:'AES-GCM',length:256},false,['decrypt']);
 return crypto.subtle.decrypt({name:'AES-GCM',iv:decode(config.iv),tagLength:128},key,data);
}
$('toggle').addEventListener('click',()=>{const show=$('password').type==='password';$('password').type=show?'text':'password';$('toggle').textContent=show?'Nascondi':'Mostra';$('toggle').setAttribute('aria-label',show?'Nascondi password':'Mostra password');});
$('unlock').addEventListener('submit',async event=>{event.preventDefault();$('submit').disabled=true;$('status').textContent='Sto aprendo la tua sorpresa…';let password=$('password').value;
 try{if(!globalThis.crypto?.subtle)throw new Error('unsupported');
 let config,data;try{const responses=await Promise.all([fetch('./config.json',{cache:'no-store'}),fetch('./regalo.enc',{cache:'no-store'})]);if(responses.some(r=>!r.ok))throw Error();config=await responses[0].json();data=await responses[1].arrayBuffer();}catch{throw Error('network');}
 let bytes;try{bytes=await decryptVoucher(password,config,data);}catch{throw Error('password');}
 if(new TextDecoder().decode(bytes.slice(0,5))!=='%PDF-')throw Error('damaged');
 if(pdfUrl)URL.revokeObjectURL(pdfUrl);pdfUrl=URL.createObjectURL(new Blob([bytes],{type:'application/pdf'}));$('open').href=pdfUrl;$('download').href=pdfUrl;$('password').value='';$('locked').hidden=true;$('surprise').hidden=false;$('status').textContent='';$('open').focus();
 }catch(error){$('status').textContent=error.message==='unsupported'?'Apri questa pagina da un indirizzo HTTPS con un browser aggiornato.':error.message==='network'?'Non riesco a caricare il regalo. Controlla la connessione e riprova.':error.message==='password'?'Password non corretta oppure file danneggiato. Controlla la parola segreta e riprova.':'Il regalo non è leggibile. Riprova.';}
 finally{password='';$('submit').disabled=false;}
});
$('lock').addEventListener('click',()=>{if(pdfUrl)URL.revokeObjectURL(pdfUrl);pdfUrl=null;$('open').removeAttribute('href');$('download').removeAttribute('href');$('surprise').hidden=true;$('locked').hidden=false;$('password').type='password';$('toggle').textContent='Mostra';$('toggle').setAttribute('aria-label','Mostra password');$('password').focus();});
window.addEventListener('pagehide',()=>{if(pdfUrl)URL.revokeObjectURL(pdfUrl);});
