import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.116.0';
const supabase = createClient('https://tiywwrbmolhgcsgzrkyc.supabase.co', 'sb_publishable_UkG41nmQwZ8bDFSOSp0l7w_hSsrBLDr', {auth:{persistSession:false,detectSessionInUrl:true,autoRefreshToken:true}});
const el=id=>document.getElementById(id);
const authorizationId=new URL(location.href).searchParams.get('authorization_id');
let details;
const status=message=>el('status').textContent=message;
async function refresh(){
  el('consent').hidden=true;
  const {data:{user},error}=await supabase.auth.getUser();
  if(error||!user){el('login').hidden=false;status('Melde dich mit deinem OpenBrain-Konto an.');return;}
  el('login').hidden=true;el('logout').hidden=false;
  if(!authorizationId){status('Dein OpenBrain-Konto ist angemeldet. Starte die Verbindung aus deiner KI-Anwendung.');return;}
  const result=await supabase.auth.oauth.getAuthorizationDetails(authorizationId);
  if(result.error){status('Die Anfrage ist ungültig oder abgelaufen. Starte die Verbindung in deiner KI-Anwendung erneut.');return;}
  details=result.data;
  if(details.redirect_url){location.assign(details.redirect_url);return;}
  el('client').textContent=details.client.name||details.client.id;
  el('redirect').textContent=details.redirect_uri;
  el('scope').textContent=details.scope||'Standardberechtigungen';
  status('Angemeldet als '+user.email);el('consent').hidden=false;
}
el('login').addEventListener('submit',async event=>{event.preventDefault();const button=el('login').querySelector('button');button.disabled=true;try{const target=new URL(location.href);target.hash='';const {error}=await supabase.auth.signInWithOtp({email:el('email').value.trim(),options:{shouldCreateUser:false,emailRedirectTo:target.href}});if(error){status('Anmeldelink konnte nicht gesendet werden. Prüfe deine Adresse oder versuche es später erneut.');return;}status('Falls ein freigeschaltetes Konto existiert, erhältst du einen Anmeldelink per E-Mail. Öffne ihn in diesem Browser.');}catch{status('Verbindung fehlgeschlagen. Bitte erneut versuchen.');}finally{button.disabled=false;}});
async function decide(approve){el('approve').disabled=el('deny').disabled=true;try{const result=approve?await supabase.auth.oauth.approveAuthorization(authorizationId,{skipBrowserRedirect:true}):await supabase.auth.oauth.denyAuthorization(authorizationId,{skipBrowserRedirect:true});if(result.error||!result.data?.redirect_url)throw new Error();location.assign(result.data.redirect_url);}catch{status('Freigabe konnte nicht abgeschlossen werden. Starte die Verbindung erneut.');el('approve').disabled=el('deny').disabled=false;}}
el('approve').addEventListener('click',()=>decide(true));el('deny').addEventListener('click',()=>decide(false));
el('logout').addEventListener('click',async()=>{await supabase.auth.signOut({scope:'local'});el('logout').hidden=true;await refresh();});
refresh().catch(()=>status('Verbindung fehlgeschlagen. Bitte lade die Seite erneut.'));

