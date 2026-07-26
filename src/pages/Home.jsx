import { Link } from "react-router-dom";
import fotoPrincipal from "../assets/renato.png";

const FOTO = fotoPrincipal;

const METODO = [
  { n: "01", titulo: "História e sintomas", texto: "O que começou, como evoluiu e o que realmente limita a vida." },
  { n: "02", titulo: "Exames e diagnósticos", texto: "Organização crítica do que já foi investigado e do que ainda falta." },
  { n: "03", titulo: "Medicamentos", texto: "O que é necessário, o que pode ser revisto e o que exige cautela." },
  { n: "04", titulo: "Rotina e hábitos", texto: "Sono, alimentação, movimento, trabalho e possibilidades reais." },
  { n: "05", titulo: "Contexto emocional", texto: "Estresse, relações e padrões que influenciam o cuidado." },
  { n: "06", titulo: "Sentido e valores", texto: "Espiritualidade e propósito quando forem importantes para a pessoa." },
];

const TRAJETORIA = [
  { titulo: "UFRJ", texto: "Formação médica clássica, com base em ciência, hospital e raciocínio clínico." },
  { titulo: "Austrália", texto: "Parte da formação vivida fora do Brasil, com novas referências culturais e acadêmicas." },
  { titulo: "Aeronáutica", texto: "Disciplina, responsabilidade, trabalho em equipe e decisões em contextos reais." },
  { titulo: "Nefrologia", texto: "Contato profundo com doença crônica, vulnerabilidade, tecnologia e continuidade do cuidado." },
  { titulo: "Internet e educação", texto: "Tradução do conhecimento médico para ampliar autonomia e alcançar pessoas fora do consultório." },
  { titulo: "Viagens, neurociência e meditação", texto: "Reflexões sobre sofrimento, comportamento, consciência, espiritualidade e mudança." },
];

function Home() {
  return (
    <>
      {/* 1. Hero */}
      <section className="hero">
        <div className="container hero-grid">
          <div className="hero-copy">
            <p style={{ fontWeight: 700, color: "var(--primary)", marginBottom: 8 }}>Médico pela UFRJ</p>
            <h1>Medicina clínica além do medicamento.</h1>
            <p className="lede">Uma forma de cuidar que parte da medicina clássica, organiza o que está acontecendo e considera a pessoa por inteiro — sem abandonar a ciência, os diagnósticos ou os tratamentos necessários.</p>
            <div className="hero-actions">
              <Link to="/consulta" className="btn btn-primary btn-pill btn-mobile-full">
                Agendar consulta
              </Link>
              <a href="#posicionamento" className="btn-ghost">
                Conhecer meu trabalho
              </a>
            </div>
            <p style={{ marginTop: 20, fontSize: 14, color: "var(--text)" }}>Formação médica clássica. Visão ampliada do ser humano.</p>
          </div>
          <div className="hero-media">
            <img src={FOTO} alt="Dr. Renato Silva de Paula" />
          </div>
        </div>
      </section>

      {/* 2. Autoridade / Posicionamento */}
      <section id="posicionamento" className="section">
        <div className="container two-col">
          <div className="hero-media">
            <img src={FOTO} alt="Dr. Renato Silva de Paula em ambiente clínico" />
          </div>
          <div>
            <span className="eyebrow">Posicionamento</span>
            <h2>Formação médica clássica. Uma visão ampliada do ser humano.</h2>
            <p>Minha atuação parte da medicina tradicional: história clínica, raciocínio diagnóstico, interpretação de exames e tratamento baseado em evidências.</p>
            <p>Mas a experiência me ensinou que uma pessoa não cabe apenas em resultados de laboratório. Rotina, sono, comportamento, relações, emoções, valores e espiritualidade também podem influenciar a forma como ela adoece, reage e muda.</p>
            <p style={{ fontWeight: 700, color: "var(--text-h)" }}>Isso não significa abandonar medicamentos ou tratamentos convencionais. Significa entender quando são necessários — e reconhecer quando, sozinhos, não são suficientes.</p>
          </div>
        </div>
      </section>

      {/* 3. Problema / clareza */}
      <section className="section section-alt">
        <div className="container two-col">
          <div>
            <span className="eyebrow">Por que esse trabalho existe</span>
            <h2>Entender o que está acontecendo também faz parte do tratamento.</h2>
            <p>Muitas pessoas acumulam exames, diagnósticos, prescrições e opiniões diferentes, mas continuam sem compreender o próprio quadro.</p>
            <p>Meu trabalho é organizar esse cenário, explicar prioridades, avaliar riscos e construir um plano por etapas — sem promessas fáceis, tratamentos genéricos ou excesso de intervenções.</p>
            <p style={{ fontWeight: 700, color: "var(--text-h)" }}>Quanto melhor o paciente compreende sua saúde, maior sua capacidade de participar das decisões e sustentar mudanças.</p>
          </div>
          <div className="hero-media">
            <img src={FOTO} alt="Consulta: conversa, escuta e organização do caso" />
          </div>
        </div>
      </section>

      {/* 4. Método */}
      <section className="section">
        <div className="container center" style={{ marginBottom: 32 }}>
          <span className="eyebrow">Como eu trabalho</span>
          <h2>Um olhar clínico, humano e organizado.</h2>
          <p className="lede" style={{ margin: "0 auto" }}>
            Nem toda consulta precisa abordar todos os campos. O aprofundamento depende do que é relevante para cada pessoa.
          </p>
        </div>
        <div className="container card-grid">
          {METODO.map((item) => (
            <div className="card" key={item.n}>
              <div className="card-icon">{item.n}</div>
              <h3>{item.titulo}</h3>
              <p>{item.texto}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 5. Trajetória */}
      <section className="section section-alt">
        <div className="container center" style={{ marginBottom: 32 }}>
          <span className="eyebrow">Trajetória</span>
          <h2>A medicina me deu a base. A trajetória ampliou o olhar.</h2>
          <p className="lede" style={{ margin: "0 auto" }}>
            A história entra aqui apenas para mostrar como cada etapa transformou sua maneira de cuidar — não como currículo completo.
          </p>
        </div>
        <div className="container card-grid">
          {TRAJETORIA.map((item) => (
            <div className="card trajetoria-card" key={item.titulo}>
              <img src={FOTO} alt={item.titulo} />
              <h3>{item.titulo}</h3>
              <p>{item.texto}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 6. Síntese da história */}
      <section className="section center">
        <div className="container" style={{ maxWidth: 720, width: "100%", margin: "0 auto" }}>
          <span className="eyebrow">Síntese da história</span>
          <h2>Nada disso substituiu minha formação médica. Transformou minha maneira de escutar.</h2>
          <p className="lede" style={{ margin: "0 auto 28px" }}>
            Hoje procuro unir rigor técnico e humanidade no encontro pessoal, respeitando as evidências científicas sem reduzir o paciente ao seu diagnóstico.
          </p>
          <Link to="/sobre" className="btn btn-primary btn-pill btn-mobile-full">
            Conhecer minha trajetória completa
          </Link>
        </div>
      </section>

      {/* 7. Próximos passos */}
      <section className="section section-alt">
        <div className="container center" style={{ marginBottom: 32 }}>
          <span className="eyebrow">Próximos passos</span>
          <h2>Como posso ajudar você?</h2>
          <p className="lede" style={{ margin: "0 auto" }}>
            A Home apresenta as possibilidades. Cada opção abre uma página própria, com detalhes, critérios e agendamento.
          </p>
        </div>
        <div className="container card-grid">
          <div className="card">
            <h3>Avaliação clínica</h3>
            <p>Para organizar sintomas, exames, medicamentos, diagnósticos e prioridades em uma consulta aprofundada.</p>
            <Link to="/consulta" className="btn-ghost">
              Conhecer a consulta
            </Link>
          </div>
          <div className="card featured">
            <span className="badge">Principal</span>
            <h3>Acompanhamento médico</h3>
            <p>Para quem precisa de continuidade, revisão periódica, ajustes e um plano desenvolvido por etapas.</p>
            <Link to="/consulta" className="btn btn-primary btn-mobile-full">
              Conhecer o acompanhamento
            </Link>
          </div>
          <div className="card">
            <h3>Check-up organizado</h3>
            <p>Para revisar riscos, histórico, prevenção e exames com um plano claro, sem pedir testes indiscriminadamente.</p>
            <Link to="/consulta" className="btn-ghost">
              Conhecer o check-up
            </Link>
          </div>
        </div>
      </section>

      {/* 8. Cursos e materiais */}
      <section className="section">
        <div className="container two-col">
          <div>
            <span className="eyebrow">Cursos e experiências</span>
            <h2>Meditação, consciência e mudança possível.</h2>
            <p>Conteúdos estruturados, com aplicação prática e responsabilidade, para quem deseja aprofundar a relação com a própria mente e rotina.</p>
            <Link to="/cursos" className="btn btn-secondary btn-mobile-full">
              Conhecer os cursos
            </Link>

            <div className="card" style={{ marginTop: 28 }}>
              <h3>E-books e materiais</h3>
              <p>Guias acessíveis para compreender temas de saúde e dar o primeiro passo.</p>
              <Link to="/cursos" className="btn-ghost">
                Conhecer os materiais
              </Link>
            </div>
          </div>
          <div className="hero-media">
            <img src={FOTO} alt="Cursos e experiências — Meditação Raiz" />
          </div>
        </div>
      </section>

      {/* 9. Conteúdos */}
      <section className="section section-alt">
        <div className="container conteudos-layout">
          <div className="conteudos-intro">
            <span className="eyebrow">Conteúdos</span>
            <h2>Conhecimento também é uma forma de cuidado.</h2>
            <p className="lede">Artigos, vídeos e reflexões sobre medicina, saúde, comportamento, espiritualidade e qualidade de vida.</p>
          </div>

          <div className="conteudos-featured-wrap">
            <img src={FOTO} alt="Artigo em destaque" className="conteudos-featured-img" />
          </div>

          <div className="conteudos-artigo">
            <h3>Escitalopram e meditação: por que não precisam ser caminhos concorrentes.</h3>
            <p>Título-base a confirmar. O destaque deve mostrar sua capacidade de conectar medicina, comportamento e subjetividade sem falsa oposição.</p>
            <button type="button" className="btn btn-primary" disabled style={{ opacity: 0.5, cursor: "not-allowed" }}>
              Ler artigo — em breve
            </button>
          </div>

          <div className="conteudos-thumbs">
            <div className="conteudos-thumb">
              <img src={FOTO} alt="Tratar sintomas não é o mesmo que compreender o adoecimento" />
              <p>Tratar sintomas não é o mesmo que compreender o adoecimento</p>
            </div>
            <div className="conteudos-thumb">
              <img src={FOTO} alt="Como organizar exames, diagnósticos e medicamentos" />
              <p>Como organizar exames, diagnósticos e medicamentos</p>
            </div>
          </div>
        </div>
      </section>

      {/* 10. CTA final */}
      <section className="section center">
        <div className="container" style={{ maxWidth: 720, width: "100%", margin: "0 auto" }}>
          <h2>Você não precisa escolher entre ciência e profundidade humana.</h2>
          <p className="lede" style={{ margin: "0 auto 28px" }}>
            O cuidado pode ser tecnicamente responsável e, ao mesmo tempo, atento à história, à subjetividade e à vida real.
          </p>
          <div className="hero-actions" style={{ justifyContent: "center" }}>
            <Link to="/consulta" className="btn btn-primary btn-pill btn-mobile-full">
              Agendar uma consulta
            </Link>
            <Link to="/consulta" className="btn btn-secondary btn-mobile-full">
              Conhecer o acompanhamento
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

export default Home;
