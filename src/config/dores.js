export const EBOOK_TITULO = 'Mais Saúde, Menos Anti-inflamatórios'

export const INTRO_TEXTO =
  'Antes de continuar: as informações aqui têm um único objetivo — ajudar você a entender melhor a sua dor, nunca substituir uma avaliação médica. A automedicação com analgésicos e anti-inflamatórios por conta própria pode mascarar sinais importantes e, a longo prazo, sobrecarregar órgãos como rins e estômago. Sempre que a dor persistir, piorar ou vier acompanhada de outros sintomas, procure orientação profissional antes de tomar qualquer decisão sozinho.'

export const REGIOES = [
  {
    id: 'cabeca',
    label: 'Dor de cabeça',
    niveis: [
      {
        titulo: 'Possíveis causas',
        opcoes: ['Tensão ou estresse do dia a dia', 'Enxaqueca', 'Uso frequente de analgésicos'],
        citacao:
          'A maioria das dores de cabeça é primária — ligada à tensão muscular, ao estresse ou à enxaqueca — e não representa, por si só, um risco grave à saúde. Mas existe uma armadilha silenciosa: usar analgésicos com frequência pode causar o que chamamos de cefaleia por uso excessivo de medicação, transformando uma dor pontual em um ciclo crônico difícil de tratar. Quando o remédio vira rotina, ele deixa de ser solução e passa a ser parte do problema.',
      },
      {
        titulo: 'Cuidados imediatos',
        opcoes: ['Hidratação e sono', 'Pausas na tela', 'Compressa fria ou morna'],
        citacao:
          'Antes de recorrer a um comprimido, vale observar o básico: sono adequado, hidratação, pausas em telas e ambientes com boa iluminação já resolvem boa parte das dores tensionais. Uma compressa fria ou morna na testa e na nuca também costuma aliviar sem qualquer efeito colateral. Guardar o analgésico para quando o simples não for suficiente é uma forma de proteger seu corpo do uso repetitivo desnecessário.',
      },
      {
        titulo: 'Sinais de alerta',
        opcoes: ['Dor súbita e muito forte', 'Dor que piora e não passa', 'Dor com febre ou visão alterada'],
        citacao:
          'Existem sinais que exigem avaliação médica imediata: dor descrita como "a pior da vida", início súbito e intenso, ou dor acompanhada de febre, confusão mental, fraqueza em um lado do corpo ou alteração na visão. Se você precisa de analgésico mais de duas vezes por semana para dar conta da dor, isso também é um sinal de alerta — não da dor em si, mas de que chegou a hora de investigar a causa com um profissional.',
      },
    ],
  },
  {
    id: 'lombar',
    label: 'Dor lombar',
    niveis: [
      {
        titulo: 'Possíveis causas',
        opcoes: ['Esforço ao carregar peso', 'Postura no dia a dia', 'Dor que desce pra perna'],
        citacao:
          'A grande maioria das dores lombares nasce de sobrecarga muscular: carregar peso de forma inadequada, treinar além do habitual ou simplesmente passar o dia em más posturas. Em uma parcela menor dos casos, existe uma causa estrutural por trás — hérnia de disco, desgaste articular ou estreitamento do canal vertebral. A diferença entre os dois cenários nem sempre é possível perceber sozinho, e é exatamente aí que uma avaliação faz diferença.',
      },
      {
        titulo: 'Cuidados imediatos',
        opcoes: ['Alongamento leve', 'Fortalecimento do core', 'Evitar repouso prolongado'],
        citacao:
          'Ao contrário do que muita gente pensa, repouso absoluto raramente é a melhor resposta para a dor lombar — manter-se em movimento, dentro do limite da dor, costuma acelerar a recuperação. Alongamentos leves, fortalecimento da musculatura do abdômen e cuidado ao levantar peso (dobrando os joelhos, não a coluna) fazem parte do cuidado diário. Anti-inflamatórios podem ajudar pontualmente, mas usados por conta própria e por muitos dias seguidos, aumentam o risco de sobrecarregar os rins.',
      },
      {
        titulo: 'Sinais de alerta',
        opcoes: ['Fraqueza nas pernas', 'Alteração no controle da urina', 'Dor noturna que não passa'],
        citacao:
          'Alguns sinais transformam a dor lombar em urgência médica: formigamento ou fraqueza progressiva nas pernas, dormência na virilha, perda de controle da bexiga ou do intestino, febre ou dor noturna intensa que não melhora com repouso. Esse conjunto pode indicar compressão nervosa importante e exige avaliação imediata, não uma nova dose de anti-inflamatório por conta própria.',
      },
    ],
  },
  {
    id: 'pescoco',
    label: 'Dor no pescoço',
    niveis: [
      {
        titulo: 'Possíveis causas',
        opcoes: ['Tensão ou má postura', 'Dor após impacto ou trauma', 'Dor que irradia pro braço'],
        citacao:
          'Na maior parte dos casos, a dor no pescoço vem de tensão muscular, má postura mantida por horas ou desgaste natural das vértebras cervicais com o tempo. Estresse e ansiedade também tensionam essa região sem que a pessoa perceba. Já quando a dor não fica restrita ao pescoço e passa a se espalhar para ombro, braço ou mão, isso costuma indicar compressão de um nervo — um sinal de que vale investigar, não apenas massagear.',
      },
      {
        titulo: 'Cuidados imediatos',
        opcoes: ['Calor local', 'Pausas e alongamento', 'Ajuste da postura ao dormir'],
        citacao:
          'Calor local, pausas regulares para alongar o pescoço e atenção à postura — inclusive na hora de dormir — resolvem grande parte dos casos de tensão cervical. Evitar prender o celular entre o ombro e a orelha, ou passar horas olhando para baixo, faz mais diferença do que parece. Nem toda dor no pescoço precisa de remédio; muitas vezes precisa só de um ajuste de hábito.',
      },
      {
        titulo: 'Sinais de alerta',
        opcoes: ['Após queda ou acidente', 'Dor com febre ou perda de peso', 'Dormência no braço'],
        citacao:
          'Qualquer dor no pescoço após queda, pancada ou acidente de trânsito merece atenção, mesmo que pareça leve no início — lesões ocultas às vezes só se manifestam semanas depois. O mesmo vale para dor constante que piora progressivamente, atrapalha o sono, ou vem acompanhada de febre, suor noturno ou perda de peso sem explicação. Nesses cenários, o caminho certo é uma avaliação médica, não mais uma dose de analgésico.',
      },
    ],
  },
  {
    id: 'pes',
    label: 'Dor nos pés',
    niveis: [
      {
        titulo: 'Possíveis causas',
        opcoes: ['Ficar muito tempo em pé', 'Calçado inadequado', 'Mudança brusca de treino'],
        citacao:
          'A dor no pé — especialmente aquela sentida no calcanhar logo nos primeiros passos do dia — costuma vir de sobrecarga mecânica: ficar muitas horas em pé, usar calçados gastos ou rígidos demais, carregar peso extra ou mudar de uma rotina sedentária para treinos intensos de uma hora para outra. É basicamente uma fáscia que recebe mais impacto do que consegue absorver com segurança, dia após dia.',
      },
      {
        titulo: 'Cuidados imediatos',
        opcoes: ['Alongamento da panturrilha', 'Calçado com amortecimento', 'Gelo após esforço'],
        citacao:
          'Alongar a panturrilha e a sola do pé, trocar calçados desgastados por opções com bom amortecimento e aplicar gelo após esforço são medidas simples que ajudam bastante nos primeiros sinais. Evitar andar descalço em piso duro por longos períodos também protege a fáscia plantar. O erro mais comum é ignorar a dor e continuar treinando pesado, esperando que ela "passe sozinha".',
      },
      {
        titulo: 'Sinais de alerta',
        opcoes: ['Dor há mais de algumas semanas', 'Inchaço visível', 'Dor que muda a forma de andar'],
        citacao:
          'Quando a dor no pé persiste por mais de algumas semanas, piora progressivamente, vem acompanhada de inchaço visível ou muda a forma como você caminha, o autocuidado já não é suficiente. Alterações importantes na pisada também podem sobrecarregar joelhos e quadris com o tempo. Nesse ponto, vale a avaliação de um ortopedista ou fisioterapeuta para confirmar a causa e evitar que o problema se torne crônico.',
      },
    ],
  },
]
