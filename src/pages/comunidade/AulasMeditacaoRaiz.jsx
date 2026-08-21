import { useEffect, useState } from "react";

export default function AulasMeditacaoRaiz() {
  const [aulas, setAulas] = useState([]);
  const [aulaAtiva, setAulaAtiva] = useState(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");

  useEffect(() => {
    const sess = JSON.parse(localStorage.getItem("comunidade_session") || "{}");
    const em = sess.email || localStorage.getItem("user_email") || "";
    setEmail(em);
    if (em) {
      fetch(`https://renatodepaula.com/api/hotmart/aulas.php?email=${encodeURIComponent(em)}`)
        .then(r=>r.json())
        .then(data=>{ if(data.aulas){ setAulas(data.aulas); setAulaAtiva(data.aulas[0]); } })
        .finally(()=>setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  function marcarConcluida() {
    if (!aulaAtiva || !email) return;
    fetch("https://renatodepaula.com/api/hotmart/aulas.php", {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({ email, aula_id: aulaAtiva.id, progresso: 100, completou: true })
    }).then(()=>{
      setAulas(prev=>prev.map(a=>a.id===aulaAtiva.id ? {...a, assistida:true, progresso:100} : a));
    });
  }

  if (loading) return <div style={{padding:40}}>Carregando suas aulas...</div>;
  if (!aulas.length) return <div style={{padding:40}}>Nenhuma aula cadastrada ainda. Cadastre no phpMyAdmin na tabela aulas_raiz.</div>;

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: "0 auto" }}>
      <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 6 }}>Aulas Meditação Raiz</h1>
      <p style={{ color: "#6b7280", marginBottom: 24 }}>Sua jornada real - progresso salvo no seu perfil {email}</p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 24 }}>
        {/* Player */}
        <div style={{ background: "black", borderRadius: 16, overflow: "hidden", aspectRatio: "16/9" }}>
          {aulaAtiva?.video_url ? (
            <iframe src={aulaAtiva.video_url} style={{ width: "100%", height: "100%", border: 0 }} allowFullScreen />
          ) : (
            <div style={{ color: "white", display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>Sem video</div>
          )}
        </div>

        {/* Lista */}
        <div style={{ background: "white", borderRadius: 16, padding: 16, boxShadow: "0 4px 20px rgba(0,0,0,0.06)", height: "fit-content" }}>
          <h3 style={{ fontWeight: 700, marginBottom: 12 }}>{aulaAtiva?.modulo}</h3>
          {aulas.map(aula=>(
            <button 
              key={aula.id} 
              onClick={()=>setAulaAtiva(aula)}
              style={{ 
                width: "100%", textAlign: "left", padding: "12px", borderRadius: 10, marginBottom: 8,
                background: aulaAtiva?.id===aula.id ? "#f3f4f6" : "transparent",
                border: aula.assistida ? "1px solid #bbf7d0" : "1px solid #e5e7eb",
                display: "flex", justifyContent: "space-between", alignItems: "center"
              }}
            >
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{aula.ordem}. {aula.titulo}</div>
                <div style={{ fontSize: 12, color: "#6b7280" }}>{aula.duracao_min} min {aula.assistida ? "• Concluída" : `• ${aula.progresso}%`}</div>
              </div>
              {aula.assistida && <span style={{ color: "#16a34a" }}>✓</span>}
            </button>
          ))}
          <button onClick={marcarConcluida} style={{ marginTop: 16, width: "100%", background: "black", color: "white", padding: 12, borderRadius: 10, fontWeight: 600 }}>
            Marcar como concluída
          </button>
          <p style={{ fontSize: 11, color: "#9ca3af", marginTop: 8 }}>Isso já atualiza sua sequência real e seu "Olá, {email}" no dashboard.</p>
        </div>
      </div>

      <div style={{ marginTop: 24, background: "white", borderRadius: 16, padding: 20 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700 }}>{aulaAtiva?.titulo}</h2>
        <p style={{ color: "#4b5563", marginTop: 8 }}>{aulaAtiva?.descricao}</p>
      </div>
    </div>
  );
}
