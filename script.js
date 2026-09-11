(function(){
"use strict";

function safe(fn,name){ try{ fn(); }catch(e){ console.warn("["+name+"]",e); } }
var reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

function initNav(){
  var burger=document.getElementById("navBurger");
  var panel=document.getElementById("navMobile");
  if(!burger||!panel) return;
  burger.addEventListener("click",function(){
    var open=panel.classList.toggle("open");
    burger.classList.toggle("open",open);
    burger.setAttribute("aria-expanded", open?"true":"false");
  });
  panel.querySelectorAll("a").forEach(function(a){
    a.addEventListener("click",function(){ panel.classList.remove("open"); burger.classList.remove("open"); });
  });
}

function initHeroReveal(){
  var line1=document.querySelector(".hero-line1");
  if(!line1) return;
  var text=line1.textContent;
  line1.setAttribute("aria-label",text);
  line1.innerHTML = text.split("").map(function(ch,i){
    return '<span class="rl" style="transition-delay:'+(i*26)+'ms">'+(ch===" "?"&nbsp;":ch)+"</span>";
  }).join("");
  requestAnimationFrame(function(){ requestAnimationFrame(function(){
    line1.querySelectorAll(".rl").forEach(function(s){ s.classList.add("in"); });
  }); });
}

var heroScript=[
  {type:"client", text:"Hola, necesito 20 térmicas bipolares de 20 A y 10 disyuntores bipolares de 40 A. ¿Tenés stock y cuál sería mi precio?"},
  {type:"agent", text:"Sí, tenemos stock de ambos productos. El total para tu cuenta es de $840.000. ¿Querés que prepare el pedido?"},
  {type:"client", text:"Sí, preparalo."},
  {type:"agent", text:"Resumen del pedido\nTérmica bipolar 20 A\n20 unidades × $18.000 = $360.000\nDisyuntor bipolar 40 A\n10 unidades × $48.000 = $480.000\nTotal: $840.000\n¿Confirmás el pedido?"},
  {type:"client", text:"Sí, confirmo."},
  {type:"agent", text:"Listo. Tu pedido #1842 quedó confirmado y ya fue cargado. Te enviamos el comprobante por este medio."}
];
var heroTimes=["09:14","09:14","09:15","09:15","09:16","09:16"];

function appendChatBubble(wrap,msg,time){
  var b=document.createElement("div");
  b.className="hero-chat-bubble "+(msg.type==="client"?"hero-chat-bubble--user":"hero-chat-bubble--crafty");
  var text=document.createElement("span");
  text.textContent=msg.text;
  b.appendChild(text);
  var meta=document.createElement("span");
  meta.className="hero-chat-meta";
  meta.textContent=msg.type==="client"?(time+" ✓✓"):time;
  b.appendChild(meta);
  wrap.appendChild(b);
}
function runChatScript(wrap,script,times){
  if(reduced){
    script.forEach(function(msg,i){ appendChatBubble(wrap,msg,times[i]); });
    return;
  }
  var i=0;
  function next(){
    if(i>=script.length) return;
    var msg=script[i];
    if(msg.type==="agent"){
      var typing=document.createElement("div");
      typing.className="hero-chat-typing";
      typing.innerHTML="<span></span><span></span><span></span>";
      wrap.appendChild(typing);
      setTimeout(function(){
        typing.remove();
        appendChatBubble(wrap,msg,times[i]);
        i++;
        setTimeout(next,900);
      },700);
    } else {
      appendChatBubble(wrap,msg,times[i]);
      i++;
      setTimeout(next,900);
    }
  }
  next();
}
function initChatDemos(){
  var wrap=document.querySelector("[data-hero-chat-body]");
  if(!wrap) return;
  var started=false;
  var io=new IntersectionObserver(function(entries){
    entries.forEach(function(e){
      if(e.isIntersecting && !started){
        started=true;
        runChatScript(wrap,heroScript,heroTimes);
        io.unobserve(e.target);
      }
    });
  },{threshold:0.2});
  io.observe(wrap);
}

/* Ambient hero gradient: follows the mouse slowly on devices with a real
   pointer; stays put on touch and under prefers-reduced-motion. */
function initHeroGlow(){
  var glow=document.getElementById("heroGlow");
  var hero=document.querySelector(".hero");
  if(!glow||!hero) return;
  if(reduced) return;
  if(!matchMedia("(hover:hover) and (pointer:fine)").matches) return;
  var tx=50,ty=32,cx=50,cy=32;
  hero.addEventListener("mousemove",function(e){
    var r=hero.getBoundingClientRect();
    tx=((e.clientX-r.left)/r.width)*100;
    ty=((e.clientY-r.top)/r.height)*100;
  });
  function loop(){
    cx+=(tx-cx)*0.035; cy+=(ty-cy)*0.035;
    glow.style.setProperty("--mx",cx+"%");
    glow.style.setProperty("--my",cy+"%");
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
}

function initReveal(){
  var els=document.querySelectorAll("[data-reveal]");
  var io=new IntersectionObserver(function(entries){
    entries.forEach(function(e){
      if(e.isIntersecting){ e.target.classList.add("is-visible"); io.unobserve(e.target); }
    });
  },{threshold:0.05, rootMargin:"0px 0px -2% 0px"});
  els.forEach(function(el){ io.observe(el); });
  setTimeout(function(){
    document.querySelectorAll("[data-reveal]:not(.is-visible)").forEach(function(el){
      if(el.getBoundingClientRect().top < window.innerHeight) el.classList.add("is-visible");
    });
  },6000);
}

function initFAQ(){
  document.querySelectorAll(".faq-item").forEach(function(item){
    var btn=item.querySelector(".faq-q");
    var panel=item.querySelector(".faq-a");
    btn.addEventListener("click",function(){
      var isOpen=item.classList.contains("open");
      document.querySelectorAll(".faq-item.open").forEach(function(o){
        if(o!==item){
          o.classList.remove("open");
          o.querySelector(".faq-a").style.maxHeight=null;
          o.querySelector(".faq-q").setAttribute("aria-expanded","false");
        }
      });
      if(isOpen){
        item.classList.remove("open");
        panel.style.maxHeight=null;
        btn.setAttribute("aria-expanded","false");
      } else {
        item.classList.add("open");
        panel.style.maxHeight=panel.scrollHeight+"px";
        btn.setAttribute("aria-expanded","true");
      }
    });
  });
}

/* Pricing structured data: read the visible plan cards (name + price) at
   runtime and emit matching JSON-LD, so the schema can never drift from what
   the visitor actually sees on the page. */
function initPricingSchema(){
  var cards=document.querySelectorAll(".plan-card");
  if(!cards.length) return;
  var offers=[];
  cards.forEach(function(card){
    var name=card.querySelector(".plan-name");
    var amount=card.querySelector(".plan-price-amount");
    if(!name||!amount) return;
    var price=amount.textContent.replace(/[^\d]/g,"");
    if(!price) return;
    offers.push({"@type":"Offer","name":"Plan "+name.textContent.trim(),"price":price,"priceCurrency":"USD","availability":"https://schema.org/InStock"});
  });
  if(!offers.length) return;
  var data={
    "@context":"https://schema.org",
    "@type":"Product",
    "name":"Crafty",
    "brand":{"@type":"Brand","name":"Crafty"},
    "description":"Plataforma de agentes conversacionales que atiende, consulta y ejecuta acciones sobre los sistemas de una empresa.",
    "offers":offers
  };
  var script=document.createElement("script");
  script.type="application/ld+json";
  script.textContent=JSON.stringify(data);
  document.head.appendChild(script);
}

var integrationsRow1=["Zoho CRM","HubSpot","Salesforce","WhatsApp Business","Telegram","SAP","Tango","Odoo","MercadoPago","Stripe","Mercado Libre","Tienda Nube"];
var integrationsRow2=["Pipedrive","Google Sheets","Gmail","Slack","Notion","Bejerman","Shopify","Zoho Desk","Calendly","Drive","Freshdesk","Intercom"];
var dotMap={
  "Zoho CRM":"crm","HubSpot":"crm","Salesforce":"crm","SAP":"crm","Tango":"crm","Odoo":"crm","Pipedrive":"crm","Zoho Desk":"crm","Bejerman":"crm","Freshdesk":"crm","Intercom":"crm",
  "WhatsApp Business":"msg","Telegram":"msg","Slack":"msg","Gmail":"msg","Calendly":"msg","Notion":"msg","Drive":"msg","Google Sheets":"msg",
  "MercadoPago":"pay","Stripe":"pay",
  "Mercado Libre":"shop","Tienda Nube":"shop","Shopify":"shop"
};
function buildMarquee(id,list){
  var track=document.getElementById(id);
  if(!track) return;
  var full=list.concat(list);
  track.innerHTML = full.map(function(name){
    var cat=dotMap[name]||"crm";
    return '<span class="pill"><span class="pill-dot dot-'+cat+'"></span>'+name+"</span>";
  }).join("");
}
function initIntegrations(){
  buildMarquee("marqueeRow1",integrationsRow1);
  buildMarquee("marqueeRow2",integrationsRow2);
}

/* "Algunas acciones" rotator: 5 fixed slots, each permanently tied to one
   functional category so the visible set never shows near-duplicates at
   once. One slot swaps at a time (fade out, swap text+icon, fade in) so the
   change reads as organic rather than a simultaneous refresh. Static (first
   pool item per slot) under prefers-reduced-motion. */
function initActionRotator(){
  var chips=Array.prototype.slice.call(document.querySelectorAll("[data-action-slot]"));
  if(!chips.length || reduced) return;

  var icons={
    search:'<circle cx="11" cy="11" r="6.5" stroke="currentColor" stroke-width="1.7"/><path d="M20 20l-4.5-4.5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>',
    bag:'<path d="M6 8h12l-1 12H7L6 8z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path d="M9 8V6a3 3 0 016 0v2" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/><path d="M9.5 12h5M12 9.5v5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>',
    refresh:'<path d="M4 12a8 8 0 0113.66-5.66L20 8" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/><path d="M20 4v4h-4" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/><path d="M20 12a8 8 0 01-13.66 5.66L4 16" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/><path d="M4 20v-4h4" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>',
    calendar:'<rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" stroke-width="1.7"/><path d="M3 10h18M8 3v4M16 3v4" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>',
    mail:'<rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" stroke-width="1.7"/><path d="M3.5 6.5L12 13l8.5-6.5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>',
    ticket:'<path d="M4 13v-1a8 8 0 0116 0v1" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/><rect x="3" y="13" width="4" height="6" rx="1.5" stroke="currentColor" stroke-width="1.7"/><rect x="17" y="13" width="4" height="6" rx="1.5" stroke="currentColor" stroke-width="1.7"/>',
    document:'<path d="M7 3h7l5 5v12a1 1 0 01-1 1H7a1 1 0 01-1-1V4a1 1 0 011-1z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path d="M14 3v5h5" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/>',
    user:'<circle cx="12" cy="8" r="3.2" stroke="currentColor" stroke-width="1.7"/><path d="M5 20c1.2-3.5 4-5.2 7-5.2s5.8 1.7 7 5.2" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>',
    check:'<circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.7"/><path d="M8 12.5l2.5 2.5L16 9.5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>'
  };

  /* Each slot only ever draws from its own category, so the 5 visible
     chips always span 5 different functional areas — never two "consulta"
     or two "enviar" at once. First entry of each pool matches the chip
     already rendered in the HTML (keeps SSR/no-JS state consistent). */
  var pools=[
    [ {t:"Consultar stock",i:"search"}, {t:"Consultar precios",i:"search"}, {t:"Consultar saldo",i:"search"}, {t:"Ver disponibilidad",i:"search"}, {t:"Buscar cliente",i:"search"}, {t:"Consultar pedidos",i:"search"} ],
    [ {t:"Crear pedidos",i:"bag"}, {t:"Generar cotización",i:"document"}, {t:"Crear oportunidad",i:"bag"}, {t:"Actualizar CRM",i:"refresh"}, {t:"Asignar vendedores",i:"user"}, {t:"Crear tareas",i:"bag"} ],
    [ {t:"Crear tickets",i:"ticket"}, {t:"Consultar tickets",i:"ticket"}, {t:"Escalar casos",i:"ticket"}, {t:"Asignar casos",i:"user"}, {t:"Resolver incidencia",i:"ticket"} ],
    [ {t:"Generar documentos",i:"document"}, {t:"Buscar facturas",i:"search"}, {t:"Ver comprobantes",i:"search"}, {t:"Registrar datos",i:"document"}, {t:"Actualizar datos",i:"refresh"} ],
    [ {t:"Enviar emails",i:"mail"}, {t:"Enviar documentos",i:"mail"}, {t:"Enviar notificación",i:"mail"}, {t:"Confirmar operación",i:"check"}, {t:"Enviar recordatorio",i:"mail"}, {t:"Agendar reuniones",i:"calendar"}, {t:"Reprogramar reunión",i:"calendar"} ]
  ];

  var pos=pools.map(function(){ return 0; });
  var turn=0;

  function swap(slot){
    var chip=chips[slot];
    var content=chip.querySelector(".integ-chip-content");
    if(!content) return;
    var pool=pools[slot];
    pos[slot]=(pos[slot]+1)%pool.length;
    var item=pool[pos[slot]];
    content.classList.add("is-swapping");
    setTimeout(function(){
      var textEl=content.querySelector(".integ-chip-text");
      var iconEl=content.querySelector(".integ-chip-icon");
      if(textEl) textEl.textContent=item.t;
      if(iconEl) iconEl.innerHTML=icons[item.i]||"";
      content.classList.remove("is-swapping");
    },260);
  }

  var timer=null;
  function start(){
    if(timer) return;
    timer=setInterval(function(){
      swap(turn%chips.length);
      turn++;
    },2600);
  }

  var side=document.querySelector(".integ-flow-side--actions");
  if(!side){ start(); return; }
  var io=new IntersectionObserver(function(entries){
    entries.forEach(function(e){ if(e.isIntersecting) start(); });
  },{threshold:0.3});
  io.observe(side);
}

/* Casos reales: a single shared stage, one case visible at a time, with a
   short crossfade on switch. Accessible tab pattern (roving tabindex,
   arrow/Home/End keys, aria-selected). */
function initCaseTabs(){
  var tabs=Array.prototype.slice.call(document.querySelectorAll("[data-case-tab]"));
  if(!tabs.length) return;
  var stage=document.querySelector(".case-stage");
  var panels=document.querySelectorAll(".case-panel");

  function swap(key){
    panels.forEach(function(p){ p.hidden = p.id !== "case-panel-"+key; });
  }

  function activate(key,focus){
    tabs.forEach(function(t){
      var active=t.getAttribute("data-case-tab")===key;
      t.classList.toggle("is-active",active);
      t.setAttribute("aria-selected",active?"true":"false");
      t.tabIndex=active?0:-1;
      if(active && focus) t.focus();
    });
    if(reduced || !stage){ swap(key); return; }
    stage.classList.add("is-switching");
    setTimeout(function(){ swap(key); stage.classList.remove("is-switching"); },180);
  }

  tabs.forEach(function(t){
    t.addEventListener("click",function(){ activate(t.getAttribute("data-case-tab"),false); });
    t.addEventListener("keydown",function(e){
      var idx=tabs.indexOf(t);
      var next=null;
      if(e.key==="ArrowRight") next=tabs[(idx+1)%tabs.length];
      else if(e.key==="ArrowLeft") next=tabs[(idx-1+tabs.length)%tabs.length];
      else if(e.key==="Home") next=tabs[0];
      else if(e.key==="End") next=tabs[tabs.length-1];
      if(next){ e.preventDefault(); activate(next.getAttribute("data-case-tab"),true); }
    });
  });
}

function initAnchors(){
  document.addEventListener("click",function(e){
    var a=e.target.closest('a[href^="#"]');
    if(!a) return;
    var id=a.getAttribute("href");
    if(!id || id==="#") return;
    var el=document.querySelector(id);
    if(!el) return;
    e.preventDefault();
    var navH=document.querySelector(".nav") ? document.querySelector(".nav").offsetHeight : 76;
    window.scrollTo({ top: el.getBoundingClientRect().top+window.scrollY-navH, behavior: reduced?"auto":"smooth" });
  });
}

/* lead_id: one short, human-readable code per browser tab session, e.g.
   "LP-7K2M9X". Generated once, reused from sessionStorage on every reload
   within the same session, regenerated only when sessionStorage is empty
   (a genuinely new session). Alphabet excludes 0/O and 1/I to avoid visual
   confusion when someone reads the code out of a WhatsApp message. Kept in
   its own key (not merged into crafty_attribution) since it's an identity,
   not an acquisition fact. */
var LEAD_ID_ALPHABET="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
var leadId=null;
function generateLeadId(){
  var code="";
  for(var i=0;i<6;i++){
    code+=LEAD_ID_ALPHABET.charAt(Math.floor(Math.random()*LEAD_ID_ALPHABET.length));
  }
  return "LP-"+code;
}
function getOrCreateLeadId(){
  if(leadId) return leadId;
  try{
    var existing=sessionStorage.getItem("crafty_lead_id");
    if(existing){ leadId=existing; return leadId; }
  }catch(e){}
  leadId=generateLeadId();
  try{ sessionStorage.setItem("crafty_lead_id",leadId); }catch(e){}
  return leadId;
}
function initLeadId(){
  getOrCreateLeadId();
}

/* Appends "Código de referencia: <lead_id>" to the visible text of every
   wa.me link on the page, on top of whatever message is already there.
   Runs once per page load; guards against double-appending so a re-run
   (or an already-tagged href) never stacks the line twice. Only touches
   the text param — link target, tracking, everything else stays as-is. */
function initLeadIdInLinks(){
  var id=getOrCreateLeadId();
  var marker="Código de referencia:";
  var links=document.querySelectorAll('a[href^="https://wa.me/"]');
  links.forEach(function(a){
    try{
      var href=a.getAttribute("href");
      var qIndex=href.indexOf("?");
      var base=qIndex===-1?href:href.slice(0,qIndex);
      var query=qIndex===-1?"":href.slice(qIndex+1);
      var text=new URLSearchParams(query).get("text")||"";
      if(text.indexOf(marker)!==-1) return;
      var newText=text+"\n"+marker+" "+id;
      a.setAttribute("href",base+"?text="+encodeURIComponent(newText));
    }catch(e){}
  });
}

/* Attribution capture: store UTM/gclid/fbclid params from the URL in
   sessionStorage, alongside the landing page path and a capture timestamp,
   so a future Pixel/Analytics/backend integration can read them from there.
   This does NOT touch any visible link or message — no attribution text is
   added to the WhatsApp message, and nothing is sent anywhere yet.
   Scoped to the current browser tab session on purpose (see report to the
   user, 2026): this first version measures the ad → landing → WhatsApp
   path within a single visit, not a multi-day attribution window. Existing
   behavior preserved: a page load with no tracked params never overwrites
   an attribution record already captured earlier in the same session. */
function initAttributionCapture(){
  var trackedKeys=["utm_source","utm_medium","utm_campaign","utm_content","utm_term","gclid","fbclid"];
  var params=new URLSearchParams(window.location.search);
  var found={};
  trackedKeys.forEach(function(k){ var v=params.get(k); if(v) found[k]=v; });

  var hasNewParams=Object.keys(found).length>0;
  var existing=null;
  try{ existing=sessionStorage.getItem("crafty_attribution"); }catch(e){}
  if(!hasNewParams && existing) return;

  found.landing_page=window.location.pathname;
  found.timestamp=new Date().toISOString();
  try{ sessionStorage.setItem("crafty_attribution", JSON.stringify(found)); }catch(e){}
}

/* Shared readers for the two sessionStorage records, used by both
   trackEvent (dataLayer) and sendLeadToSheet (Apps Script POST) so the
   two never drift out of sync with each other. */
function getStoredAttribution(){
  var attribution={};
  try{
    var raw=sessionStorage.getItem("crafty_attribution");
    if(raw) attribution=JSON.parse(raw);
  }catch(e){}
  return attribution;
}
function getStoredPlanInterest(){
  try{ return sessionStorage.getItem("crafty_plan_interest"); }catch(e){ return null; }
}

/* Event tracking scaffold: no analytics tool is installed yet (audited —
   no GA/GTM/Meta Pixel in this file), so this only prepares structured
   events for whenever one is added. It pushes to window.dataLayer (created
   here as a plain array if absent — this is NOT a GTM install, just the
   data structure GTM reads from when it's added later) and mirrors every
   event to console.debug for QA without any tool installed. */
function trackEvent(name,extra){
  var attribution=getStoredAttribution();
  var planInterest=getStoredPlanInterest();
  var payload=Object.assign({},attribution,extra||{},{event:name});
  if(planInterest && !payload.plan_interest) payload.plan_interest=planInterest;
  payload.lead_id=getOrCreateLeadId();
  window.dataLayer=window.dataLayer||[];
  window.dataLayer.push(payload);
  try{ console.debug("[track]",payload); }catch(e){}
}

/* Step 2 of the tracking system: POST the lead to the Google Apps Script
   endpoint backing "Crafty — Leads & Attribution (TEST simple)", upserted
   by lead_id. Left unconfigured (empty string) until the Web App is
   deployed and its URL is provided — see docs/apps-script-leads-endpoint.gs
   and the deployment steps sent alongside it. Until then this is a
   guaranteed no-op: it returns before touching the network.

   Deliberately NOT awaited by the caller and never calls
   preventDefault() on the WhatsApp link — the browser opens wa.me in its
   own new tab (target="_blank") independently of this call, so a slow or
   failed POST can never delay or block that. Plain (CORS) mode, not
   no-cors: confirmed by real testing (2026-09-07) that Apps Script Web
   Apps here send access-control-allow-origin:*, so a normal fetch is
   readable — useful for future debugging — with no behavior difference
   for this fire-and-forget call, which still never reads the response.
   text/plain content-type avoids a CORS preflight OPTIONS request, which
   Apps Script Web Apps do not handle. */
var CRAFTY_SHEET_ENDPOINT="https://script.google.com/macros/s/AKfycbzxDUU4WcEhQwXw7IhTEwyt-7Sw4Xa4XtxLvWaMvIULuyuMyy19jz8AMwPwFkxRKp0P/exec";
function sendLeadToSheet(extra){
  if(!CRAFTY_SHEET_ENDPOINT || !window.fetch) return;
  var attribution=getStoredAttribution();
  var planInterest=getStoredPlanInterest();
  var payload={
    lead_id: getOrCreateLeadId(),
    visit_timestamp: attribution.timestamp||"",
    source: attribution.utm_source||"",
    medium: attribution.utm_medium||"",
    campaign: attribution.utm_campaign||"",
    content: attribution.utm_content||"",
    term: attribution.utm_term||"",
    gclid: attribution.gclid||"",
    fbclid: attribution.fbclid||"",
    plan_interest: (extra&&extra.plan_interest)||planInterest||"",
    cta: (extra&&extra.cta)||"",
    landing_page: attribution.landing_page||""
  };
  try{
    fetch(CRAFTY_SHEET_ENDPOINT,{
      method:"POST",
      headers:{"Content-Type":"text/plain;charset=utf-8"},
      body: JSON.stringify(payload),
      keepalive:true
    }).catch(function(){}); // network/endpoint failure: swallow silently, never surface to the visitor
  }catch(e){}
}

/* Wires cta_crafty_click / pricing_plan_click / whatsapp_click to the
   data-track attributes already present on every CTA. A pricing plan click
   also persists plan_interest (starter/professional/business) in
   sessionStorage so it keeps enriching later events in the same visit
   (e.g. if the visitor later clicks the nav "Hablá con Crafty" button).
   A Sheet row (create-or-update by lead_id) is registered only on an
   actual WhatsApp click — never just for visiting the landing. */
function initEventTracking(){
  document.addEventListener("click",function(e){
    var el=e.target.closest("[data-track]");
    if(!el) return;
    var key=el.getAttribute("data-track");
    var href=el.getAttribute("href")||"";
    var isWhatsapp=/^https:\/\/wa\.me\//.test(href);
    var plan=el.getAttribute("data-plan");

    if(plan){
      try{ sessionStorage.setItem("crafty_plan_interest",plan); }catch(err){}
      trackEvent("pricing_plan_click",{cta:key,plan_interest:plan});
    }
    if(isWhatsapp){
      trackEvent("whatsapp_click",{cta:key});
      sendLeadToSheet({cta:key, plan_interest:plan||null});
    }
    if(key==="whatsapp-nav" || key==="whatsapp-hero" || key==="whatsapp-final"){
      trackEvent("cta_crafty_click",{cta:key});
    }
  });
}

document.addEventListener("DOMContentLoaded",function(){
  safe(initNav,"initNav");
  safe(initHeroReveal,"initHeroReveal");
  safe(initHeroGlow,"initHeroGlow");
  safe(initChatDemos,"initChatDemos");
  safe(initIntegrations,"initIntegrations");
  safe(initActionRotator,"initActionRotator");
  safe(initCaseTabs,"initCaseTabs");
  safe(initReveal,"initReveal");
  safe(initFAQ,"initFAQ");
  safe(initAnchors,"initAnchors");
  safe(initLeadId,"initLeadId");
  safe(initLeadIdInLinks,"initLeadIdInLinks");
  safe(initAttributionCapture,"initAttributionCapture");
  safe(initEventTracking,"initEventTracking");
  safe(initPricingSchema,"initPricingSchema");
});
})();
