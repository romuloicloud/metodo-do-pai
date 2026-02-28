
import { User, Question, TopicProgress, Achievement, RankEntry, TheoryLesson } from '../types';

export const mockUser: User = {
  id: 'user-lucas',
  name: 'Lucas Almeida',
  avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDdlNr4IM462fL8Wi28MaIHDbQFPAiauIhSNHV8mc1x75nCHGnN3zPecPWywtbFQtv3xbFUg8IRFtyjkc_qO_YA83-F0rS13UZc3P9ME_DRXKMiraooJ4Z-FsvE5mdi8rjlsmP3_Ck2Z4FlxINUg8V99yzdoKJModUseYHmTNuTJiLSaP1lq48BtqIptj-n0ZNArsxqGV8GzFOQS-sr8HBS63DcwwtPskoQyJRJ9A0eL39FZNSmSFG7JnD5JaKG03WTfZu7b_qRmhs',
  level: 12,
  xp: 2450,
  rank: 14,
  targetSchool: 'Pedro II',
};

export const mockQuestions: Question[] = [
  {
    id: 'q1',
    subject: 'Matemática',
    topic: 'Soma de Frações',
    text: 'Quanto é 1/4 + 2/4?',
    options: ['3/8', '3/4', '2/8', '2/4'],
    correctOptionIndex: 1,
  },
  {
    id: 'q2',
    subject: 'Matemática',
    topic: 'Frações Equivalentes',
    text: 'Um feirante comprou 24 dúzias de laranjas. Ao chegar em casa, percebeu que 1/8 delas estavam estragadas. Quantas laranjas restaram para a venda?',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAo0gwDsYP091ixi_ep_LAScXBolAKPq84zH72zKk2GIqwsjeIExU1Hqz0o81RV5y-9OBJp4RPRrsZrkNbUGqAbUx0oerorBaBP85eXemRfYF4YitROWksfkiKSTSpSPtKcca0mDq2CplWzfkMHEMTHMaFWDIX5lTOvDiOSQMHRGuB0o3sbkKiJ8Is6w9I5iUkczT75geyQQldrT-p0_0YxAiGJ4OcOAnDeuXpjFMweIx2OR1rCbwpRthHC7c8Q_-w7KGahrYPCspw',
    options: ['288 laranjas', '36 laranjas', '252 laranjas', '216 laranjas'],
    correctOptionIndex: 2,
  },
  {
    id: 'q3',
    subject: 'Português',
    topic: 'Interpretação de Texto',
    text: 'Qual a ideia central do texto "A Raposa e as Uvas"?',
    options: ['A importância da persistência', 'A desvalorização do que não se pode alcançar', 'A amizade entre animais', 'Os perigos da floresta'],
    correctOptionIndex: 1,
  },
];

export const mockLesson: TheoryLesson = {
  topic: 'Álgebra (Tópico de Reforço)',
  explanation: "Opa! A conexão com a IA demorou um pouco. Sem problemas, o Pai tem sempre um plano B! Vamos revisar um conceito chave de Álgebra: encontrar o valor desconhecido (o famoso 'x'). Pense em uma balança: o que tem de um lado do sinal de igual (=) deve ser o mesmo que tem do outro. Se você tira algo de um lado, tem que tirar o mesmo do outro para a balança ficar equilibrada. É simples assim!",
  exercises: [
    {
      question: "Se x + 5 = 12, qual o valor de x?",
      options: ["5", "17", "7", "12"],
      correctOptionIndex: 2
    },
    {
      question: "Em 3 * y = 15, qual o valor de y?",
      options: ["5", "12", "18", "45"],
      correctOptionIndex: 0,
      explanation: "O mesmo princípio! Se 3 vezes y dá 15, então y é 15 dividido por 3. Tabuada do 3: 3 x 5 = 15. Logo, y = 5."
    },
    {
      question: "Uma caixa com 20 lápis é dividida igualmente entre 4 amigos. A equação que representa isso é 4 * L = 20. Quantos lápis (L) cada um recebe?",
      options: ["4 lápis", "20 lápis", "16 lápis", "5 lápis"],
      correctOptionIndex: 3,
      explanation: "Para achar x, a gente faz a operação inversa. Se 4 vezes L é 20, então L é 20 dividido por 4. E 20 ÷ 4 = 5. Cada amigo recebe 5 lápis."
    }
  ]
};

export const mockLessonPortugues: TheoryLesson = {
  topic: 'Substantivos (Tópico de Reforço)',
  explanation: "A conexão com a IA parece lenta. Não se preocupe, o Pai tem a matéria na ponta da língua! Vamos de Substantivos: são as palavras que dão nome a TUDO: pessoas, lugares, objetos, sentimentos... Se você pode ver, pegar ou sentir, provavelmente é um substantivo. 'Casa', 'Lucas', 'alegria', 'caneta', tudo isso são nomes, ou seja, substantivos!",
  exercises: [
    {
      question: "Qual das palavras abaixo é um substantivo que nomeia um sentimento?",
      options: ["Correr", "Bonito", "Felicidade", "Sempre"],
      correctOptionIndex: 2
    },
    {
      question: "Na frase 'O CACHORRO de Lucas é brincalhão', a palavra em maiúsculo é um substantivo:",
      options: ["Próprio", "Comum", "Coletivo", "Abstrato"],
      correctOptionIndex: 1,
      explanation: "'CACHORRO' serve para qualquer cachorro do mundo, não é um nome específico (como Rex ou Totó). Por isso é um substantivo COMUM."
    },
    {
      question: "Qual das alternativas contém apenas substantivos?",
      options: ["Mesa, cadeira, amor", "Rápido, forte, devagar", "Eu, tu, ele", "Comer, beber, dormir"],
      correctOptionIndex: 0,
      explanation: "Mesa (objeto), cadeira (objeto), amor (sentimento). Tudo isso são nomes! Nas outras opções temos adjetivos (Rápido), pronomes (Eu) e verbos (Comer)."
    }
  ]
};


export const mockAchievements: Achievement[] = [
  { id: 'ach1', name: '5 Dias de Fogo', icon: 'local_fire_department', achieved: true },
  { id: 'ach2', name: 'Mestre da Matemática', icon: 'functions', achieved: true },
  { id: 'ach3', name: 'Pensador Veloz', icon: 'bolt', achieved: false },
];

export const mockRanking: RankEntry[] = [
  { rank: 1, name: 'João Victor', xp: 2890, avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBFS5PanJvZIsQ22X8mgO5lXfH_C9vUlczxXKAIFiR6-8yPc11HTItLCs28_u7v-Pm3I913LSbJ4f-txyNS6nKTJKTWa-I0g5mFSBmjaFzyf6gKfYTG-4W0Pp0wu0tVPrDz7zDRysN4A36NR0SsewjzGNOnSMdHbKnnqi7AwmJlxzWp4KaYpeUfrUfDTGWTVGycSf_3RsdjuiXINXvQAxDom3dFi4PRDOWFcWiO6KI9HU1o42YM8DztL6cC6i38rjsjEQO8SHeuqLc' },
  { rank: 2, name: 'Maria S.', xp: 2450, avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB6iQQK9smUTRKiQlATjlKxNlSPgv7Kwzd12IKwQ-rnuefMS8otIMvbEJdsnIkDIBZ3MeJmlQEFcunhSRnz7Zi7E7Wac6m-Wd6OzcZHzfeC7udAZttavMmzSM-zZfmMxjdpnUKrI4lb0KEDBEoXgC52rf3-ulh117qfL-sYqN-4HlSwH6Zcunr4sNc5z4dBMcJzECIICabZg7aew6X5yT1D-_EwFzDz3pTDZShwinid12qL2cOllikZzV--SGovFkjlnpQDk2cbHfk' },
  { rank: 3, name: 'Ana Luiza', xp: 2120, avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAWKTzegeIrgF6744Ek_DPuEFXUg7vlFFdlimXOvieqFTzjXNBF-90VHTtMnW8IeeCKV_H8TcxyiThIFiEzdy0tG4tOJ7WUlddVAuw54UHL0p0HjVWWzp90c6a9o0Rw9dBJyEA5m5OZhwE4qosdXAJH9QdozSNs5X4B2REK8JAgdRcrXJjdJaN3XTx5tYEQwiDfYQoM2uGgAMUyyrGFEEEWlTBVvtWwtIUZUnOLlc9N5Zx7nLk8j4cN2AwZzVWo9TJpN10eACdY4V8' },
  { rank: 4, name: 'Beatriz Costa', xp: 1980, trend: 'up', avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAYf3a1FGLZRRKVWHHkWT2TanCiP8SU8DEhu8ZS4puDeShJPrVk270FUpsZmW5AfwloB8ILmkXTyAwCj3GloSTmn1thaMPl6uzcMPWBW4AU-eKUZwkO1eCDG_kLfqDiuo-apTolGl9shgm8_jLNfK5hLSWekLh7I1nAFJwtLUnz1SDc6vGrhTM2Li80CgL6McsC8QsolfgUe0m4JxM9iZ1XQ9kUMDhLTblpKvwewqS0lEour2T-frsgprzZwFpaFp6V9t7yK9FIBm8' },
  { rank: 5, name: 'Gabriel Lima', xp: 1850, trend: 'same', avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDbN2c8t0Ami_KbCfTO7EQqnEFWUxrcEoV7THI6gTw2l1oFNKEiikrKVVIipFQdPfOc8p3Pu3ysnRzzh5pn00q9aSJS5ObQ0TKq8d7Y-B9rkd7kMHGuOfFsfhEKA6ppVW6NIYi1tLMexwYawMIPG_pwA-Gr1G76f6OOKpFcgZRryXyAvyYhdhWwXbaIPRX38bhQlI18eOQd_S_WCgl3j3RtSbmDaqrGYLmFDkPVLPmrmaL665bOKFNtzQM9YNCWDnDlhuCISJtkNDY' },
];