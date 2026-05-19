import { useState, useEffect } from "react";

// ── SUPABASE REST ─────────────────────────────────────────────────────────────
const SB_URL = "https://rsrvadoynpfdviyafxoq.supabase.co";
const SB_KEY = "sb_publishable_9kbxLe24iO6CMp3QyADFcw_uOycSt79";
const ADMIN_EMAIL = "aaloyi@gmail.com"; // ← Mets ton email ici

const authHeaders = (token) => ({
  "Content-Type": "application/json",
  "apikey": SB_KEY,
  "Authorization": `Bearer ${token || SB_KEY}`,
});

const Auth = {
  async signUp(email, password, name) {
    const r = await fetch(`${SB_URL}/auth/v1/signup`, { method:"POST", headers:authHeaders(), body:JSON.stringify({email,password,data:{full_name:name}}) });
    return r.json();
  },
  async signIn(email, password) {
    const r = await fetch(`${SB_URL}/auth/v1/token?grant_type=password`, { method:"POST", headers:authHeaders(), body:JSON.stringify({email,password}) });
    return r.json();
  },
  async signOut(token) { await fetch(`${SB_URL}/auth/v1/logout`, {method:"POST",headers:authHeaders(token)}); },
  async resetPassword(email) {
    const r = await fetch(`${SB_URL}/auth/v1/recover`, {method:"POST",headers:authHeaders(),body:JSON.stringify({email})});
    return r.json();
  },
  getSession() { try { return JSON.parse(localStorage.getItem("vd_session")); } catch { return null; } },
  saveSession(s) { localStorage.setItem("vd_session", JSON.stringify(s)); },
  clearSession() { localStorage.removeItem("vd_session"); },
};

const DB = {
  async getPrograms(userId, token) {
    const r = await fetch(`${SB_URL}/rest/v1/programs?user_id=eq.${userId}&select=*`, {headers:authHeaders(token)});
    return r.ok ? r.json() : [];
  },
  async upsert(id, userId, data, token) {
    await fetch(`${SB_URL}/rest/v1/programs`, {method:"POST",headers:{...authHeaders(token),"Prefer":"resolution=merge-duplicates"},body:JSON.stringify({id,user_id:userId,data})});
  },
  async delete(id, userId, token) {
    await fetch(`${SB_URL}/rest/v1/programs?id=eq.${id}&user_id=eq.${userId}`, {method:"DELETE",headers:authHeaders(token)});
  },
  // ── ABONNEMENTS
  async getSubscription(userId, token) {
    const r = await fetch(`${SB_URL}/rest/v1/subscriptions?user_id=eq.${userId}&order=created_at.desc&limit=1`, {headers:authHeaders(token)});
    const data = r.ok ? await r.json() : [];
    return data[0] || null;
  },
  async createSubscription(userId, email, expiresAt, token) {
    await fetch(`${SB_URL}/rest/v1/subscriptions`, {
      method:"POST",
      headers:{...authHeaders(token),"Prefer":"resolution=merge-duplicates"},
      body:JSON.stringify({user_id:userId, email, expires_at:expiresAt, status:"active"})
    });
  },
  // ── CODES D'ACCÈS
  async getCode(code) {
    const r = await fetch(`${SB_URL}/rest/v1/access_codes?code=eq.${code}&select=*`, {headers:authHeaders()});
    const data = r.ok ? await r.json() : [];
    return data[0] || null;
  },
  async markCodeUsed(code, email, token) {
    await fetch(`${SB_URL}/rest/v1/access_codes?code=eq.${code}`, {
      method:"PATCH",
      headers:authHeaders(token),
      body:JSON.stringify({used:true, used_at:new Date().toISOString(), email})
    });
  },
  async createCode(code, expiresAt, token) {
    await fetch(`${SB_URL}/rest/v1/access_codes`, {
      method:"POST",
      headers:authHeaders(token),
      body:JSON.stringify({code, expires_at:expiresAt, used:false})
    });
  },
  async getAllCodes(token) {
    const r = await fetch(`${SB_URL}/rest/v1/access_codes?order=created_at.desc`, {headers:authHeaders(token)});
    return r.ok ? r.json() : [];
  },
};

// ── DATE ──────────────────────────────────────────────────────────────────────
const MONTHS_FR = ["janvier","février","mars","avril","mai","juin","juillet","août","septembre","octobre","novembre","décembre"];
const DAYS_FR   = ["Dimanche","Lundi","Mardi","Mercredi","Jeudi","Vendredi","Samedi"];
const todayLabel = () => { const d=new Date(); return `${DAYS_FR[d.getDay()]} ${d.getDate()} ${MONTHS_FR[d.getMonth()]} ${d.getFullYear()}`; };
const todayKey   = () => { const d=new Date(); return `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`; };
const getSeed    = () => { const d=new Date(); return d.getFullYear()*10000+(d.getMonth()+1)*100+d.getDate(); };
const daysDiff   = (from,to) => { const p=s=>{const[y,m,d]=s.split("-").map(Number);return new Date(y,m-1,d);}; return Math.floor((p(to)-p(from))/864e5); };
const formatDate = (iso) => { const d=new Date(iso); return `${d.getDate()} ${MONTHS_FR[d.getMonth()]} ${d.getFullYear()}`; };
const addDays    = (days) => { const d=new Date(); d.setDate(d.getDate()+days); return d.toISOString(); };
const genCode    = () => Math.random().toString(36).substring(2,8).toUpperCase()+"-"+Math.random().toString(36).substring(2,6).toUpperCase();

const SITS = [
  {icon:"🙏",label:"Paix intérieure",c:"#7C3AED"},{icon:"💪",label:"Force & Courage",c:"#EA580C"},
  {icon:"❤️",label:"Guérison",c:"#DC2626"},{icon:"👨👩👧",label:"Ma famille",c:"#059669"},
  {icon:"💼",label:"Travail & Finances",c:"#2563EB"},{icon:"🛡️",label:"Protection divine",c:"#B45309"},
  {icon:"💔",label:"Deuil & Douleur",c:"#7C3AED"},{icon:"🌅",label:"Nouveau départ",c:"#DB2777"},
  {icon:"😔",label:"Anxiété & Peur",c:"#4F46E5"},{icon:"🤝",label:"Réconciliation",c:"#0D9488"},
  {icon:"🙌",label:"Action de grâce",c:"#B45309"},{icon:"✨",label:"Discernement",c:"#4F46E5"},
  {icon:"🌍",label:"Intercession",c:"#15803D"},{icon:"💑",label:"Vie de couple",c:"#BE185D"},
  {icon:"🎓",label:"Études & Sagesse",c:"#0369A1"},{icon:"🏥",label:"Maladie grave",c:"#B91C1C"},
];

const LS = {
  get: k => { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } },
  set: (k,v) => { try { localStorage.setItem(k,JSON.stringify(v)); } catch {} },
};

const SYS = `Tu es un pasteur chrétien inspiré, profond et bienveillant (tradition évangélique/charismatique).
Français riche, biblique, contemporain. Tutoiement pastoral.
Jamais de labels ou métadonnées dans la réponse. Direct, puissant, plein d'espérance.`;
async function ai(prompt, max = 1000) {
  try {
    const r = await fetch("/api/claude", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt,
      }),
    });

    const data = await r.json();

    console.log("Réponse API :", data);

    if (data.text) return data.text;

    if (data.error) {
  return "Erreur : " + JSON.stringify(data.error);
}

    return "Aucune réponse.";

  } catch (error) {
    console.error(error);
    return "Erreur réseau.";
  }
}
const T = {
  bgGrad:"linear-gradient(160deg,#F8F4EE 0%,#EDE5D8 100%)",
  card:"#FFFDF8", cardBorder:"rgba(180,140,60,.22)", cardShadow:"0 4px 24px rgba(120,80,20,.10)",
  nav:"#2D1A0E", navBorder:"rgba(180,140,60,.25)",
  textMain:"#1C1008", textSub:"#5C4A30", textMuted:"#9A7E5A",
  gold:"#B8860B", goldBorder:"rgba(184,134,11,.3)",
  prayerBg:"linear-gradient(150deg,#2D1A6E 0%,#1A0E4E 100%)",
  teachBg:"linear-gradient(150deg,#1A3A1A 0%,#0E2810 100%)",
  success:"#15803D", danger:"#B91C1C",
};

// ── UI ATOMS ──────────────────────────────────────────────────────────────────
function Spinner({size=36,color="#D4AF37"}){
  return <div style={{width:size,height:size,borderRadius:"50%",border:`3px solid rgba(212,175,55,.2)`,borderTop:`3px solid ${color}`,animation:"spin 1s linear infinite",margin:"0 auto"}}/>;
}
function Shimmer({msg="L'Esprit Saint prépare la Parole…"}){
  return(
    <div style={{padding:"18px 0"}}>
      {[90,72,100,65,82].map((w,i)=><div key={i} style={{height:11,borderRadius:6,marginBottom:9,width:`${w}%`,background:"linear-gradient(90deg,rgba(180,140,60,.1),rgba(180,140,60,.25),rgba(180,140,60,.1))",backgroundSize:"200% 100%",animation:`shimmer 1.8s ${i*.12}s ease-in-out infinite`}}/>)}
      <p style={{fontFamily:"serif",fontSize:14,fontStyle:"italic",color:"#D4AF37",textAlign:"center",marginTop:14}}>{msg}</p>
    </div>
  );
}
function CopyBtn({text,dark=false}){
  const[ok,setOk]=useState(false);
  return <button onClick={()=>{navigator.clipboard.writeText(text);setOk(true);setTimeout(()=>setOk(false),2000);}} style={{display:"flex",alignItems:"center",gap:6,marginTop:14,background:"transparent",border:`1px solid ${dark?"rgba(255,255,255,.25)":T.goldBorder}`,borderRadius:30,padding:"5px 14px",cursor:"pointer",color:ok?(dark?"#FFD700":T.gold):(dark?"rgba(255,255,255,.6)":T.gold),fontFamily:"'Cinzel',serif",fontSize:10,letterSpacing:2,transition:"all .3s"}}>{ok?"✓ Copié":"⎘ Copier"}</button>;
}
function SL({children}){return <p style={{fontFamily:"'Cinzel',serif",fontSize:9,letterSpacing:3,color:T.textMuted,textTransform:"uppercase",marginBottom:11}}>{children}</p>;}
function Divider(){return <div style={{display:"flex",alignItems:"center",gap:12,margin:"20px 0"}}><div style={{flex:1,height:1,background:`linear-gradient(90deg,transparent,${T.goldBorder})`}}/><span style={{color:"#D4AF37",fontSize:13}}>✦</span><div style={{flex:1,height:1,background:`linear-gradient(90deg,${T.goldBorder},transparent)`}}/></div>;}
function TeachCard({title,body,badge}){
  return <div style={{background:T.teachBg,border:"1px solid rgba(80,180,80,.2)",borderRadius:20,padding:"24px 20px 18px",boxShadow:"0 6px 30px rgba(10,40,10,.25)"}}>
    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}><span>📖</span><span style={{fontFamily:"'Cinzel',serif",fontSize:9,letterSpacing:3,color:"#6EE7A0",textTransform:"uppercase"}}>{badge}</span></div>
    {title&&<p style={{fontFamily:"'Cinzel Decorative',serif",fontSize:15,color:"#A7F3C0",lineHeight:1.45,marginBottom:12}}>{title}</p>}
    {body&&<p style={{fontFamily:"'EB Garamond',serif",fontSize:17.5,lineHeight:2,color:"#E8F5EE",whiteSpace:"pre-wrap",margin:0}}>{body}</p>}
    {body&&<CopyBtn text={body} dark/>}
  </div>;
}
function PrayerCard({body,badge,icon,accent}){
  return <div style={{background:T.prayerBg,border:`1px solid ${accent}40`,borderRadius:20,padding:"24px 20px 18px",boxShadow:"0 6px 30px rgba(20,10,80,.3)"}}>
    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}><span>{icon}</span><span style={{fontFamily:"'Cinzel',serif",fontSize:9,letterSpacing:3,color:accent,textTransform:"uppercase"}}>{badge}</span></div>
    {body&&<p style={{fontFamily:"'EB Garamond',serif",fontSize:17.5,lineHeight:2,color:"#EEE8FF",whiteSpace:"pre-wrap",margin:0}}>{body}</p>}
    {body&&<CopyBtn text={body} dark/>}
  </div>;
}
function SitCard({body,badge,icon,color}){
  return <div style={{background:`linear-gradient(150deg,${color}18,${color}08)`,border:`1px solid ${color}40`,borderRadius:20,padding:"24px 20px 18px"}}>
    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}><span>{icon}</span><span style={{fontFamily:"'Cinzel',serif",fontSize:9,letterSpacing:3,color:color,textTransform:"uppercase"}}>{badge}</span></div>
    {body&&<p style={{fontFamily:"'EB Garamond',serif",fontSize:17.5,lineHeight:2,color:T.textMain,whiteSpace:"pre-wrap",margin:0}}>{body}</p>}
    {body&&<CopyBtn text={body}/>}
  </div>;
}

// ── AUTH SCREEN ───────────────────────────────────────────────────────────────
function AuthScreen({onLogin}){
  const[mode,setMode]=useState("login");
  const[email,setEmail]=useState("");
  const[pass,setPass]=useState("");
  const[name,setName]=useState("");
  const[loading,setLoading]=useState(false);
  const[msg,setMsg]=useState(null);

  async function submit(){
    if(!email.trim()||(mode!=="reset"&&!pass.trim())) return;
    setLoading(true); setMsg(null);
    try{
      if(mode==="login"){
        const data=await Auth.signIn(email,pass);
        if(data.error||!data.access_token) setMsg({t:"e",x:"Email ou mot de passe incorrect."});
        else { Auth.saveSession(data); onLogin(data); }
      } else if(mode==="signup"){
        const data=await Auth.signUp(email,pass,name);
        if(data.error) setMsg({t:"e",x:data.error.message?.includes("already")?"Cet email est déjà utilisé.":"Erreur lors de l'inscription."});
        else if(data.user){ const si=await Auth.signIn(email,pass); if(si.access_token){Auth.saveSession(si);onLogin(si);} else setMsg({t:"s",x:"Compte créé ! Connecte-toi."}); }
        else setMsg({t:"s",x:"Vérifie ton email pour confirmer ton compte."});
      } else {
        await Auth.resetPassword(email);
        setMsg({t:"s",x:"Email de réinitialisation envoyé !"});
      }
    }catch{ setMsg({t:"e",x:"Erreur réseau."}); }
    setLoading(false);
  }

  const inp={width:"100%",background:"rgba(255,255,255,.08)",border:"1px solid rgba(255,215,0,.2)",borderRadius:11,padding:"12px 14px",color:"#fff",fontFamily:"'EB Garamond',serif",fontSize:15,outline:"none"};
  const lbl={fontFamily:"'Cinzel',serif",fontSize:9,letterSpacing:3,color:"rgba(255,215,0,.6)",textTransform:"uppercase",display:"block",marginBottom:7};

  return(
    <div style={{minHeight:"100vh",background:"linear-gradient(160deg,#2D1A6E 0%,#1A0E4E 50%,#0D0830 100%)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"24px"}}>
      <div style={{textAlign:"center",marginBottom:30}}>
        <div style={{fontSize:52,marginBottom:10,filter:"drop-shadow(0 0 22px rgba(255,215,0,.7))"}}>✝</div>
        <h1 style={{fontFamily:"'Cinzel Decorative',serif",fontSize:22,color:"#FFD700",margin:"0 0 6px",letterSpacing:2}}>Le Sanctuaire</h1>
        <p style={{fontFamily:"'EB Garamond',serif",fontSize:15,fontStyle:"italic",color:"rgba(255,255,255,.45)",margin:0}}>Entre. Dieu t'attendait.</p>
      </div>
      <div style={{background:"rgba(255,255,255,.07)",backdropFilter:"blur(20px)",border:"1px solid rgba(255,215,0,.2)",borderRadius:24,padding:"30px 26px",width:"100%",maxWidth:400}}>
        {mode!=="reset"&&(
          <div style={{display:"flex",background:"rgba(0,0,0,.2)",borderRadius:12,padding:3,marginBottom:24}}>
            {["login","signup"].map(m=>(
              <button key={m} onClick={()=>{setMode(m);setMsg(null);}} style={{flex:1,padding:"9px",borderRadius:9,border:"none",cursor:"pointer",transition:"all .3s",background:mode===m?"rgba(255,215,0,.15)":"transparent",color:mode===m?"#FFD700":"rgba(255,255,255,.35)",fontFamily:"'Cinzel',serif",fontSize:11,letterSpacing:2}}>
                {m==="login"?"Connexion":"Inscription"}
              </button>
            ))}
          </div>
        )}
        {mode==="reset"&&(
          <div style={{marginBottom:20}}>
            <button onClick={()=>{setMode("login");setMsg(null);}} style={{background:"transparent",border:"none",color:"rgba(255,215,0,.5)",fontFamily:"'Cinzel',serif",fontSize:10,letterSpacing:2,cursor:"pointer"}}>‹ Retour</button>
            <p style={{fontFamily:"'Cinzel Decorative',serif",fontSize:16,color:"#FFD700",marginTop:10,marginBottom:0}}>Mot de passe oublié</p>
          </div>
        )}
        {mode==="signup"&&<div style={{marginBottom:14}}><label style={lbl}>Ton prénom</label><input value={name} onChange={e=>setName(e.target.value)} placeholder="Marie" style={inp}/></div>}
        <div style={{marginBottom:14}}><label style={lbl}>Email</label><input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="ton@email.com" style={inp}/></div>
        {mode!=="reset"&&(
          <div style={{marginBottom:18}}>
            <label style={lbl}>Mot de passe</label>
            <input type="password" value={pass} onChange={e=>setPass(e.target.value)} placeholder="••••••••" onKeyDown={e=>e.key==="Enter"&&submit()} style={inp}/>
            {mode==="login"&&<button onClick={()=>{setMode("reset");setMsg(null);}} style={{background:"transparent",border:"none",color:"rgba(255,215,0,.35)",fontFamily:"'Cinzel',serif",fontSize:9,letterSpacing:1,cursor:"pointer",marginTop:6,display:"block"}}>Mot de passe oublié ?</button>}
          </div>
        )}
        {msg&&<div style={{background:msg.t==="e"?"rgba(185,28,28,.2)":"rgba(21,128,61,.2)",border:`1px solid ${msg.t==="e"?"#F87171":"#4ADE80"}`,borderRadius:10,padding:"10px 14px",marginBottom:14}}>
          <p style={{fontFamily:"'EB Garamond',serif",fontSize:14,color:msg.t==="e"?"#FCA5A5":"#86EFAC",margin:0}}>{msg.x}</p>
        </div>}
        <button onClick={submit} disabled={loading} style={{width:"100%",padding:"15px",borderRadius:13,border:"none",cursor:loading?"not-allowed":"pointer",background:"linear-gradient(135deg,#D4AF37,#B8930A)",color:"#0D0A1E",fontFamily:"'Cinzel',serif",fontSize:12,letterSpacing:2,fontWeight:700,boxShadow:"0 4px 18px rgba(184,134,11,.4)",display:"flex",alignItems:"center",justifyContent:"center",gap:10}}>
          {loading?<Spinner size={20} color="#0D0A1E"/>:(mode==="login"?"✦ Se connecter":mode==="signup"?"✦ Créer mon compte":"✦ Envoyer le lien")}
        </button>
      </div>
      <p style={{fontFamily:"'EB Garamond',serif",fontSize:12,fontStyle:"italic",color:"rgba(255,255,255,.2)",marginTop:20,textAlign:"center"}}>✦ Tes données sont privées et sécurisées ✦</p>
    </div>
  );
}

// ── CODE SCREEN (entrer code d'accès) ─────────────────────────────────────────
function CodeScreen({session, onActivated, expired}){
  const[code,setCode]=useState("");
  const[loading,setLoading]=useState(false);
  const[msg,setMsg]=useState(null);

  async function activate(){
    if(!code.trim()) return;
    setLoading(true); setMsg(null);
    try{
      const entry = await DB.getCode(code.trim().toUpperCase());
      if(!entry) { setMsg({t:"e",x:"Code invalide. Vérifie le code reçu."}); setLoading(false); return; }
      if(entry.used) { setMsg({t:"e",x:"Ce code a déjà été utilisé."}); setLoading(false); return; }
      if(new Date(entry.expires_at) < new Date()) { setMsg({t:"e",x:"Ce code a expiré. Contacte-nous pour en obtenir un nouveau."}); setLoading(false); return; }
      // Activer l'abonnement 30 jours
      const expiresAt = addDays(30);
      await DB.createSubscription(session.user.id, session.user.email, expiresAt, session.access_token);
      await DB.markCodeUsed(code.trim().toUpperCase(), session.user.email, session.access_token);
      setMsg({t:"s",x:"🎉 Abonnement activé ! Bienvenue dans Le Sanctuaire !"});
      setTimeout(()=>onActivated(), 1500);
    }catch{ setMsg({t:"e",x:"Erreur réseau. Réessaie."}); }
    setLoading(false);
  }

  return(
    <div style={{minHeight:"100vh",background:"linear-gradient(160deg,#2D1A6E 0%,#1A0E4E 50%,#0D0830 100%)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"24px"}}>
      <div style={{textAlign:"center",marginBottom:30}}>
        <div style={{fontSize:52,marginBottom:10,filter:"drop-shadow(0 0 22px rgba(255,215,0,.7))"}}>🔑</div>
        <h1 style={{fontFamily:"'Cinzel Decorative',serif",fontSize:20,color:"#FFD700",margin:"0 0 8px",letterSpacing:2}}>
          {expired ? "Abonnement expiré" : "Code d'accès"}
        </h1>
        <p style={{fontFamily:"'EB Garamond',serif",fontSize:15,fontStyle:"italic",color:"rgba(255,255,255,.5)",margin:0,maxWidth:320,lineHeight:1.6}}>
          {expired
            ? "Ton abonnement a expiré. Entre ton nouveau code pour continuer à accéder au Sanctuaire."
            : "Entre le code d'accès reçu après ton paiement pour activer ton abonnement de 30 jours."
          }
        </p>
      </div>

      <div style={{background:"rgba(255,255,255,.07)",backdropFilter:"blur(20px)",border:"1px solid rgba(255,215,0,.2)",borderRadius:24,padding:"30px 26px",width:"100%",maxWidth:400}}>
        <label style={{fontFamily:"'Cinzel',serif",fontSize:9,letterSpacing:3,color:"rgba(255,215,0,.6)",textTransform:"uppercase",display:"block",marginBottom:7}}>Ton code d'accès</label>
        <input
          value={code} onChange={e=>setCode(e.target.value.toUpperCase())}
          placeholder="EX: ABC123-XY45"
          onKeyDown={e=>e.key==="Enter"&&activate()}
          style={{width:"100%",background:"rgba(255,255,255,.08)",border:"1px solid rgba(255,215,0,.3)",borderRadius:11,padding:"14px",color:"#FFD700",fontFamily:"'Cinzel',serif",fontSize:16,outline:"none",letterSpacing:3,textAlign:"center",marginBottom:20}}
        />

        {msg&&<div style={{background:msg.t==="e"?"rgba(185,28,28,.2)":"rgba(21,128,61,.2)",border:`1px solid ${msg.t==="e"?"#F87171":"#4ADE80"}`,borderRadius:10,padding:"10px 14px",marginBottom:16}}>
          <p style={{fontFamily:"'EB Garamond',serif",fontSize:14,color:msg.t==="e"?"#FCA5A5":"#86EFAC",margin:0}}>{msg.x}</p>
        </div>}

        <button onClick={activate} disabled={loading||!code.trim()} style={{width:"100%",padding:"15px",borderRadius:13,border:"none",cursor:loading||!code.trim()?"not-allowed":"pointer",background:code.trim()?"linear-gradient(135deg,#D4AF37,#B8930A)":"rgba(255,255,255,.1)",color:code.trim()?"#0D0A1E":"rgba(255,255,255,.3)",fontFamily:"'Cinzel',serif",fontSize:12,letterSpacing:2,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",gap:10}}>
          {loading?<Spinner size={20} color="#0D0A1E"/>:"✦ Activer mon accès"}
        </button>

        <div style={{marginTop:20,padding:"14px",background:"rgba(255,215,0,.06)",border:"1px solid rgba(255,215,0,.15)",borderRadius:12}}>
          <p style={{fontFamily:"'EB Garamond',serif",fontSize:13,color:"rgba(255,215,0,.6)",margin:0,textAlign:"center",lineHeight:1.6}}>
            Pas encore de code ? Abonne-toi à <strong style={{color:"#FFD700"}}>Le Sanctuaire</strong> pour seulement <strong style={{color:"#FFD700"}}>9,99€/mois</strong> et participe à l'avancement de l'œuvre de Dieu. 🙏
          </p>
        </div>
      </div>

      <button onClick={()=>{Auth.clearSession();window.location.reload();}} style={{marginTop:20,background:"transparent",border:"none",color:"rgba(255,255,255,.25)",fontFamily:"'Cinzel',serif",fontSize:10,letterSpacing:2,cursor:"pointer"}}>
        Se déconnecter
      </button>
    </div>
  );
}

// ── ADMIN SCREEN ──────────────────────────────────────────────────────────────
function AdminScreen({session}){
  const[codes,setCodes]=useState([]);
  const[loading,setLoading]=useState(true);
  const[generating,setGenerating]=useState(false);
  const[newCode,setNewCode]=useState(null);
  const[copied,setCopied]=useState(false);

  useEffect(()=>{
    DB.getAllCodes(session.access_token).then(data=>{
      if(Array.isArray(data)) setCodes(data);
      setLoading(false);
    });
  },[]);

  async function generateCode(){
    setGenerating(true);
    const code = genCode();
    const expiresAt = addDays(35); // 35 jours pour avoir le temps d'envoyer
    await DB.createCode(code, expiresAt, session.access_token);
    setNewCode(code);
    const updated = await DB.getAllCodes(session.access_token);
    if(Array.isArray(updated)) setCodes(updated);
    setGenerating(false);
  }

  function copyCode(code){
    navigator.clipboard.writeText(code);
    setCopied(code);
    setTimeout(()=>setCopied(null),2000);
  }

  const available = codes.filter(c=>!c.used&&new Date(c.expires_at)>new Date());
  const used      = codes.filter(c=>c.used);
  const expired   = codes.filter(c=>!c.used&&new Date(c.expires_at)<=new Date());

  return(
    <div style={{paddingTop:22}}>
      <div style={{textAlign:"center",marginBottom:24,padding:"20px",background:"linear-gradient(135deg,#2D1A6E,#1A0E4E)",borderRadius:20,border:"1px solid rgba(255,215,0,.2)"}}>
        <div style={{fontSize:32,marginBottom:8}}>⚙️</div>
        <h2 style={{fontFamily:"'Cinzel Decorative',serif",fontSize:16,color:"#FFD700",margin:"0 0 4px"}}>Panel Admin</h2>
        <p style={{fontFamily:"'EB Garamond',serif",fontSize:13,fontStyle:"italic",color:"rgba(255,255,255,.45)",margin:0}}>Gestion des codes d'accès</p>
      </div>

      {/* Stats */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:20}}>
        {[{label:"Disponibles",val:available.length,c:"#15803D"},{label:"Utilisés",val:used.length,c:"#2563EB"},{label:"Expirés",val:expired.length,c:"#B91C1C"}].map(s=>(
          <div key={s.label} style={{background:T.card,border:`1px solid ${s.c}30`,borderRadius:14,padding:"14px",textAlign:"center",boxShadow:T.cardShadow}}>
            <p style={{fontFamily:"'Cinzel Decorative',serif",fontSize:22,color:s.c,margin:"0 0 4px"}}>{s.val}</p>
            <p style={{fontFamily:"'Cinzel',serif",fontSize:9,color:T.textMuted,letterSpacing:2,margin:0,textTransform:"uppercase"}}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Générer un code */}
      <div style={{background:T.card,border:`1px solid ${T.cardBorder}`,borderRadius:16,padding:"20px",marginBottom:20,boxShadow:T.cardShadow}}>
        <p style={{fontFamily:"'Cinzel',serif",fontSize:10,letterSpacing:3,color:T.gold,marginBottom:14,textTransform:"uppercase"}}>✦ Générer un nouveau code</p>

        {newCode&&(
          <div style={{background:"#F0FDF4",border:"1px solid #86EFAC",borderRadius:12,padding:"16px",marginBottom:14,textAlign:"center"}}>
            <p style={{fontFamily:"'Cinzel',serif",fontSize:11,color:"#15803D",margin:"0 0 8px",letterSpacing:2}}>NOUVEAU CODE GÉNÉRÉ</p>
            <p style={{fontFamily:"'Cinzel',serif",fontSize:22,color:"#15803D",margin:"0 0 10px",letterSpacing:4,fontWeight:700}}>{newCode}</p>
            <button onClick={()=>copyCode(newCode)} style={{background:"#15803D",border:"none",borderRadius:20,padding:"8px 20px",cursor:"pointer",color:"#fff",fontFamily:"'Cinzel',serif",fontSize:10,letterSpacing:2}}>
              {copied===newCode?"✓ Copié !":"Copier le code"}
            </button>
          </div>
        )}

        <button onClick={generateCode} disabled={generating} style={{width:"100%",padding:"14px",borderRadius:12,border:"none",cursor:generating?"not-allowed":"pointer",background:"linear-gradient(135deg,#2D1A6E,#1A0E4E)",color:"#FFD700",fontFamily:"'Cinzel',serif",fontSize:11,letterSpacing:2,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
          {generating?<Spinner size={18} color="#FFD700"/>:"+ Générer un code"}
        </button>
        <p style={{fontFamily:"'EB Garamond',serif",fontSize:12,color:T.textMuted,margin:"10px 0 0",textAlign:"center",fontStyle:"italic"}}>
          Génère un code après chaque paiement reçu sur Chariow → envoie-le au client par WhatsApp ou email
        </p>
      </div>

      {/* Liste des codes disponibles */}
      {available.length>0&&(
        <div style={{marginBottom:20}}>
          <p style={{fontFamily:"'Cinzel',serif",fontSize:9,letterSpacing:3,color:"#15803D",textTransform:"uppercase",marginBottom:12}}>✓ CODES DISPONIBLES ({available.length})</p>
          {available.map(c=>(
            <div key={c.id} style={{background:"#F0FDF4",border:"1px solid #86EFAC",borderRadius:12,padding:"12px 16px",marginBottom:8,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <div>
                <p style={{fontFamily:"'Cinzel',serif",fontSize:14,color:"#15803D",margin:"0 0 3px",letterSpacing:2,fontWeight:700}}>{c.code}</p>
                <p style={{fontFamily:"'Cinzel',serif",fontSize:9,color:"#4ADE80",margin:0,letterSpacing:1}}>Expire le {formatDate(c.expires_at)}</p>
              </div>
              <button onClick={()=>copyCode(c.code)} style={{background:"#15803D",border:"none",borderRadius:20,padding:"6px 14px",cursor:"pointer",color:"#fff",fontFamily:"'Cinzel',serif",fontSize:9,letterSpacing:1}}>
                {copied===c.code?"✓":"Copier"}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Codes utilisés */}
      {used.length>0&&(
        <div style={{marginBottom:20}}>
          <p style={{fontFamily:"'Cinzel',serif",fontSize:9,letterSpacing:3,color:"#2563EB",textTransform:"uppercase",marginBottom:12}}>📧 CODES UTILISÉS ({used.length})</p>
          {used.slice(0,10).map(c=>(
            <div key={c.id} style={{background:T.card,border:`1px solid ${T.cardBorder}`,borderRadius:12,padding:"12px 16px",marginBottom:8,boxShadow:T.cardShadow}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <p style={{fontFamily:"'Cinzel',serif",fontSize:13,color:T.textSub,margin:"0 0 3px",letterSpacing:2}}>{c.code}</p>
                <span style={{fontFamily:"'Cinzel',serif",fontSize:9,color:"#2563EB",letterSpacing:1}}>✓ Utilisé</span>
              </div>
              {c.email&&<p style={{fontFamily:"'EB Garamond',serif",fontSize:13,color:T.textMuted,margin:0}}>{c.email}</p>}
            </div>
          ))}
        </div>
      )}

      {loading&&<div style={{textAlign:"center",padding:"30px 0"}}><Spinner size={36}/></div>}
    </div>
  );
}

// ── TODAY TAB ─────────────────────────────────────────────────────────────────
function TodayTab(){
  const dk=todayKey(),tl=todayLabel(),cKey=`today_${dk}`;
  const[tt,setTt]=useState(""); const[teach,setTeach]=useState(null); const[loadT,setLoadT]=useState(true);
  const[prayers,setPrayers]=useState({matin:null,midi:null,soir:null});
  const[loadP,setLoadP]=useState({matin:true,midi:true,soir:true});
  const[pTab,setPTab]=useState("matin");

  async function genPrayer(moment,key){
    const s=getSeed(),map={
      matin:`Le ${tl}. Seed:${s}. Prière du MATIN chrétienne. Adoration à l'aube, consécration journée, sagesse, protection, 1 verset. Commence directement. 200-230 mots. Amen.`,
      midi:`Le ${tl}. Seed:${s}. Prière de MIDI chrétienne. Pause avec Dieu, renouvellement, intercession. Commence directement. 170-210 mots. Amen.`,
      soir:`Le ${tl}. Seed:${s}. Prière du SOIR chrétienne. Action de grâce, pardon, nuit à Dieu, protection. Commence directement. 200-230 mots. Amen.`,
    };
    const txt=await ai(map[moment],850);
    setPrayers(p=>{const u={...p,[moment]:txt.trim()};const c=LS.get(key)||{};LS.set(key,{...c,p:{...c.p,[moment]:txt.trim()}});return u;});
    setLoadP(p=>({...p,[moment]:false}));
  }

  useEffect(()=>{
    const cached=LS.get(cKey);
    if(cached){
      setTt(cached.tt||"");setTeach(cached.t||null);setLoadT(false);
      const cp=cached.p||{matin:null,midi:null,soir:null};
      setPrayers(cp);setLoadP({matin:!cp.matin,midi:!cp.midi,soir:!cp.soir});
      if(!cp.matin)genPrayer("matin",cKey);if(!cp.midi)genPrayer("midi",cKey);if(!cp.soir)genPrayer("soir",cKey);
      return;
    }
    ai(`Nous sommes le ${tl}. Seed:${getSeed()}.\nEnseignement chrétien PROFOND et PUISSANT pour ce jour.\nLigne 1 : titre percutant (6-8 mots).\nLigne vide.\nEnsuite 320-370 mots : accroche fulgurante, 2 versets bibliques précis, révélation spirituelle, application concrète, déclaration prophétique finale.`,1400)
    .then(txt=>{
      const lines=txt.trim().split("\n"),t2=lines[0].replace(/[*#_]/g,"").trim(),body=lines.slice(2).join("\n").trim();
      setTt(t2);setTeach(body);setLoadT(false);
      LS.set(cKey,{tt:t2,t:body,p:{matin:null,midi:null,soir:null}});
      genPrayer("matin",cKey);genPrayer("midi",cKey);genPrayer("soir",cKey);
    });
  },[]);

  const PM={matin:{icon:"🌅",label:"Prière du Matin",ac:"#FCD34D"},midi:{icon:"☀️",label:"Prière de Midi",ac:"#93C5FD"},soir:{icon:"🌙",label:"Prière du Soir",ac:"#C4B5FD"}};
  return(
    <div style={{paddingTop:20}}>
      <div style={{textAlign:"center",marginBottom:24,padding:"24px 14px",background:"linear-gradient(135deg,#2D1A6E,#1A0E4E)",border:"1px solid rgba(212,175,55,.3)",borderRadius:22,boxShadow:"0 8px 32px rgba(30,10,90,.25)"}}>
        <div style={{fontSize:46,marginBottom:10,filter:"drop-shadow(0 0 18px rgba(255,215,0,.6))"}}>✝</div>
        <h1 style={{fontFamily:"'Cinzel Decorative',serif",fontSize:21,color:"#FFD700",margin:"0 0 14px",letterSpacing:2}}>Le Sanctuaire</h1>
        <div style={{display:"inline-block",background:"rgba(255,215,0,.12)",border:"1px solid rgba(255,215,0,.3)",borderRadius:12,padding:"9px 22px"}}>
          <p style={{fontFamily:"'Cinzel',serif",fontSize:13,letterSpacing:2,color:"#FFD700",margin:0,textTransform:"uppercase"}}>{tl}</p>
        </div>
      </div>
      <SL>📖 Enseignement du jour</SL>
      {loadT?<div style={{background:T.card,border:`1px solid ${T.cardBorder}`,borderRadius:20,padding:22,marginBottom:18,boxShadow:T.cardShadow}}><Shimmer msg="Préparation de l'enseignement…"/></div>
            :<div style={{marginBottom:20}}><TeachCard badge="Enseignement du jour" title={tt} body={teach}/></div>}
      <Divider/>
      <SL>🙏 Prières du jour</SL>
      <div style={{display:"flex",gap:5,marginBottom:14,background:"rgba(255,255,255,.6)",borderRadius:14,padding:4,border:"1px solid rgba(180,140,60,.15)"}}>
        {["matin","midi","soir"].map(k=>{const m=PM[k],a=pTab===k;return <button key={k} onClick={()=>setPTab(k)} style={{flex:1,padding:"10px 3px",borderRadius:10,border:"none",cursor:"pointer",background:a?"#2D1A6E":"transparent",color:a?m.ac:T.textSub,fontFamily:"'Cinzel',serif",fontSize:9.5,letterSpacing:1,transition:"all .3s",fontWeight:a?600:400,boxShadow:a?"0 2px 10px rgba(45,26,110,.3)":"none"}}>{m.icon} {k.charAt(0).toUpperCase()+k.slice(1)}</button>;})}
      </div>
      {loadP[pTab]?<div style={{background:T.prayerBg,border:"1px solid rgba(100,80,200,.2)",borderRadius:20,padding:22}}><Shimmer msg={`Génération de la prière du ${pTab}…`}/></div>
                 :<PrayerCard icon={PM[pTab].icon} badge={PM[pTab].label} accent={PM[pTab].ac} body={prayers[pTab]}/>}
    </div>
  );
}

// ── PROGRAMS TAB ──────────────────────────────────────────────────────────────
function ProgramsTab({userId,token}){
  const tk=todayKey(),tl=todayLabel();
  const[view,setView]=useState("list");
  const[selId,setSelId]=useState(null);
  const[programs,setPrograms]=useState({});
  const[loadingProgs,setLoadingProgs]=useState(true);
  const[sit,setSit]=useState("");
  const[problem,setProblem]=useState("");
  const[creating,setCreating]=useState(false);
  const[genDay,setGenDay]=useState(null);
  const[advOpen,setAdvOpen]=useState(true);

  useEffect(()=>{
    DB.getPrograms(userId,token).then(rows=>{
      if(Array.isArray(rows)){const m={};rows.forEach(r=>{m[r.id]=r.data;});setPrograms(m);}
      setLoadingProgs(false);
    });
  },[userId]);

  function getDayIdx(p){return Math.min(Math.max(daysDiff(p.startKey,tk),0),6);}

  useEffect(()=>{
    if(view!=="detail"||!selId)return;
    const prog=programs[selId];if(!prog)return;
    const di=getDayIdx(prog);if(prog.prayers[di])return;
    setGenDay(di);
    ai(`Programme prière — Jour ${di+1}/7.\nSituation : "${prog.sit.label}". Problème : "${prog.problem}".\nThème : "${prog.themes[di]}".\nPrière chrétienne profonde. 1 verset. 220-260 mots. Commence directement. Amen.`,900)
    .then(async txt=>{
      const updated={...programs,[selId]:{...prog,prayers:{...prog.prayers,[di]:txt.trim()}}};
      setPrograms(updated);
      await DB.upsert(selId,userId,updated[selId],token);
      setGenDay(null);
    });
  },[view,selId]);

  async function createProgram(){
    if(!sit||!problem.trim())return;
    setCreating(true);
    const sitObj=SITS.find(s=>s.label===sit)||SITS[0];
    const planTxt=await ai(`Personne traverse : "${sit}". Sa situation : "${problem}".\nFormat EXACT :\nCONSEIL:\n[conseil pastoral 4-5 phrases, 1 verset]\n\nPROGRAMME:\nJour 1 : [thème court]\nJour 2 : [thème court]\nJour 3 : [thème court]\nJour 4 : [thème court]\nJour 5 : [thème court]\nJour 6 : [thème court]\nJour 7 : [thème court]`,850);
    let advice="",themes=[];
    const cm=planTxt.match(/CONSEIL:\n([\s\S]*?)(?=\nPROGRAMME:)/),pm=planTxt.match(/PROGRAMME:\n([\s\S]*)/);
    if(cm)advice=cm[1].trim();if(pm)themes=pm[1].trim().split("\n").map(l=>l.replace(/^Jour \d+\s*:\s*/i,"").trim()).filter(Boolean).slice(0,7);
    while(themes.length<7)themes.push(`Prière ${themes.length+1}`);
    const day0=await ai(`Programme prière — Jour 1/7.\nSituation : "${sit}". Problème : "${problem}". Thème : "${themes[0]}".\nPrière chrétienne profonde, 1 verset. 220-260 mots. Commence directement. Amen.`,900);
    const id=Date.now().toString();
    const prog={id,sit:sitObj,problem,startKey:tk,startLabel:tl,advice,themes,prayers:{0:day0.trim()}};
    const updated={...programs,[id]:prog};
    setPrograms(updated);
    await DB.upsert(id,userId,prog,token);
    setSit("");setProblem("");setCreating(false);setSelId(id);setAdvOpen(true);setView("detail");
  }

  if(view==="detail"&&selId&&programs[selId]){
    const prog=programs[selId],di=getDayIdx(prog),color=prog.sit.c;
    return(
      <div style={{paddingTop:22}}>
        <button onClick={()=>setView("list")} style={{background:"transparent",border:`1px solid ${T.goldBorder}`,borderRadius:20,color:T.gold,fontFamily:"'Cinzel',serif",fontSize:10,letterSpacing:2,cursor:"pointer",marginBottom:18,padding:"6px 14px",display:"flex",alignItems:"center",gap:6}}>‹ Mes programmes</button>
        <div style={{background:T.card,border:`1px solid ${color}40`,borderRadius:20,padding:"18px",marginBottom:16,boxShadow:`0 4px 20px ${color}18`}}>
          <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:14}}>
            <div style={{width:50,height:50,borderRadius:13,display:"flex",alignItems:"center",justifyContent:"center",background:`${color}14`,border:`1px solid ${color}35`,fontSize:26,flexShrink:0}}>{prog.sit.icon}</div>
            <div style={{flex:1}}>
              <p style={{fontFamily:"'Cinzel Decorative',serif",fontSize:14,color:color,margin:"0 0 3px"}}>{prog.sit.label}</p>
              <p style={{fontFamily:"'EB Garamond',serif",fontSize:13.5,fontStyle:"italic",color:T.textSub,margin:"0 0 3px",lineHeight:1.4}}>{prog.problem}</p>
              <p style={{fontFamily:"'Cinzel',serif",fontSize:9,color:T.textMuted,margin:0}}>Commencé le {prog.startLabel}</p>
            </div>
          </div>
          <div style={{display:"flex",gap:5}}>
            {Array.from({length:7}).map((_,i)=>(
              <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
                <div style={{width:"100%",height:6,borderRadius:3,background:i<di?"#15803D":i===di?color:"rgba(0,0,0,.1)",boxShadow:i===di?`0 0 8px ${color}70`:"none",transition:"all .4s"}}/>
                <span style={{fontFamily:"'Cinzel',serif",fontSize:8,color:i<di?"#15803D":i===di?color:T.textMuted}}>{i+1}</span>
              </div>
            ))}
          </div>
        </div>
        {prog.advice&&(
          <div style={{background:T.card,border:`1px solid ${T.goldBorder}`,borderRadius:16,overflow:"hidden",marginBottom:14,boxShadow:T.cardShadow}}>
            <button onClick={()=>setAdvOpen(o=>!o)} style={{width:"100%",background:"transparent",border:"none",cursor:"pointer",padding:"13px 16px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <span style={{fontFamily:"'Cinzel',serif",fontSize:10,letterSpacing:2,color:T.gold}}>💡 CONSEIL PASTORAL</span>
              <span style={{color:T.gold,fontSize:15,display:"inline-block",transition:"transform .3s",transform:advOpen?"rotate(90deg)":"none"}}>›</span>
            </button>
            {advOpen&&<div style={{padding:"0 16px 16px"}}><p style={{fontFamily:"'EB Garamond',serif",fontSize:16.5,lineHeight:1.85,color:T.textMain,whiteSpace:"pre-wrap",margin:0,fontStyle:"italic"}}>{prog.advice}</p></div>}
          </div>
        )}
        <div style={{display:"flex",alignItems:"center",gap:10,margin:"16px 0 12px"}}>
          <div style={{flex:1,height:1,background:`linear-gradient(90deg,transparent,${color}30)`}}/>
          <div style={{background:`${color}15`,border:`1px solid ${color}40`,borderRadius:28,padding:"6px 14px"}}><p style={{fontFamily:"'Cinzel',serif",fontSize:10,color:color,margin:0,letterSpacing:2,fontWeight:600}}>JOUR {di+1} · {prog.themes[di]}</p></div>
          <div style={{flex:1,height:1,background:`linear-gradient(90deg,${color}30,transparent)`}}/>
        </div>
        {(genDay===di||!prog.prayers[di])
          ?<div style={{background:T.card,border:`1px solid ${T.cardBorder}`,borderRadius:20,padding:22,boxShadow:T.cardShadow}}><Shimmer msg={`Génération de la prière du Jour ${di+1}…`}/></div>
          :<SitCard icon="🙏" badge={`Prière — Jour ${di+1} / 7`} color={color} body={prog.prayers[di]}/>}
        {di<6&&<div style={{marginTop:14,background:T.card,border:`1px solid ${T.cardBorder}`,borderRadius:12,padding:"13px 16px",textAlign:"center",boxShadow:T.cardShadow}}><p style={{fontFamily:"'EB Garamond',serif",fontSize:15,fontStyle:"italic",color:T.textSub,margin:0}}>Reviens demain pour la prière du Jour {di+2} 🙏</p></div>}
        {di>=6&&<div style={{marginTop:14,background:"#F0FDF4",border:"1px solid #86EFAC",borderRadius:12,padding:"16px",textAlign:"center"}}><p style={{fontFamily:"'Cinzel Decorative',serif",fontSize:14,color:T.success,margin:"0 0 5px"}}>🎉 Programme accompli !</p><p style={{fontFamily:"'EB Garamond',serif",fontSize:14,fontStyle:"italic",color:"#166534",margin:0}}>7 jours de fidélité. Continue dans la prière !</p></div>}
        <button onClick={async()=>{const u={...programs};delete u[selId];setPrograms(u);await DB.delete(selId,userId,token);setView("list");}} style={{width:"100%",marginTop:14,padding:"11px",borderRadius:11,border:"1px solid #FCA5A5",background:"#FEF2F2",cursor:"pointer",color:T.danger,fontFamily:"'Cinzel',serif",fontSize:10,letterSpacing:2}}>Supprimer ce programme</button>
      </div>
    );
  }

  if(view==="new") return(
    <div style={{paddingTop:22}}>
      <button onClick={()=>setView("list")} style={{background:"transparent",border:`1px solid ${T.goldBorder}`,borderRadius:20,color:T.gold,fontFamily:"'Cinzel',serif",fontSize:10,letterSpacing:2,cursor:"pointer",marginBottom:18,padding:"6px 14px",display:"flex",alignItems:"center",gap:6}}>‹ Retour</button>
      <h2 style={{fontFamily:"'Cinzel Decorative',serif",fontSize:16,color:"#2D1A6E",marginBottom:4}}>Nouveau programme</h2>
      <p style={{fontFamily:"'EB Garamond',serif",fontSize:14,fontStyle:"italic",color:T.textSub,marginBottom:22}}>On te prépare un Parcours de prière de 7 jours pour régler ton problème</p>
      <SL>Ta situation</SL>
      <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:7,marginBottom:22}}>
        {SITS.map(s=>{const on=sit===s.label;return <button key={s.label} onClick={()=>setSit(s.label)} style={{background:on?`${s.c}14`:T.card,border:`1px solid ${on?s.c+"55":T.cardBorder}`,borderRadius:11,padding:"11px",cursor:"pointer",display:"flex",alignItems:"center",gap:9,transition:"all .2s",boxShadow:on?`0 2px 12px ${s.c}22`:T.cardShadow}}><span style={{fontSize:20}}>{s.icon}</span><span style={{fontFamily:"'EB Garamond',serif",fontSize:13.5,color:on?s.c:T.textSub,lineHeight:1.3}}>{s.label}</span></button>;})}
      </div>
      <SL>Décris ton problème</SL>
      <textarea value={problem} onChange={e=>setProblem(e.target.value)} placeholder="Explique ta situation en détail. Nous personnaliserons entièrement ton programme…" rows={5} style={{width:"100%",background:"#fff",border:`1px solid ${T.cardBorder}`,borderRadius:13,padding:"13px",color:T.textMain,fontFamily:"'EB Garamond',serif",fontSize:15,resize:"none",lineHeight:1.7,marginBottom:22}}/>
      {creating?<div style={{background:T.card,border:`1px solid ${T.cardBorder}`,borderRadius:20,padding:22,boxShadow:T.cardShadow}}><Shimmer msg="Création de ton programme personnalisé…"/></div>
               :<button onClick={createProgram} disabled={!sit||!problem.trim()} style={{width:"100%",padding:"16px",borderRadius:13,border:"none",cursor:sit&&problem.trim()?"pointer":"not-allowed",background:sit&&problem.trim()?"linear-gradient(135deg,#2D1A6E,#1A0E4E)":"rgba(0,0,0,.08)",color:sit&&problem.trim()?"#FFD700":"rgba(0,0,0,.25)",fontFamily:"'Cinzel',serif",fontSize:12,letterSpacing:2,fontWeight:700,boxShadow:sit&&problem.trim()?"0 4px 16px rgba(45,26,110,.35)":"none"}}>✦ Créer mon programme de 7 jours</button>}
    </div>
  );

  if(loadingProgs) return <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"60px 0",gap:16}}><Spinner size={40}/><p style={{fontFamily:"'EB Garamond',serif",fontSize:15,fontStyle:"italic",color:T.textMuted}}>Chargement de tes programmes…</p></div>;

  const list=Object.values(programs).sort((a,b)=>Number(b.id)-Number(a.id));
  const active=list.filter(p=>getDayIdx(p)<7),completed=list.filter(p=>getDayIdx(p)>=7);
  return(
    <div style={{paddingTop:22}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:22}}>
        <div><h2 style={{fontFamily:"'Cinzel Decorative',serif",fontSize:16,color:"#2D1A6E",margin:"0 0 3px"}}>Mes Programmes</h2><p style={{fontFamily:"'EB Garamond',serif",fontSize:14,fontStyle:"italic",color:T.textSub,margin:0}}>Parcours de prière · 7 jours</p></div>
        <button onClick={()=>setView("new")} style={{background:"linear-gradient(135deg,#2D1A6E,#1A0E4E)",border:"none",borderRadius:50,width:42,height:42,color:"#FFD700",fontSize:22,cursor:"pointer",fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 4px 16px rgba(45,26,110,.35)"}}>+</button>
      </div>
      {list.length===0&&<div style={{textAlign:"center",padding:"50px 18px"}}><div style={{fontSize:48,marginBottom:14}}>📿</div><p style={{fontFamily:"'EB Garamond',serif",fontSize:17,color:T.textSub,fontStyle:"italic",lineHeight:1.7}}>Lance un programme de prière de 7 jours et reviens chaque jour recevoir ta prière</p></div>}
      {active.map(p=>{const di=getDayIdx(p),pct=Math.round(((di+1)/7)*100);return(
        <button key={p.id} onClick={()=>{setSelId(p.id);setAdvOpen(true);setView("detail");}} style={{width:"100%",background:T.card,border:`1px solid ${p.sit.c}30`,borderRadius:17,padding:"16px",cursor:"pointer",textAlign:"left",display:"flex",flexDirection:"column",gap:11,marginBottom:11,boxShadow:T.cardShadow,transition:"all .2s"}}>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <div style={{width:46,height:46,borderRadius:12,display:"flex",alignItems:"center",justifyContent:"center",background:`${p.sit.c}14`,border:`1px solid ${p.sit.c}35`,fontSize:24,flexShrink:0}}>{p.sit.icon}</div>
            <div style={{flex:1,minWidth:0}}>
              <p style={{fontFamily:"'Cinzel',serif",fontSize:12,color:p.sit.c,margin:"0 0 3px",fontWeight:600}}>{p.sit.label}</p>
              <p style={{fontFamily:"'EB Garamond',serif",fontSize:13.5,color:T.textSub,margin:"0 0 3px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.problem}</p>
              <p style={{fontFamily:"'Cinzel',serif",fontSize:8.5,color:T.textMuted,margin:0}}>Commencé le {p.startLabel}</p>
            </div>
            <div style={{textAlign:"center",flexShrink:0}}><p style={{fontFamily:"'Cinzel Decorative',serif",fontSize:20,color:p.sit.c,margin:0}}>{di+1}</p><p style={{fontFamily:"'Cinzel',serif",fontSize:8,color:T.textMuted,margin:0}}>/ 7</p></div>
          </div>
          <div style={{height:4,background:"rgba(0,0,0,.08)",borderRadius:2}}><div style={{height:"100%",borderRadius:2,width:`${pct}%`,background:`linear-gradient(90deg,${p.sit.c}80,${p.sit.c})`,transition:"width .5s"}}/></div>
        </button>
      );})}
      {completed.length>0&&<><p style={{fontFamily:"'Cinzel',serif",fontSize:9,letterSpacing:3,color:"#15803D",textTransform:"uppercase",margin:"18px 0 10px"}}>✓ TERMINÉS ({completed.length})</p>{completed.map(p=><button key={p.id} onClick={()=>{setSelId(p.id);setAdvOpen(false);setView("detail");}} style={{width:"100%",background:"#F0FDF4",border:"1px solid #86EFAC",borderRadius:13,padding:"12px 15px",cursor:"pointer",textAlign:"left",display:"flex",alignItems:"center",gap:11,marginBottom:7}}><span style={{fontSize:22}}>{p.sit.icon}</span><div style={{flex:1}}><p style={{fontFamily:"'Cinzel',serif",fontSize:12,color:T.success,margin:"0 0 2px"}}>{p.sit.label}</p><p style={{fontFamily:"'Cinzel',serif",fontSize:8.5,color:"#4ADE80",margin:0}}>7 jours · {p.startLabel}</p></div><span style={{color:T.success,fontSize:18}}>✓</span></button>)}</>}
    </div>
  );
}

// ── ROOT ──────────────────────────────────────────────────────────────────────
export default function App(){
  const[session,setSession]=useState(()=>Auth.getSession());
  const[subscription,setSubscription]=useState(null);
  const[checkingSubscription,setCheckingSubscription]=useState(false);
  const[tab,setTab]=useState(0);

  const isAdmin = session?.user?.email === ADMIN_EMAIL;

  // Vérifier l'abonnement après connexion
  useEffect(()=>{
    if(!session?.access_token||isAdmin) return;
    setCheckingSubscription(true);
    DB.getSubscription(session.user.id, session.access_token).then(sub=>{
      setSubscription(sub);
      setCheckingSubscription(false);
    });
  },[session]);

  function handleLogin(data){ Auth.saveSession(data); setSession(data); }
  async function handleLogout(){ await Auth.signOut(session?.access_token); Auth.clearSession(); setSession(null); setSubscription(null); }
  function handleActivated(){ DB.getSubscription(session.user.id, session.access_token).then(sub=>setSubscription(sub)); }

  // Pas connecté
  if(!session?.access_token) return <AuthScreen onLogin={handleLogin}/>;

  // Vérification en cours
  if(checkingSubscription) return(
    <div style={{minHeight:"100vh",background:"linear-gradient(160deg,#2D1A6E,#1A0E4E,#0D0830)",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:20}}>
      <div style={{fontSize:52,filter:"drop-shadow(0 0 22px rgba(255,215,0,.7))"}}>✝</div>
      <Spinner size={40} color="#FFD700"/>
      <p style={{fontFamily:"'EB Garamond',serif",fontSize:15,fontStyle:"italic",color:"rgba(255,255,255,.4)"}}>Vérification de ton accès…</p>
    </div>
  );

  // Pas d'abonnement ou expiré (sauf admin)
  if(!isAdmin){
    const isExpired = subscription && new Date(subscription.expires_at) < new Date();
    const hasNoSub  = !subscription;
    if(hasNoSub || isExpired){
      return <CodeScreen session={session} onActivated={handleActivated} expired={isExpired}/>;
    }
  }

  const user = session.user;
  const subExpiry = subscription ? formatDate(subscription.expires_at) : null;
  const tabs = isAdmin
    ? [{i:"✝",l:"Aujourd'hui"},{i:"📿",l:"Programmes"},{i:"⚙️",l:"Admin"}]
    : [{i:"✝",l:"Aujourd'hui"},{i:"📿",l:"Programmes"}];

  return(
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Cinzel+Decorative:wght@400;700&family=EB+Garamond:ital,wght@0,400;0,500;1,400;1,500&display=swap');
        @keyframes shimmer{0%,100%{background-position:200% 0}50%{background-position:-200% 0}}
        @keyframes spin{to{transform:rotate(360deg)}}
        *{box-sizing:border-box;margin:0;padding:0}
        html,body{background:#F5F0E8}
        input,textarea{outline:none;box-sizing:border-box}
        input::placeholder{color:rgba(255,255,255,.3)}
        textarea::placeholder{color:#9A7E5A}
        ::-webkit-scrollbar{width:3px}
        ::-webkit-scrollbar-thumb{background:rgba(180,140,60,.3);border-radius:2px}
        button:hover{opacity:.88}
      `}</style>
      <div style={{minHeight:"100vh",background:T.bgGrad,color:T.textMain,maxWidth:480,margin:"0 auto",display:"flex",flexDirection:"column"}}>
        <div style={{position:"sticky",top:0,zIndex:200,background:T.nav,borderBottom:`1px solid ${T.navBorder}`,display:"flex",boxShadow:"0 2px 12px rgba(0,0,0,.2)"}}>
          {tabs.map((t,idx)=>(
            <button key={idx} onClick={()=>setTab(idx)} style={{flex:1,padding:"13px 8px",background:"transparent",border:"none",borderBottom:`3px solid ${tab===idx?"#FFD700":"transparent"}`,display:"flex",alignItems:"center",justifyContent:"center",gap:7,cursor:"pointer",transition:"all .3s"}}>
              <span style={{fontSize:16,opacity:tab===idx?1:.4}}>{t.i}</span>
              <span style={{fontFamily:"'Cinzel',serif",fontSize:10,letterSpacing:2,color:tab===idx?"#FFD700":"rgba(245,240,232,.35)",transition:"color .3s"}}>{t.l}</span>
            </button>
          ))}
          <button onClick={handleLogout} title="Se déconnecter" style={{padding:"13px 14px",background:"transparent",border:"none",borderBottom:"3px solid transparent",cursor:"pointer",color:"rgba(245,240,232,.3)",fontSize:18}}>⏻</button>
        </div>
        <div style={{flex:1,padding:"0 17px 80px",overflowY:"auto"}}>
          {tab===0&&<TodayTab/>}
          {tab===1&&<ProgramsTab userId={user.id} token={session.access_token}/>}
          {tab===2&&isAdmin&&<AdminScreen session={session}/>}
        </div>
        <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:480,background:T.nav,borderTop:`1px solid ${T.navBorder}`,padding:"9px 0 15px",textAlign:"center"}}>
          <p style={{fontFamily:"'Cinzel',serif",fontSize:8,letterSpacing:2,color:"rgba(212,175,55,.35)",textTransform:"uppercase"}}>
            {isAdmin ? "✦ Admin · Le Sanctuaire ✦" : `✦ Accès jusqu'au ${subExpiry} ✦`}
          </p>
        </div>
      </div>
    </>
  );
}
