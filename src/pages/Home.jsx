import { Link } from 'react-router-dom'
import heroImg from '../assets/renato.png'
import atendendoImg from '../assets/renato_atendendo.png'

const MODULOS = [
  {
    titulo: 'Módulo 1 — Reconhecendo a dor',
    desc: 'Sinais de alerta que exigem atendimento imediato e como agir nas primeiras horas.',
    aulas: ['Aula 1 — Dores e sinais de alerta', 'Aula 2 — Gelo, calor, movimento e fisioterapia'],
  },
  {
    titulo: 'Módulo 2 — Tratamentos e cuidados',
    desc: 'O que existe disponível, como funciona e os limites de cada abordagem.',
    aulas: [
      'Aula 3 — Tratamentos tópicos: pomadas, géis e adesivos',
      'Aula 4 — Analgésicos comuns: benefícios e cuidados',
      'Aula 5 — Anti-inflamatórios: riscos à saúde',
    ],
  },
  {
    titulo: 'Módulo 3 — Quando buscar ajuda médica',
    desc: 'Acompanhamento, exames e as opções que só um profissional pode indicar.',
    aulas: ['Aula 6 — Uso frequente e necessidade de exames', 'Aula 7 — Outras opções médicas para dores específicas'],
  },
]

function Home() {
  return (
    <>
      {/* 1. Hero principal */}
      <section className="hero">
        <div className="container hero-grid">
          <div className="hero-copy">
            <span className="eyebrow">Dr. Renato Silva de Paula • Nefrologista</span>
            <h1>Menos Dor, Mais Segurança</h1>
            <p className="lede">
              Um programa completo em vídeo para você entender sinais de alerta,
              tratamentos e quando realmente procurar um médico — com linguagem
              simples e responsável.
            </p>
            <div className="hero-actions">
              <Link to="/cursos" className="btn btn-primary btn-pill">
                Quero Conhecer o Programa
              </Link>
              <Link to="/cursos" className="btn-ghost">
                Prefiro só o e-book por R$ 47
              </Link>
            </div>
            <div className="stat-row">
              <div className="stat">
                <strong>850mil+</strong>
                <span>visualizações no vídeo original</span>
              </div>
              <div className="stat">
                <strong>7 aulas</strong>
                <span>gravadas e objetivas</span>
              </div>
            </div>
          </div>
          <div className="hero-media">
            <img src={heroImg} alt="Dr. Renato Silva de Paula" />
          </div>
        </div>
      </section>

      {/* 2. Sobre o médico */}
      <section className="section">
        <div className="container two-col">
          <div className="hero-media">
            <img src={atendendoImg} alt="Dr. Renato Silva de Paula atendendo" />
          </div>
          <div>
            <span className="eyebrow">Conheça o nefrologista</span>
            <h2>Mais de 850 mil seguidores confiam no trabalho do Dr. Renato</h2>
            <p className="lede">
              Olá, sou o Dr. Renato Silva de Paula e convido você a conhecer meu
              trabalho focado em prevenção, escuta ativa e educação em saúde renal.
            </p>
            <p>
              Médico nefrologista com atuação clínica e em educação em saúde,
              levando informação responsável para centenas de milhares de pessoas
              nas redes sociais — sempre deixando claro que conteúdo não substitui
              consulta médica.
            </p>
            <Link to="/sobre" className="btn btn-secondary">
              Veja minha trajetória
            </Link>
          </div>
        </div>
      </section>

      {/* 3. Três cards resumindo os produtos */}
      <section className="section section-alt">
        <div className="container center" style={{ marginBottom: 32 }}>
          <span className="eyebrow">Acesse o trabalho do Dr. Renato online</span>
          <h2>Escolha como quer aprender e se cuidar</h2>
        </div>
        <div className="container card-grid">
          <div className="card">
            <div className="card-icon">📖</div>
            <h3>E-book</h3>
            <p>Aprenda lendo, no seu próprio ritmo. Um material objetivo e direto ao ponto.</p>
            <Link to="/cursos" className="btn-ghost">
              Saiba mais
            </Link>
          </div>
          <div className="card">
            <div className="card-icon">🎬</div>
            <h3>Programa Completo</h3>
            <p>São 7 aulas gravadas com explicação guiada e o e-book incluso como bônus.</p>
            <Link to="/cursos" className="btn-ghost">
              Saiba mais
            </Link>
          </div>
          <div className="card">
            <div className="card-icon">🩺</div>
            <h3>Consulta via telemedicina</h3>
            <p>Atendimento humanizado com foco em prevenção, onde você estiver.</p>
            <Link to="/consulta" className="btn-ghost">
              Saiba mais
            </Link>
          </div>
        </div>
      </section>

      {/* 4. Curso em destaque, com módulos */}
      <section className="section">
        <div className="container center" style={{ marginBottom: 32 }}>
          <span className="eyebrow">Programa 100% online</span>
          <h2>Menos Dor, Mais Segurança</h2>
          <p className="lede" style={{ margin: '0 auto' }}>
            O que vou apresentar a você é prático e direto, fruto de anos de
            consultório — para que você saiba exatamente o que fazer diante da dor.
          </p>
        </div>
        <div className="container">
          <div className="card-grid">
            {MODULOS.map((modulo) => (
              <div className="card" key={modulo.titulo}>
                <h3>{modulo.titulo}</h3>
                <p>{modulo.desc}</p>
                <ul className="info-list">
                  {modulo.aulas.map((aula) => (
                    <li key={aula}>
                      <span className="info-icon">✓</span>
                      <span>{aula}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="center" style={{ marginTop: 32 }}>
            <Link to="/cursos" className="btn btn-primary btn-pill">
              Quero o Programa Completo — R$ 97
            </Link>
          </div>
        </div>
      </section>

      {/* 5. Atendimento / Telemedicina */}
      <section className="section section-alt">
        <div className="container center" style={{ marginBottom: 32 }}>
          <span className="eyebrow">Atendimento em todo o Brasil</span>
          <h2>Consulta com foco em prevenção</h2>
        </div>
        <div className="container card-grid">
          <div className="card">
            <h3>Atendimento exclusivo</h3>
            <p>
              A consulta é realizada seguindo todas as recomendações e os
              preceitos de ética e moral da medicina.
            </p>
          </div>
          <div className="card">
            <h3>100% humanizado</h3>
            <p>
              Escuta ativa do seu histórico antes de qualquer conduta, sempre com
              tempo para tirar suas dúvidas.
            </p>
          </div>
          <div className="card">
            <h3>Feito para todos</h3>
            <p>
              A distância não é mais um empecilho — agende de onde você estiver,
              no horário que for melhor pra você.
            </p>
          </div>
        </div>
        <div className="center" style={{ marginTop: 32 }}>
          <Link to="/consulta" className="btn btn-primary btn-pill">
            Agende a sua Consulta
          </Link>
        </div>
      </section>

      {/* 6. Depoimentos */}
      <section className="section">
        <div className="container center" style={{ marginBottom: 8 }}>
          <span className="eyebrow">Origem do conteúdo</span>
          <h2>"Então, doutor... o que eu faço quando sentir dor?"</h2>
          <p className="lede" style={{ margin: '0 auto 32px' }}>
            Foi essa a pergunta mais repetida pelos seguidores depois que o vídeo
            original do Dr. Renato ultrapassou <strong>850 mil visualizações</strong>.
          </p>
        </div>
        <div className="container card-grid">
          <div className="testimonial">
            <p>"Ele me explicou de um jeito que finalmente entendi quando devo me preocupar."</p>
            <div className="who">— Maria Fernanda</div>
          </div>
          <div className="testimonial">
            <p>"Sempre tomava remédio por conta própria. Depois desse conteúdo, mudei minha visão."</p>
            <div className="who">— Carlos Andrade</div>
          </div>
          <div className="testimonial">
            <p>"Simples, objetivo, direto e muito seguro. Recomendo isso para todo mundo."</p>
            <div className="who">— Joana Silva</div>
          </div>
        </div>
      </section>

      {/* 7. E-book em destaque */}
      <section className="section section-alt">
        <div className="container two-col">
          <div>
            <span className="eyebrow">Material 100% original</span>
            <h2>E-book: Menos Dor, Mais Segurança</h2>
            <p className="lede">
              Escrito pelo próprio Dr. Renato, o e-book traz um conteúdo direto
              para quem quer entender a dor sem enrolação — no seu próprio ritmo
              de leitura.
            </p>
            <p>
              Já incluso de graça em quem compra o Programa Completo, ou disponível
              avulso por um valor mais econômico para quem prefere só ler.
            </p>
            <Link to="/cursos" className="btn btn-secondary">
              Ver opções do e-book
            </Link>
          </div>
          <div className="hero-media">
            <img src={heroImg} alt="E-book Menos Dor, Mais Segurança" />
          </div>
        </div>
      </section>

      {/* 8. Pacotes / Preços */}
      <section className="section center">
        <div className="container" style={{ marginBottom: 32 }}>
          <span className="eyebrow">Escolha seu pacote</span>
          <h2>Opções para suas necessidades e seu bolso</h2>
        </div>
        <div className="container pricing-grid">
          <div className="pricing-card featured">
            <span className="badge">Mais recomendado</span>
            <div className="pricing-title">Programa Completo</div>
            <div className="pricing-price">R$ 97</div>
            <p className="pricing-includes">Inclui:</p>
            <ul className="pricing-list">
              <li>7 aulas gravadas</li>
              <li>Explicação guiada</li>
              <li>E-book de apoio incluso</li>
            </ul>
            <Link to="/cursos" className="btn btn-primary btn-block">
              Quero o Programa Completo
            </Link>
          </div>
          <div className="pricing-card">
            <div className="pricing-title">E-book</div>
            <div className="pricing-price">R$ 47</div>
            <p className="pricing-includes">Inclui:</p>
            <ul className="pricing-list">
              <li>Ler no próprio ritmo</li>
              <li>Opção mais econômica</li>
            </ul>
            <Link to="/cursos" className="btn btn-secondary btn-block">
              Quero só o e-book
            </Link>
          </div>
        </div>
      </section>

      {/* 9. CTA final / Fale conosco */}
      <section className="section section-alt center">
        <div className="container">
          <h2>Ficou com alguma dúvida?</h2>
          <p className="lede" style={{ margin: '0 auto 28px' }}>
            Entre em contato para tirar qualquer dúvida sobre o programa, o
            e-book ou a consulta. Estamos à disposição para te ajudar a escolher
            a melhor opção.
          </p>
          <Link to="/contato" className="btn btn-primary btn-pill">
            Fale Conosco
          </Link>
        </div>
      </section>
    </>
  )
}

export default Home
