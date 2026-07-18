import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import { getAuth, signInAnonymously } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';
import { getFirestore, doc, setDoc, updateDoc, collection, onSnapshot, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';
import { firebaseConfig } from './firebase-config.js';

const $ = id => document.getElementById(id);
const configured = firebaseConfig.apiKey !== 'REEMPLAZAR';
let auth, db, uid, circleId, watchId, unsubscribe;
let map, markers = new Map();
let sharing = false, sos = false;

const queryCircle = new URL(location.href).searchParams.get('circle');
if (queryCircle) $('circle').value = queryCircle;
$('name').value = localStorage.getItem('circleName') || '';

function initMap(){
  map = L.map('map').setView([40.4168,-3.7038],6);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© OpenStreetMap'}).addTo(map);
}

async function join(){
  const name=$('name').value.trim(), code=$('circle').value.trim().toUpperCase();
  if(name.length<2||code.length<4){alert('Escribe tu nombre y un código de al menos 4 caracteres.');return;}
  if(!configured){$('configDialog').showModal();return;}
  localStorage.setItem('circleName',name);
  circleId=code;
  const app=initializeApp(firebaseConfig); auth=getAuth(app); db=getFirestore(app);
  uid=(await signInAnonymously(auth)).user.uid;
  await setDoc(doc(db,'circles',circleId,'members',uid),{uid,name,sharing:false,sos:false,updatedAt:serverTimestamp()},{merge:true});
  $('joinCard').hidden=true;$('app').hidden=false;$('circleTitle').textContent=`Círculo ${circleId}`;
  initMap(); observe();
}

function observe(){
  unsubscribe?.();
  unsubscribe=onSnapshot(collection(db,'circles',circleId,'members'),snap=>{
    const box=$('members');box.innerHTML=''; const live=[];
    snap.forEach(d=>{const m=d.data();
      const row=document.createElement('div');row.className='member';
      const state=m.sos?'SOS':m.sharing?'Compartiendo':'Pausado';
      row.innerHTML=`<span><strong>${escapeHtml(m.name||'Miembro')}</strong><small>${m.updatedAt?.toDate?.().toLocaleTimeString()||'Sin actualización'}</small></span><span class="badge ${m.sos?'sos':''}">${state}</span>`;box.append(row);
      if(m.sharing&&Number.isFinite(m.lat)&&Number.isFinite(m.lng)){
        live.push([m.lat,m.lng]); let marker=markers.get(d.id);
        if(!marker){marker=L.marker([m.lat,m.lng]).addTo(map);markers.set(d.id,marker)}
        marker.setLatLng([m.lat,m.lng]).bindPopup(`${m.sos?'⚠️ SOS · ':''}${escapeHtml(m.name||'Miembro')}`);
      } else if(markers.has(d.id)){markers.get(d.id).remove();markers.delete(d.id)}
    });
    if(live.length) map.fitBounds(live,{padding:[30,30],maxZoom:16});
  });
}

async function toggleShare(){
  if(sharing){navigator.geolocation.clearWatch(watchId);sharing=false;await updateDoc(doc(db,'circles',circleId,'members',uid),{sharing:false,updatedAt:serverTimestamp()});renderShare();return;}
  if(!navigator.geolocation){alert('Este navegador no admite geolocalización.');return;}
  watchId=navigator.geolocation.watchPosition(async p=>{
    sharing=true;renderShare();
    await updateDoc(doc(db,'circles',circleId,'members',uid),{lat:p.coords.latitude,lng:p.coords.longitude,accuracy:p.coords.accuracy,sharing:true,updatedAt:serverTimestamp()});
  },e=>alert(`No se pudo obtener la ubicación: ${e.message}`),{enableHighAccuracy:true,maximumAge:15000,timeout:20000});
}
function renderShare(){$('share').textContent=sharing?'Detener ubicación':'Compartir ubicación';$('status').textContent=sharing?'Ubicación activa mientras esta web siga abierta':'En pausa'}
async function toggleSos(){sos=!sos;await updateDoc(doc(db,'circles',circleId,'members',uid),{sos,updatedAt:serverTimestamp()});$('sos').textContent=sos?'Desactivar SOS':'SOS'}
async function invite(){const url=new URL(location.href);url.searchParams.set('circle',circleId);const text=`Únete a mi círculo privado de ubicación: ${url}`;if(navigator.share)await navigator.share({title:'Círculo',text,url:String(url)});else{await navigator.clipboard.writeText(text);alert('Enlace copiado.')}}
function escapeHtml(v){return String(v).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}

$('join').onclick=join;$('share').onclick=toggleShare;$('sos').onclick=toggleSos;$('invite').onclick=invite;
if('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js');
