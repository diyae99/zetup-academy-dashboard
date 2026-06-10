export const demoAccounts = [
  { id: 'admin-1', name: 'Nadia El Mansouri', email: 'admin@zetup.test', password: 'password123', role: 'admin' },
  { id: 'int-1', name: 'Youssef Benali', email: 'intervenant@zetup.test', password: 'password123', role: 'intervenant' },
  { id: 'ben-1', name: 'Sara Amrani', email: 'beneficiaire@zetup.test', password: 'password123', role: 'beneficiaire' },
];

export const languages = ['Français', 'Anglais'];
export const levels = ['A1', 'A2', 'B1', 'B2'];
export const resourceTypes = ['PDF', 'PPTX', 'Word', 'Video link', 'Audio'];

export const intervenants = [
  { id: 'int-1', name: 'Youssef Benali', email: 'intervenant@zetup.test', phone: '+212 600 110 201', languages: ['Français', 'Anglais'], levels: ['A1', 'A2'], status: 'actif' },
  { id: 'int-2', name: 'Claire Martin', email: 'claire.martin@zetup.test', phone: '+212 600 110 202', languages: ['Français'], levels: ['B1', 'B2'], status: 'actif' },
  { id: 'int-3', name: 'Omar Haddad', email: 'omar.haddad@zetup.test', phone: '+212 600 110 203', languages: ['Anglais'], levels: ['A1', 'B1'], status: 'actif' },
];

export const beneficiaries = [
  { id: 'ben-1', name: 'Sara Amrani', email: 'beneficiaire@zetup.test', phone: '+212 611 010 101', groupIds: ['grp-1', 'grp-3'], status: 'actif' },
  { id: 'ben-2', name: 'Mehdi Karimi', email: 'mehdi.karimi@zetup.test', phone: '+212 611 010 102', groupIds: ['grp-1'], status: 'actif' },
  { id: 'ben-3', name: 'Imane Saidi', email: 'imane.saidi@zetup.test', phone: '+212 611 010 103', groupIds: ['grp-1'], status: 'actif' },
  { id: 'ben-4', name: 'Anas Tazi', email: 'anas.tazi@zetup.test', phone: '+212 611 010 104', groupIds: ['grp-2'], status: 'actif' },
  { id: 'ben-5', name: 'Leila Berrada', email: 'leila.berrada@zetup.test', phone: '+212 611 010 105', groupIds: ['grp-2'], status: 'actif' },
  { id: 'ben-6', name: 'Rania Alaoui', email: 'rania.alaoui@zetup.test', phone: '+212 611 010 106', groupIds: ['grp-3'], status: 'actif' },
  { id: 'ben-7', name: 'Nabil Idrissi', email: 'nabil.idrissi@zetup.test', phone: '+212 611 010 107', groupIds: ['grp-3'], status: 'actif' },
  { id: 'ben-8', name: 'Salma El Fassi', email: 'salma.fassi@zetup.test', phone: '+212 611 010 108', groupIds: ['grp-4'], status: 'actif' },
  { id: 'ben-9', name: 'Walid Rami', email: 'walid.rami@zetup.test', phone: '+212 611 010 109', groupIds: ['grp-4'], status: 'actif' },
  { id: 'ben-10', name: 'Hajar Bennani', email: 'hajar.bennani@zetup.test', phone: '+212 611 010 110', groupIds: ['grp-5'], status: 'actif' },
  { id: 'ben-11', name: 'Sofiane Ait Lahcen', email: 'sofiane.lahcen@zetup.test', phone: '+212 611 010 111', groupIds: ['grp-5'], status: 'actif' },
  { id: 'ben-12', name: 'Mouna Chraibi', email: 'mouna.chraibi@zetup.test', phone: '+212 611 010 112', groupIds: ['grp-6'], status: 'actif' },
  { id: 'ben-13', name: 'Karim Zahraoui', email: 'karim.zahraoui@zetup.test', phone: '+212 611 010 113', groupIds: ['grp-6'], status: 'actif' },
  { id: 'ben-14', name: 'Nora Kabbaj', email: 'nora.kabbaj@zetup.test', phone: '+212 611 010 114', groupIds: ['grp-2', 'grp-6'], status: 'actif' },
  { id: 'ben-15', name: 'Adil Mansouri', email: 'adil.mansouri@zetup.test', phone: '+212 611 010 115', groupIds: ['grp-4'], status: 'archivé' },
];

export const groups = [
  { id: 'grp-1', name: 'Français A1 - Groupe 1', language: 'Français', level: 'A1', intervenantId: 'int-1', beneficiaryIds: ['ben-1', 'ben-2', 'ben-3'], averageScore: 78, status: 'actif' },
  { id: 'grp-2', name: 'Français A2 - Groupe 2', language: 'Français', level: 'A2', intervenantId: 'int-1', beneficiaryIds: ['ben-4', 'ben-5', 'ben-14'], averageScore: 66, status: 'actif' },
  { id: 'grp-3', name: 'Anglais A1 - Groupe 1', language: 'Anglais', level: 'A1', intervenantId: 'int-3', beneficiaryIds: ['ben-1', 'ben-6', 'ben-7'], averageScore: 71, status: 'actif' },
  { id: 'grp-4', name: 'Anglais B1 - Groupe 1', language: 'Anglais', level: 'B1', intervenantId: 'int-3', beneficiaryIds: ['ben-8', 'ben-9', 'ben-15'], averageScore: 83, status: 'actif' },
  { id: 'grp-5', name: 'Français B1 - Groupe Intensif', language: 'Français', level: 'B1', intervenantId: 'int-2', beneficiaryIds: ['ben-10', 'ben-11'], averageScore: 74, status: 'actif' },
  { id: 'grp-6', name: 'Français B2 - Communication', language: 'Français', level: 'B2', intervenantId: 'int-2', beneficiaryIds: ['ben-12', 'ben-13', 'ben-14'], averageScore: 69, status: 'archivé' },
];

export const quizzes = [
  {
    id: 'quiz-1',
    title: 'Salutations et présentations',
    language: 'Français',
    level: 'A1',
    groupId: 'grp-1',
    createdBy: 'int-1',
    createdAt: '2026-05-18',
    status: 'publié',
    questions: [
      { id: 'q1', type: 'QCM', text: 'Quelle phrase est correcte pour se présenter ?', options: ['Je suis Sara', 'Je a Sara', 'Je être Sara', 'Moi Sara être'], correctAnswer: 'Je suis Sara' },
      { id: 'q2', type: 'Vrai/Faux', text: '"Bonjour" est une salutation.', correctAnswer: 'Vrai' },
      { id: 'q3', type: 'QCM', text: 'Comment demander le nom ?', options: ['Comment tu t’appelles ?', 'Où tu vas ?', 'Quel âge la table ?', 'Merci beaucoup'], correctAnswer: 'Comment tu t’appelles ?' },
    ],
  },
  { id: 'quiz-2', title: 'Verbes du quotidien', language: 'Français', level: 'A2', groupId: 'grp-2', createdBy: 'int-1', createdAt: '2026-05-22', status: 'publié', questions: [
    { id: 'q1', type: 'QCM', text: 'Choisissez le verbe correct: je ___ au centre.', options: ['vais', 'va', 'allez', 'allons'], correctAnswer: 'vais' },
    { id: 'q2', type: 'Vrai/Faux', text: '"Nous faisons" est correctement conjugué.', correctAnswer: 'Vrai' },
  ] },
  { id: 'quiz-3', title: 'Listening starter', language: 'Anglais', level: 'A1', groupId: 'grp-3', createdBy: 'int-3', createdAt: '2026-05-25', status: 'publié', questions: [
    { id: 'q1', type: 'QCM', text: 'What is the correct greeting?', options: ['Good morning', 'Blue table', 'Fast book', 'Open chair'], correctAnswer: 'Good morning' },
    { id: 'q2', type: 'Vrai/Faux', text: '"Thank you" expresses gratitude.', correctAnswer: 'Vrai' },
  ] },
  { id: 'quiz-4', title: 'Business English basics', language: 'Anglais', level: 'B1', groupId: 'grp-4', createdBy: 'int-3', createdAt: '2026-05-27', status: 'publié', questions: [
    { id: 'q1', type: 'QCM', text: 'Choose the formal opening.', options: ['Dear Ms. Smith,', 'Yo Smith', 'Hey there!!!', 'Smith hi'], correctAnswer: 'Dear Ms. Smith,' },
    { id: 'q2', type: 'Vrai/Faux', text: '"Could you please..." is polite.', correctAnswer: 'Vrai' },
  ] },
  { id: 'quiz-5', title: 'Compréhension écrite B1', language: 'Français', level: 'B1', groupId: 'grp-5', createdBy: 'int-2', createdAt: '2026-05-29', status: 'publié', questions: [
    { id: 'q1', type: 'QCM', text: 'Un synonyme de "rapide" est...', options: ['vite', 'lent', 'ancien', 'loin'], correctAnswer: 'vite' },
    { id: 'q2', type: 'Vrai/Faux', text: 'Un texte argumentatif défend une idée.', correctAnswer: 'Vrai' },
  ] },
  { id: 'quiz-6', title: 'Expression orale B2', language: 'Français', level: 'B2', groupId: 'grp-6', createdBy: 'int-2', createdAt: '2026-06-01', status: 'brouillon', questions: [
    { id: 'q1', type: 'QCM', text: 'Quel connecteur introduit une opposition ?', options: ['cependant', 'donc', 'ainsi', 'puis'], correctAnswer: 'cependant' },
  ] },
  { id: 'quiz-7', title: 'Pronoms personnels', language: 'Français', level: 'A1', groupId: 'grp-1', createdBy: 'int-1', createdAt: '2026-06-03', status: 'publié', questions: [
    { id: 'q1', type: 'QCM', text: 'Complétez: ___ parle français.', options: ['Je', 'Nous', 'Vous', 'Ils'], correctAnswer: 'Je' },
    { id: 'q2', type: 'Vrai/Faux', text: '"Ils" est pluriel.', correctAnswer: 'Vrai' },
  ] },
  { id: 'quiz-8', title: 'English tenses checkpoint', language: 'Anglais', level: 'B1', groupId: 'grp-4', createdBy: 'int-3', createdAt: '2026-06-05', status: 'brouillon', questions: [
    { id: 'q1', type: 'QCM', text: 'Choose the present perfect.', options: ['I have worked', 'I work yesterday', 'I am work', 'I has work'], correctAnswer: 'I have worked' },
  ] },
];

export const resources = [
  { id: 'res-1', title: 'Fiche salutations A1', type: 'PDF', language: 'Français', level: 'A1', groupId: 'grp-1', intervenantId: 'int-1', url: 'fiche-salutations-a1.pdf', description: 'Support de vocabulaire pour les premières interactions.', createdAt: '2026-05-15' },
  { id: 'res-2', title: 'Mini présentation verbes', type: 'PPTX', language: 'Français', level: 'A2', groupId: 'grp-2', intervenantId: 'int-1', url: 'verbes-quotidiens.pptx', description: 'Diaporama de révision avec exemples contextualisés.', createdAt: '2026-05-17' },
  { id: 'res-3', title: 'Audio dialogues courts', type: 'Audio', language: 'Français', level: 'A1', groupId: 'grp-1', intervenantId: 'int-1', url: 'dialogues-a1.mp3', description: 'Pistes audio pour travailler la compréhension.', createdAt: '2026-05-20' },
  { id: 'res-4', title: 'Starter video greetings', type: 'Video link', language: 'Anglais', level: 'A1', groupId: 'grp-3', intervenantId: 'int-3', url: 'https://video.example/english-greetings', description: 'Courte vidéo de mise en situation.', createdAt: '2026-05-21' },
  { id: 'res-5', title: 'Business email template', type: 'Word', language: 'Anglais', level: 'B1', groupId: 'grp-4', intervenantId: 'int-3', url: 'business-email-template.docx', description: 'Modèle commenté pour emails professionnels.', createdAt: '2026-05-24' },
  { id: 'res-6', title: 'Connecteurs logiques B1', type: 'PDF', language: 'Français', level: 'B1', groupId: 'grp-5', intervenantId: 'int-2', url: 'connecteurs-b1.pdf', description: 'Tableau de connecteurs avec exemples.', createdAt: '2026-05-26' },
  { id: 'res-7', title: 'Débat guidé B2', type: 'Word', language: 'Français', level: 'B2', groupId: 'grp-6', intervenantId: 'int-2', url: 'debat-guide-b2.docx', description: 'Trame pour expression orale structurée.', createdAt: '2026-05-28' },
  { id: 'res-8', title: 'Pronunciation practice', type: 'Audio', language: 'Anglais', level: 'B1', groupId: 'grp-4', intervenantId: 'int-3', url: 'pronunciation-b1.mp3', description: 'Exercices audio ciblés.', createdAt: '2026-06-01' },
  { id: 'res-9', title: 'Images et descriptions', type: 'PPTX', language: 'Français', level: 'A1', groupId: 'grp-1', intervenantId: 'int-1', url: 'images-descriptions.pptx', description: 'Support visuel pour décrire des scènes simples.', createdAt: '2026-06-02' },
  { id: 'res-10', title: 'Reading pack B1', type: 'PDF', language: 'Anglais', level: 'B1', groupId: 'grp-4', intervenantId: 'int-3', url: 'reading-pack-b1.pdf', description: 'Textes courts avec questions de compréhension.', createdAt: '2026-06-04' },
];

export const quizResults = [
  { id: 'r1', beneficiaryId: 'ben-1', groupId: 'grp-1', quizId: 'quiz-1', score: 92, correct: 3, total: 3, date: '2026-05-19' },
  { id: 'r2', beneficiaryId: 'ben-2', groupId: 'grp-1', quizId: 'quiz-1', score: 67, correct: 2, total: 3, date: '2026-05-19' },
  { id: 'r3', beneficiaryId: 'ben-3', groupId: 'grp-1', quizId: 'quiz-1', score: 74, correct: 2, total: 3, date: '2026-05-19' },
  { id: 'r4', beneficiaryId: 'ben-4', groupId: 'grp-2', quizId: 'quiz-2', score: 50, correct: 1, total: 2, date: '2026-05-23' },
  { id: 'r5', beneficiaryId: 'ben-5', groupId: 'grp-2', quizId: 'quiz-2', score: 100, correct: 2, total: 2, date: '2026-05-23' },
  { id: 'r6', beneficiaryId: 'ben-14', groupId: 'grp-2', quizId: 'quiz-2', score: 50, correct: 1, total: 2, date: '2026-05-24' },
  { id: 'r7', beneficiaryId: 'ben-7', groupId: 'grp-3', quizId: 'quiz-3', score: 100, correct: 2, total: 2, date: '2026-05-26' },
  { id: 'r8', beneficiaryId: 'ben-6', groupId: 'grp-3', quizId: 'quiz-3', score: 50, correct: 1, total: 2, date: '2026-05-26' },
  { id: 'r9', beneficiaryId: 'ben-7', groupId: 'grp-3', quizId: 'quiz-3', score: 50, correct: 1, total: 2, date: '2026-05-27' },
  { id: 'r10', beneficiaryId: 'ben-8', groupId: 'grp-4', quizId: 'quiz-4', score: 100, correct: 2, total: 2, date: '2026-05-28' },
  { id: 'r11', beneficiaryId: 'ben-9', groupId: 'grp-4', quizId: 'quiz-4', score: 100, correct: 2, total: 2, date: '2026-05-28' },
  { id: 'r12', beneficiaryId: 'ben-15', groupId: 'grp-4', quizId: 'quiz-4', score: 50, correct: 1, total: 2, date: '2026-05-29' },
  { id: 'r13', beneficiaryId: 'ben-10', groupId: 'grp-5', quizId: 'quiz-5', score: 100, correct: 2, total: 2, date: '2026-05-30' },
  { id: 'r14', beneficiaryId: 'ben-11', groupId: 'grp-5', quizId: 'quiz-5', score: 50, correct: 1, total: 2, date: '2026-05-30' },
  { id: 'r15', beneficiaryId: 'ben-1', groupId: 'grp-1', quizId: 'quiz-7', score: 100, correct: 2, total: 2, date: '2026-06-04' },
  { id: 'r16', beneficiaryId: 'ben-2', groupId: 'grp-1', quizId: 'quiz-7', score: 50, correct: 1, total: 2, date: '2026-06-04' },
  { id: 'r17', beneficiaryId: 'ben-3', groupId: 'grp-1', quizId: 'quiz-7', score: 100, correct: 2, total: 2, date: '2026-06-05' },
  { id: 'r18', beneficiaryId: 'ben-8', groupId: 'grp-4', quizId: 'quiz-8', score: 80, correct: 1, total: 1, date: '2026-06-06' },
  { id: 'r19', beneficiaryId: 'ben-9', groupId: 'grp-4', quizId: 'quiz-8', score: 60, correct: 1, total: 1, date: '2026-06-06' },
  { id: 'r20', beneficiaryId: 'ben-12', groupId: 'grp-6', quizId: 'quiz-6', score: 70, correct: 1, total: 1, date: '2026-06-06' },
];

export const initialData = { intervenants, beneficiaries, groups, quizzes, resources, quizResults };
