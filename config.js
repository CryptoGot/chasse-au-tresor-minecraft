/* ================================================================
   CONFIG DE LA CHASSE AU TRÉSOR
   C'est ici qu'on change les énigmes, les questions et les RÉPONSES.

   • reponses : liste des réponses acceptées. Majuscules, accents,
     espaces et articles (un, le, la…) sont ignorés ; une petite faute
     de frappe passe (mots de 5 lettres ou plus). "07" = "7" = "7 bancs".
   • reponses: []  →  n'importe quelle réponse est acceptée.
   • champs : plusieurs questions à la fois (il faut avoir bon partout).
     ordreLibre: true → les réponses peuvent être dans n'importe quel ordre.
   • Après une mauvaise réponse : 30 secondes d'attente (ATTENTE_MS).
   • Astuce Maître du Jeu : taper 5 fois vite sur « Quête X/5 »
     permet de passer une étape si quelque chose bloque sur place.
   ================================================================ */
window.HUNT = {
  joueur: 'Arthur',
  equipe: 'Arthur et sa team',
  maitre: 'Maître du Jeu',
  ATTENTE_MS: 30000, // attente après une mauvaise réponse (anti-triche)

  // Case de la carte du jardin où est caché le trésor (colonne x, ligne y)
  // → ici : au milieu du massif de roses blanches
  tresor: { x: 17, y: 15 },

  quetes: [
    {
      titre: 'La source infinie',
      objet: 'bucket', objetNom: "Seau d'eau",
      progres: 'Source infinie',
      visuel: 'eau',
      enigme: [
        `Dans Minecraft, tout le monde connaît l'astuce : <b>2 seaux d'eau</b> versés dans un trou de 2×2… et hop, une <b>source d'eau infinie</b> ! On peut y puiser autant qu'on veut, elle ne se vide jamais.`,
        `Dans notre village aussi, il y a de l'eau qui coule <b>sans jamais s'arrêter</b>. Mais celle-là, aucun joueur ne l'a fabriquée avec des seaux : elle a été construite en pierre par les villageois, il y a très longtemps.`,
        `<b>Trouvez la source infinie du village !</b>`
      ],
      indices: [
        `Avant les robinets, les villageois venaient y remplir leurs seaux…`,
        `C'est la <b>fontaine</b> du village !`
      ],
      question: `Deux questions : il faut avoir bon aux <b>deux</b> !`,
      champs: [
        { label: `Quelle tête d'animal est représentée à cet endroit ?`, reponses: ['lion', 'lions', 'tête de lion'] },
        { label: `Combien y a-t-il de bancs ?`, reponses: ['2', 'deux'], clavier: 'numeric' }
      ]
    },
    {
      titre: "L'ancienne base",
      objet: 'door', objetNom: 'Porte en chêne',
      progres: 'Base abandonnée',
      enigme: [
        `Dans Minecraft, quand on trouve un meilleur endroit, on construit une nouvelle base… mais l'ancienne reste toujours là, avec ses vieux coffres et ses souvenirs.`,
        `Moi aussi, avant d'habiter ici, j'avais une autre base. Arthur, tu la connais bien : tu y es déjà venu !`,
        `Attention : ce n'est pas <b>ta</b> maison, Arthur… c'est <b>mon ancienne maison</b> à moi !`,
        `<b>Rendez-vous devant mon ancienne base.</b>`
      ],
      indices: [
        `Pense à l'endroit où j'habitais avant d'emménager ici…`
      ],
      question: `Deux questions : il faut avoir bon aux <b>deux</b> !`,
      champs: [
        { label: `Quel est le numéro de la maison ?`, reponses: ['3', 'trois'], clavier: 'numeric' },
        { label: `Quel nom de famille est écrit sur la boîte aux lettres ?`, reponses: ['Grosjean', 'Monsieur Grosjean', 'M Grosjean', 'Mr Grosjean', 'Famille Grosjean'] }
      ]
    },
    {
      titre: 'Le bloc qui cuit tout',
      objet: 'furnace', objetNom: 'Four',
      progres: 'Ça chauffe !',
      visuel: 'craft',
      enigme: [
        `Regardez bien cette recette de fabrication…`,
        `Avec <b>8 blocs de pierre taillée</b> posés en carré, on me fabrique. Mets du charbon en bas et du poulet cru en haut : je te rends un poulet bien cuit. Je transforme aussi le minerai de fer en lingots et le sable en verre.`,
        `<b>Qui suis-je ?</b>`,
        `Mon cousin de la vraie vie se cache <b>chez nous</b>, dans la pièce où on prépare à manger. <b>Allez le voir !</b>`
      ],
      indices: [
        `Dans Minecraft, on m'appelle « fourneau »… Dans la vraie vie, on dit juste…`,
        `Le <b>four</b> de la cuisine, chez Arthur !`
      ],
      question: `Quelle est la marque écrite sur le four ?`,
      reponses: ['Electrolux'],
      clavier: 'text'
    },
    {
      titre: "Le géant d'acier",
      objet: 'tnt', objetNom: 'TNT',
      progres: 'Blindé !',
      enigme: [
        `Je suis plus lourd qu'un golem de fer, et ma carapace est en métal, comme une gigantesque armure en fer.`,
        `Je n'ai pas de roues : j'avance sur des <b>chenilles</b>… (non, pas celles qui deviennent des papillons !)`,
        `Mon <b>canon</b> faisait plus de bruit qu'un bloc de TNT, mais je ne tire plus depuis très longtemps. Aujourd'hui, je monte la garde sans bouger.`,
        `<b>Qui suis-je ? Allez me trouver à Manleve !</b>`
      ],
      indices: [
        `J'ai fait la guerre, il y a très très longtemps…`,
        `Je suis le <b>tank</b> de Manleve !`
      ],
      question: `Quelles sont les <b>3 couleurs</b> du logo de cet endroit ? (dans n'importe quel ordre)`,
      ordreLibre: true, // les 3 couleurs peuvent être données dans n'importe quel ordre
      champs: [
        { label: 'Couleur 1', reponses: ['noir', 'noire'] },
        { label: 'Couleur 2', reponses: ['jaune'] },
        { label: 'Couleur 3', reponses: ['rouge'] }
      ]
    },
    {
      titre: 'Retour au spawn',
      objet: 'bed', objetNom: 'Lit',
      progres: 'Retour au spawn',
      type: 'bouton',
      bouton: 'On est au spawn !',
      enigme: [
        `Dans Minecraft, quand ta mission est terminée (ou quand un creeper t'a fait exploser), tu réapparais toujours au même endroit : ton <b>point de spawn</b>, là où tu as dormi dans ton lit.`,
        `Vous avez exploré tout le village, bravo ! Mais le trésor, lui, n'est pas dans le village…`,
        `<b>Retournez au point de spawn !</b>`
      ],
      indices: [
        `Le spawn d'Arthur, c'est là où il dort tous les soirs…`,
        `Rentrez à la <b>maison</b>, et allez dans le jardin !`
      ],
      question: `Vous êtes arrivés ? Allez dans le jardin, puis appuyez sur le bouton.`
    }
  ]
};
