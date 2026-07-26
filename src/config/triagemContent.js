import { HOTMART_PROGRAMA_URL, HOTMART_EBOOK_URL } from './links'

// Microconteúdos gratuitos (80-150 palavras) exibidos no resultado educacional.
// Não fazem parte do YAML de origem — foram escritos para preencher a
// especificação (seção 8, "Estrutura da saída 5"), mantendo o mesmo tom de
// cautela e prioridade à avaliação profissional já usado no restante do site.
export const MICROCONTEUDOS = {
  cap1_alertas:
    'Nem toda dor pede pressa, mas alguns sinais mudam completamente a urgência da situação: dor súbita e muito intensa, diferente de tudo que você já sentiu antes; dor no peito que surge do nada; fraqueza ou dormência repentina em um lado do corpo; febre alta associada à dor; ou qualquer sintoma que apareça logo após um trauma importante. Nesses casos, o tempo entre sentir e agir importa — não porque toda dor com esses sinais seja grave, mas porque só uma avaliação presencial consegue diferenciar o que pode esperar do que não pode. Aprender a reconhecer esse punhado de sinais de alerta é a base de qualquer decisão segura sobre dor.',
  cap2_sem_comprimido:
    'Antes de qualquer comprimido, existe um conjunto de medidas simples que ajudam boa parte das dores musculares e articulares: gelo nas primeiras 48 horas após uma lesão para reduzir inchaço, calor para relaxar tensão muscular mais antiga, e movimento controlado — que, ao contrário do que se imagina, costuma acelerar a recuperação mais do que o repouso absoluto. Fisioterapia entra quando a dor limita o movimento por mais tempo do que o esperado, ajudando a restaurar força e amplitude com segurança. Esse conjunto não substitui avaliação quando a dor é intensa ou persistente, mas é o primeiro passo que muita gente pula direto para o medicamento.',
  cap3_topicos:
    'Géis, cremes, pomadas e adesivos aplicados diretamente sobre a dor têm uma vantagem real: agem localmente, com menor absorção pelo corpo todo em comparação a um comprimido. Isso costuma significar menos efeitos colaterais sistêmicos, especialmente para quem já tem restrições ao uso de medicamentos orais. Ainda assim, eles não são isentos de cuidado — a pele pode reagir, e o uso prolongado sem melhora merece a mesma atenção que qualquer outro tratamento que não funciona como esperado. Vale conhecer as opções tópicas como uma alternativa a considerar, sempre lembrando que "aplicado na pele" não é sinônimo de "sem risco algum".',
  cap4_analgesicos:
    'Analgésicos comuns aliviam a dor, mas não tratam a causa — essa é a distinção mais importante para usá-los com segurança. Eles ajudam a atravessar um momento difícil, não substituem entender por que a dor apareceu. O uso ocasional, na dose certa, é geralmente seguro para a maioria das pessoas; o problema começa quando o remédio vira rotina sem que ninguém reavalie a situação. Interações com outros medicamentos, condições de saúde preexistentes e a frequência de uso são perguntas que vale fazer antes de tomar mais uma dose — de preferência, com orientação de um profissional que conhece seu histórico.',
  cap5_antiinflamatorios:
    'Anti-inflamatórios são eficazes justamente porque agem numa via biológica importante — e é essa mesma via que também protege o funcionamento dos rins, do estômago e da pressão arterial. Usados por poucos dias, em pessoas saudáveis, o risco costuma ser baixo. Usados repetidamente, por conta própria, ou em quem já tem alguma fragilidade renal, cardíaca ou digestiva, o cálculo muda: os efeitos adversos podem aparecer de forma silenciosa, sem sintoma nenhum até que o exame mostre alteração. Não é sobre nunca usar — é sobre saber quando esse remédio é uma boa ferramenta e quando ele merece supervisão.',
  cap6_uso_frequente:
    'Precisar de remédio para dor toda semana, ou quase todos os dias, é uma informação clínica — não apenas um hábito. Esse padrão costuma indicar que a causa da dor ainda não foi identificada ou tratada de verdade, e que o medicamento está mascarando um problema que continua ali. Além disso, uso frequente e prolongado é justamente o cenário onde efeitos colaterais cumulativos — em rins, estômago ou fígado — se tornam mais prováveis. Se esse é o seu caso, o próximo passo não é trocar de remédio por conta própria, é conversar com um médico sobre acompanhamento e, se necessário, exames que expliquem o que está por trás dessa necessidade constante.',
  cap7_outras_opcoes:
    'Quando a dor não responde bem ao que costuma funcionar para a maioria das pessoas, ou tem características incomuns — queimação, choque, formigamento, sensibilidade exagerada ao toque — pode ser hora de considerar abordagens mais específicas: medicações direcionadas para dor neuropática, infiltrações, ou acompanhamento multidisciplinar. Essas opções existem e podem fazer muita diferença, mas dependem de diagnóstico e acompanhamento profissional — não são escolhas para tentar por conta própria. Reconhecer que sua dor pode precisar de um caminho diferente do convencional já é um passo importante para buscar a avaliação certa.',
}

// Os placeholders [URL_...] do YAML ainda não têm produtos/páginas reais.
// URL_CONSULTA aponta pra página de consulta que já existe no site;
// URL_EBOOK usa o link (hoje fictício) já cadastrado em config/links.js;
// os demais (curso e miniaulas futuras) recebem links fictícios da Hotmart,
// a serem substituídos quando esses produtos existirem de verdade.
export const URL_PLACEHOLDERS = {
  '[URL_CONSULTA]': '/consulta',
  '[URL_EBOOK]': HOTMART_EBOOK_URL,
  '[URL_CURSO]': HOTMART_PROGRAMA_URL,
  '[URL_MINIAULA_ANTIINFLAMATORIOS]': 'https://pay.hotmart.com/SEU-PRODUTO-MINIAULA-ANTIINFLAMATORIOS',
  '[URL_MINIAULA_DOR_RECORRENTE]': 'https://pay.hotmart.com/SEU-PRODUTO-MINIAULA-DOR-RECORRENTE',
  '[URL_MINIAULA_SEM_COMPRIMIDO]': 'https://pay.hotmart.com/SEU-PRODUTO-MINIAULA-SEM-COMPRIMIDO',
}

export function resolveUrl(destino) {
  return URL_PLACEHOLDERS[destino] || destino
}
