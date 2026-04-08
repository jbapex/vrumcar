# Mapeamento operacional do CRM com o lojista

> Documento pra sentar com seu amigo e percorrer **passo a passo** como uma loja de carros funciona, capturando o que o sistema precisa fazer em cada momento. No fim, você sai com a lista completa de funcionalidades organizada por módulo, validada por quem entende do negócio.

---

## Como usar este documento

**A dinâmica é essa:** você lê em voz alta cada bloco pra ele, faz a pergunta inicial, e ele descreve. Conforme ele descreve, você anota o que o sistema precisa fazer. Sempre que ele citar algo que o sistema precisa fazer, escreve no formato:

> **[MÓDULO]** → O sistema precisa: [funcionalidade descrita]

Exemplo: ele fala "quando chega um carro novo, eu anoto na planilha o quanto paguei, o quanto vou gastar com transferência, e quanto quero vender". Você anota:

> **[ESTOQUE]** → O sistema precisa: registrar custo de aquisição, despesas previstas (transferência, mecânica, polimento, detalhamento), preço de venda alvo, e calcular margem automaticamente.

Não precisa se preocupar com como vai construir, só com o **quê**.

**Tempo estimado**: 2-3 horas. Pode quebrar em 2 encontros (parte 1 e 2 num dia, parte 3 e 4 no outro).

**Leve**: caderno + caneta, ou notebook. Idealmente um quadro/folha grande pra ele desenhar.

**Comece dizendo:**

> "Cara, hoje quero que tu me explique como tua loja funciona, do começo ao fim, como se eu nunca tivesse pisado numa loja de carro na vida. Cada passo, tu me diz o que tu faz hoje e o que tu queria que o sistema fizesse pra te ajudar nesse passo. Pode ser detalhista. Quanto mais detalhe melhor."

---

## PARTE 1 — A entrada do veículo na loja

### Bloco 1.1 — Quando um carro chega

> "Vamos começar pelo começo. Um carro novo chega na tua loja. Me conta tudo que acontece, desde a hora que tu decide comprar até ele estar pronto pra ser anunciado."

Pontos pra ele cobrir (se ele esquecer, puxa):

1. Como tu encontra um carro pra comprar? (Repasse, leilão, troca, particular)
2. Como tu decide se compra ou não? Olha FIPE? Olha mercado?
3. Quando compra, o que tu anota desse carro? Onde anota hoje?
4. Que documento tu recebe? CRLV, laudo, nota?
5. Que despesas o carro tem antes de ir pra venda? (transferência, mecânica, polimento, detalhamento, fotografia, vistoria)
6. Quem cuida de cada uma dessas etapas?
7. Quanto tempo demora desde "comprou" até "tá pronto pra vender"?
8. Como tu sabe quando o carro tá pronto pra ir pra venda?

**Pra cada coisa, pergunta:** "E o sistema, o que tu queria que ele fizesse aqui?"

### Bloco 1.2 — Cadastro do carro no estoque

> "Imagina que o sistema já existe. Tu tá cadastrando esse carro novo. O que tu precisa preencher? O que precisa aparecer na tela?"

Deixa ele listar os campos. Depois pergunta sobre cada categoria:

9. **Identificação**: marca, modelo, versão, ano, cor, placa, chassi, RENAVAM. Que mais?
10. **Características**: KM, câmbio, combustível, número de portas, opcionais. Como tu lista os opcionais hoje?
11. **Fotos**: quantas fotos por carro? Quem tira? Onde armazena? Tem foto principal? Tem ordem específica?
12. **Documentos do carro**: CRLV, laudo cautelar, nota de entrada — onde guarda hoje?
13. **Valores**: o que tu paga, o que tu vai gastar, o quanto vai vender, qual o mínimo que aceita.
14. **Status**: o carro pode estar em quais estados? (em preparação, disponível, reservado, vendido, em manutenção, etc.)
15. **Observações**: tem algum tipo de "anotação livre" que tu costuma fazer pro carro?

**Pergunta-chave**: "Tem alguma informação do carro que **tu** olha mas que outros lojistas talvez não olhem? Algo do teu jeito de trabalhar?"

### Bloco 1.3 — FIPE e precificação

16. "Tu consulta FIPE pra precificar? Como?"
17. "O sistema deveria buscar FIPE automaticamente? Mostrar onde?"
18. "Quando o preço FIPE muda (mensalmente), tu queria ser avisado? Como?"
19. "Tu queria ver gráfico de variação de preço FIPE de um modelo ao longo do tempo?"
20. "Como tu chega no preço final de venda? É FIPE + margem? É mercado? É feeling?"

### Bloco 1.4 — O carro precisa virar anúncio

21. "Quando o carro tá pronto, em quais portais tu anuncia? Webmotors, OLX, iCarros, Mercado Livre, Instagram, site próprio?"
22. "Quem coloca o carro em cada portal? Quanto tempo leva pra anunciar 1 carro em todos?"
23. "Tu queria que o sistema mandasse pros portais automaticamente, ou prefere controlar manualmente?"
24. "Quando tu baixa o preço do carro no sistema, queria que mudasse automaticamente nos portais?"
25. "Quando o carro vende, queria que sumisse dos portais automaticamente?"
26. "Queria saber quantas pessoas viram cada anúncio em cada portal? E quantos leads veio de cada portal?"
27. "Queria que o sistema gerasse a descrição do anúncio sozinho, baseado nos dados do carro? Ou tu prefere escrever?"

---

## PARTE 2 — O lead chega e o atendimento começa

### Bloco 2.1 — De onde vêm os leads

> "Agora vamos pros clientes. Um cliente entra em contato com tua loja. De que jeitos isso pode acontecer? Me lista todos."

Espera ele listar (provavelmente: WhatsApp direto no número da loja, telefone, mensagem pelo Webmotors, mensagem pela OLX, formulário do site, walk-in/passou na rua, indicação, Instagram, Facebook).

Pra cada origem, pergunta:

28. "Quando entra um lead [por essa fonte], o que acontece hoje? Pra onde vai a informação?"
29. "Como o vendedor sabe que tem um lead novo dessa fonte?"
30. "Quanto tempo passa entre entrar o lead e alguém responder?"
31. "Como tu, dono, sabe que aquele lead foi atendido?"
32. "Esse lead fica registrado em algum lugar pra tu consultar depois?"
33. "Como tu queria que o sistema lidasse com isso?"

### Bloco 2.2 — O que o sistema precisa saber sobre o lead

> "Quando um lead entra, que informação tu queria capturar dele?"

Vai listando: nome, telefone, e-mail, CPF, carro de interesse, fonte, observações, urgência, se tem carro pra trocar, se quer financiar, valor que quer pagar de entrada, etc.

34. "Tu queria que o sistema desse uma 'pontuação' pra cada lead? Tipo lead quente, morno, frio?"
35. "Como tu definiria se um lead é quente?"
36. "Quando dois leads tem o mesmo telefone, é a mesma pessoa? Como tu queria que o sistema tratasse isso?"

### Bloco 2.3 — Quem atende

> "Quem atende os leads que chegam? Como decide qual vendedor pega qual lead?"

37. "Tu queria que o sistema distribuísse automaticamente entre vendedores? Como? Por ordem? Por especialidade? Por turno?"
38. "Tem leads que tu queria que ficassem só com tu, sem distribuir?"
39. "Vendedor pode pegar lead de outro vendedor? Em que situação?"
40. "Como funciona quando o vendedor que tava atendendo sai de férias ou de folga?"

### Bloco 2.4 — Atribuição e responsabilidade

41. "Se um lead entra hoje e ninguém responde em 30 minutos, o que tu queria que o sistema fizesse?"
42. "E se ninguém responde em 2 horas? E em 24 horas?"
43. "Tu queria ser avisado quando lead fica parado? Como? WhatsApp, e-mail, notificação no sistema?"

---

## PARTE 3 — A negociação e a venda

### Bloco 3.1 — O atendimento WhatsApp

> "Hoje a maior parte da conversa com cliente acontece no WhatsApp, certo? Me conta como funciona."

44. "Cada vendedor usa o WhatsApp dele ou tem um número da loja?"
45. "Tu queria que o sistema fosse o WhatsApp? Tipo, vendedor mandar mensagem pelo sistema e o cliente receber no WhatsApp normal?"
46. "Tu queria ver todas as conversas que teus vendedores tão tendo com clientes? Ou só as que tu pedir?"
47. "Tu queria poder responder direto do sistema, ou só ler?"
48. "Tu queria ter respostas prontas pra coisas que tu repete muito? Tipo /preco, /horario, /endereco?"
49. "Tu queria poder mandar foto do carro pelo sistema direto pro cliente? Múltiplas fotos de uma vez?"
50. "Tu queria mandar vídeo do carro? Áudio?"
51. "Quando o cliente manda mensagem fora do horário, o sistema deveria responder automaticamente alguma coisa?"
52. "Já mandou mensagem em massa pra muita gente de uma vez? (Tipo, chegou um carro novo, tu queria avisar todo mundo que demonstrou interesse). Como queria que o sistema fizesse isso?"

### Bloco 3.2 — Visita, test drive, reserva

53. "Quando o cliente quer ver o carro, o que acontece? Tu agenda? Como?"
54. "Tu queria ter uma agenda dentro do sistema mostrando todos os agendamentos da semana?"
55. "Quem da equipe vai aparecer na agenda? Só vendedores ou tu também?"
56. "E o test drive? Quando o cliente faz test drive, o que tu precisa registrar? CNH? KM saída/chegada? Hora?"
57. "Tu queria mandar lembrete automático de visita no dia anterior pelo WhatsApp pro cliente?"
58. "Quando alguém vem ver um carro mas não compra, o que tu queria que acontecesse no sistema? Marcar como 'visita feita'? Pra dar follow-up depois?"
59. "Cliente pode reservar carro? Quanto tempo dura uma reserva? Que regra tu queria pra isso?"

### Bloco 3.3 — Negociação e proposta

60. "Quando o cliente propõe um valor menor, como tu decide aceitar ou não?"
61. "Tu queria que o sistema soubesse o preço mínimo de cada carro pra te avisar quando o vendedor tá negociando abaixo?"
62. "Tu deixa vendedor dar desconto sozinho? Até quanto? Acima de quanto precisa te chamar?"
63. "Tu queria que o sistema gerasse uma proposta em PDF bonita pra mandar pro cliente?"
64. "O que precisa ter nessa proposta? Logo da loja, dados do carro, valor, condição, validade?"

### Bloco 3.4 — Carro como troca (trade-in)

65. "Cliente vem com carro pra dar como parte do pagamento. Como funciona hoje?"
66. "Quem avalia o carro do cliente? Onde anota a avaliação?"
67. "O carro do cliente entra no teu estoque depois? Como?"
68. "Tu queria ter uma 'ficha de avaliação' dentro do sistema pra avaliar o carro do cliente, com fotos, observações de mecânica, etc.?"

### Bloco 3.5 — Financiamento

69. "Quantos clientes querem financiar? Maioria? Metade?"
70. "Com quais bancos tu trabalha?"
71. "Como funciona o processo hoje? Quem digita os dados do cliente em cada banco?"
72. "Tu queria que o sistema simulasse em vários bancos de uma vez?"
73. "Tu queria que o sistema mandasse a proposta direto pro banco aprovar?"
74. "Como tu queria acompanhar o status da proposta? (Em análise, aprovada, rejeitada)"
75. "Quando a proposta é aprovada, o que acontece depois?"

### Bloco 3.6 — Fechamento da venda

76. "Quando o cliente decide comprar, o que tu precisa fazer? Lista pra mim, passo a passo."
77. "Que documento tu precisa juntar? CPF, RG, comprovante de residência, comprovante de renda?"
78. "Tu queria fazer upload desses documentos no sistema, vinculados ao cliente?"
79. "Como funciona o contrato de venda? Quem faz, em que sistema, em que modelo?"
80. "Tu queria que o sistema gerasse o contrato automaticamente preenchendo os dados do cliente e do carro?"
81. "Quando a venda fecha, o que muda? O carro vai pra status 'vendido'? Sai dos portais?"
82. "Cliente assina contrato em papel ou tu queria assinatura digital?"

### Bloco 3.7 — Nota fiscal

83. "Como funciona a nota fiscal hoje? Tu emite, tem contabilidade, usa que sistema?"
84. "Tu queria emitir a nota direto do CRM ou prefere que continue separado?"
85. "Que dados precisa pra emitir? Qual a regra fiscal pra venda de veículo aí na tua região?"

### Bloco 3.8 — Comissão do vendedor

86. "Como tu calcula a comissão do vendedor hoje? Percentual fixo? Escalonado? Por meta?"
87. "Tu queria que o sistema calculasse automaticamente quanto cada vendedor ganhou no mês?"
88. "Quando o vendedor recebe a comissão? Junto com o salário? Em data separada?"
89. "Tu queria registrar quando pagou a comissão?"

---

## PARTE 4 — Pós-venda, gestão e visão geral

### Bloco 4.1 — Pós-venda

90. "Depois que vendeu, tu tem algum contato com o cliente? Quanto tempo depois?"
91. "Tu queria que o sistema mandasse mensagem automática pro cliente 7 dias depois? 30 dias? No aniversário dele?"
92. "Tu manda alguma pesquisa de satisfação?"
93. "Cliente que comprou contigo pode comprar de novo. Como tu queria reativar esses clientes?"
94. "Quando o carro tá quase precisando de revisão (tipo 1 ano depois da venda), tu queria avisar o cliente?"

### Bloco 4.2 — Acompanhamento de leads frios

95. "E os leads que não compraram? O que tu faz com eles?"
96. "Tu queria que o sistema te avisasse 'esse lead tá há 30 dias sem contato, dá uma olhada nele'?"
97. "Tu queria mandar campanha automática pra leads frios? Tipo 'oi, ainda tá procurando carro?'?"
98. "Quando um lead entra perguntando de um carro que já vendeu, mas tu tem outro parecido, queria que o sistema sugerisse?"

### Bloco 4.3 — Gestão da equipe

> "Vamos falar de tu olhando teus vendedores."

99. "Hoje, o que tu olha pra saber se um vendedor tá indo bem ou mal?"
100. "Tu queria ver no sistema: quantos leads cada vendedor recebeu, quantos respondeu, quantos converteu em visita, quantos converteu em venda?"
101. "Tu queria ver tempo médio de resposta de cada vendedor?"
102. "Tu queria ver o ranking dos vendedores no mês?"
103. "Tu queria definir meta de venda pra cada vendedor e ver no sistema quanto falta pra bater?"
104. "Vendedor pode ver quanto outros vendedores tão vendendo? Ou só tu?"

### Bloco 4.4 — Gestão do estoque

105. "Tu queria saber quantos carros tu tem no estoque agora? Distribuídos por marca, ano, faixa de preço?"
106. "Tu queria ver quantos carros tão parados há mais de 30, 60, 90 dias? Pra decidir baixar preço ou agir neles?"
107. "Tu queria ver quanto cada carro tá te custando por mês de pátio (tipo custo de oportunidade)?"
108. "Quando tu vende, queria ver quanto lucrou de verdade naquele carro? (preço de venda - preço de compra - despesas - comissão)"
109. "Tu queria ver no fim do mês: vendi X carros, lucrei Y, ticket médio foi Z?"

### Bloco 4.5 — Visão geral / dashboard

> "Imagina que tu chega na loja segunda de manhã, abre o sistema. O que tu queria ver na primeira tela?"

Deixa ele descrever. Anota literal o que ele disser. Provavelmente vai falar coisas tipo:

110. Quantos leads novos entraram desde sexta?
111. Quantos leads sem resposta?
112. Quantos agendamentos pra hoje e pra essa semana?
113. Quantas vendas no mês até agora?
114. Quanto faturou no mês?
115. Quem tá vendendo mais?
116. Carros parados há muito tempo

E pergunta: **"Que mais tu queria ver?"** até ele esgotar.

### Bloco 4.6 — Relatórios

117. "Que relatório tu precisa fazer hoje pra tua contabilidade, pra ti, pra um sócio? Como faz hoje?"
118. "Que relatório tu queria ter no sistema que hoje tu tem que fazer na mão?"
119. "Tu queria exportar pra Excel? Pra PDF? Mandar por e-mail automático todo dia/semana/mês?"

---

## PARTE 5 — Coisas que costumam aparecer e ninguém pergunta

Essas são perguntas que normalmente passam batido mas que mudam muito o sistema:

### Bloco 5.1 — Múltiplas lojas, múltiplos pátios

120. "Tu tem só essa loja ou pensa em ter mais? Filiais?"
121. "Tem carro em pátio diferente da loja? Como controla qual carro tá onde?"

### Bloco 5.2 — Documentação e burocracia

122. "Tu lida com transferência de DETRAN. Como? Tu queria controle disso no sistema?"
123. "Carro fica 'em transferência' por dias/semanas. Tu queria status pra isso?"
124. "Quando vende, o cliente espera os documentos chegarem. Como tu acompanha isso?"
125. "Multas que chegam depois da venda — tu repassa pro comprador. Tu queria ajuda do sistema com isso?"

### Bloco 5.3 — Garantia e devolução

126. "Tu dá garantia nos carros que vende? Que tipo? Quanto tempo?"
127. "Já teve carro voltando? Como lida com isso?"
128. "Tu queria registrar garantia no sistema, avisar quando vence?"

### Bloco 5.4 — Compras e fornecedores

129. "Tu compra carros de quem? Particulares, leilões, repasses entre lojas?"
130. "Tu queria ter cadastro de 'fornecedores' (lojas parceiras de repasse) no sistema?"
131. "Já comprou carro com problema de documentação? Tu queria checagem de placa/chassi automática?"

### Bloco 5.5 — Marketing

132. "Tu faz tráfego pago? Anúncio no Google, Facebook, Instagram?"
133. "Como tu sabe se um anúncio tá dando resultado?"
134. "Tu queria que o sistema rastreasse de qual anúncio veio cada lead?"

### Bloco 5.6 — Coisas que ele esqueceu

A última pergunta é sempre a mais reveladora:

135. **"Tem alguma coisa do dia a dia da tua loja que o sistema poderia te ajudar e que eu não perguntei?"**

Espera. Silêncio. Insiste. Vai sair coisa importante aqui.

---

## Depois do encontro

Senta ainda no mesmo dia (memória fresca!) e organiza tudo que ele te disse em **uma lista única por módulo**, no formato:

```
MÓDULO ESTOQUE
- Cadastrar veículo com marca, modelo, versão, ano, cor, KM, placa, chassi, RENAVAM
- Buscar FIPE automaticamente ao cadastrar
- Registrar custo de aquisição, despesas, preço de venda, preço mínimo
- Calcular margem prevista automaticamente
- Upload de múltiplas fotos com ordenação e capa
- Status do veículo (disponível, reservado, vendido, em preparação, em manutenção)
- ... etc

MÓDULO LEADS
- Capturar lead de WhatsApp, telefone, formulário do site, portais
- Registrar nome, telefone, e-mail, CPF, carro de interesse, origem
- Distribuir automaticamente entre vendedores por round-robin
- Avisar dono se lead ficar mais de 30 min sem resposta
- ... etc

MÓDULO ATENDIMENTO
- ...
```

Faz isso pra cada módulo. Você vai sair com **a lista real de funcionalidades** validada pelo cara que vive isso todo dia.

## Comparando com o que eu já tinha planejado

Depois de organizar a lista dele, **compara** com os módulos que eu já tinha colocado no documento `01-especificacao-tecnica.md`. Tu vai ver 3 categorias:

1. **Coisas que coincidem** — eu já tinha planejado e ele confirmou. Vão pro MVP com confiança.
2. **Coisas que ele pediu mas eu não tinha** — adiciona pro escopo. São as features que só quem é do ramo lembraria.
3. **Coisas que eu tinha mas ele nem mencionou** — provavelmente não são prioridade. Vão pra fase posterior ou são cortadas.

Manda essa lista pra mim quando tiver pronto e a gente revisa os 4 documentos juntos pra refletir o que ele te ensinou. Aí sim a especificação fica **dele**, não minha. E o sistema vai ter cara de "feito por quem entende de loja de carro".

---

## Dica de conduta durante o encontro

- Não interrompa ele. Quando ele tiver falando, deixa terminar mesmo se demorar.
- Se ele disser algo que tu não entendeu (jargão de loja), pede pra explicar como se tu fosse leigo.
- Se ele te perguntar "tu vai conseguir fazer isso?", responde "anotei, vou ver como encaixa, te falo na semana que vem". Não promete na hora.
- Se ele divagar pra outro assunto, deixa um pouco — divagação às vezes é onde mora o ouro. Depois traz de volta com "voltando lá pra parte de X..."
- A cada 20-30 minutos, faz uma pausa de 5 minutos. É muita informação, ele cansa, tu cansa.
- No fim, agradece de coração: "Cara, isso aqui que tu me passou é o sistema. Sem ti eu ia chutar metade." Ele vai sentir o peso e se engajar mais.
