// ----- Configuração básica do baralho de Truco (versão simplificada) -----

const RANKS = ["4", "5", "6", "7", "Q", "J", "K", "A", "2", "3"]; // 4 fraca, 3 forte
const SUITS = ["♣", "♦", "♥", "♠"]; // paus, ouros, copas, espadas

// Quanto maior o índice, mais forte a carta
const rankStrength = RANKS.reduce((map, rank, index) => {
  map[rank] = index;
  return map;
}, {});

// ----- Estado do jogo -----

let deck = [];
let playerHand = [];
let cpuHand = [];

let playerScore = 0;
let cpuScore = 0;

let trickNumber = 1; // 1 a 3
let trickWins = { player: 0, cpu: 0 };
let tableCards = { player: null, cpu: null };

let currentTurn = null; // "player" ou "cpu"
let isTrickInProgress = false;
let gameOver = false;

// Elementos de UI
const playerScoreEl = document.getElementById("player-score");
const cpuScoreEl = document.getElementById("cpu-score");
const statusTextEl = document.getElementById("status-text");
const playerHandEl = document.getElementById("player-hand");
const cpuHandEl = document.getElementById("cpu-hand");
const playerCardSlotEl = document.getElementById("player-card-slot");
const cpuCardSlotEl = document.getElementById("cpu-card-slot");
const newGameBtn = document.getElementById("new-game-btn");

// ----- Funções utilitárias -----

function createDeck() {
  const d = [];
  for (const rank of RANKS) {
    for (const suit of SUITS) {
      d.push({
        rank,
        suit,
        id: `${rank}${suit}`
      });
    }
  }
  return d;
}

function shuffle(array) {
  // Fisher-Yates
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function compareCards(cardA, cardB) {
  // 1 se A vence, -1 se B vence, 0 se empate
  const strengthA = rankStrength[cardA.rank];
  const strengthB = rankStrength[cardB.rank];
  if (strengthA > strengthB) return 1;
  if (strengthB > strengthA) return -1;
  return 0;
}

// ----- Renderização -----

function renderScores() {
  playerScoreEl.textContent = playerScore;
  cpuScoreEl.textContent = cpuScore;
}

function createCardElement(card, clickable, onClick, extraClasses = "") {
  const div = document.createElement("div");
  div.className = `card ${extraClasses}`;
  if (clickable) {
    div.classList.add("player-card");
    div.addEventListener("click", onClick);
  } else {
    div.classList.add("disabled");
  }

  const rankSpan = document.createElement("span");
  rankSpan.className = "rank";
  rankSpan.textContent = card.rank;

  const suitSpan = document.createElement("span");
  suitSpan.className = "suit";
  suitSpan.textContent = card.suit;

  const cornerSpan = document.createElement("span");
  cornerSpan.className = "corner";
  cornerSpan.textContent = `${card.rank}${card.suit}`;

  div.appendChild(rankSpan);
  div.appendChild(suitSpan);
  div.appendChild(cornerSpan);

  return div;
}

function createBackCardElement() {
  const div = document.createElement("div");
  div.className = "card cpu-card-back";
  div.textContent = "CARTA";
  return div;
}

function renderHands() {
  // Mão do jogador
  playerHandEl.innerHTML = "";
  playerHand.forEach((card, index) => {
    const canPlay =
      !gameOver && currentTurn === "player" && !isTrickInProgress && card;
    const cardEl = createCardElement(
      card,
      canPlay,
      () => handlePlayerPlay(index),
      ""
    );
    playerHandEl.appendChild(cardEl);
  });

  // Mão do bot (apenas verso das cartas)
  cpuHandEl.innerHTML = "";
  cpuHand.forEach(() => {
    const cardBackEl = createBackCardElement();
    cpuHandEl.appendChild(cardBackEl);
  });
}

function renderTable() {
  playerCardSlotEl.innerHTML = "";
  cpuCardSlotEl.innerHTML = "";

  if (tableCards.player) {
    const cardEl = createCardElement(tableCards.player, false, null, "table-card");
    cardEl.classList.remove("disabled");
    cardEl.classList.add("table-card");
    playerCardSlotEl.appendChild(cardEl);
  } else {
    playerCardSlotEl.textContent = "Vazio";
  }

  if (tableCards.cpu) {
    const cardEl = createCardElement(tableCards.cpu, false, null, "table-card");
    cardEl.classList.remove("disabled");
    cardEl.classList.add("table-card");
    cpuCardSlotEl.appendChild(cardEl);
  } else {
    cpuCardSlotEl.textContent = "Vazio";
  }
}

// ----- Fluxo do jogo -----

function resetTable() {
  tableCards.player = null;
  tableCards.cpu = null;
  renderTable();
}

function startNewMatch() {
  playerScore = 0;
  cpuScore = 0;
  gameOver = false;
  renderScores();
  statusTextEl.textContent = "Nova partida! Primeiro a chegar em 12 pontos vence.";
  startNewHand();
}

function startNewHand() {
  if (playerScore >= 12 || cpuScore >= 12) {
    gameOver = true;
    const winner =
      playerScore > cpuScore ? "Você venceu a partida!" : "O bot venceu a partida!";
    statusTextEl.textContent = winner + " Clique em 'Novo Jogo' para recomeçar.";
    return;
  }

  deck = shuffle(createDeck());
  playerHand = deck.splice(0, 3);
  cpuHand = deck.splice(0, 3);

  trickNumber = 1;
  trickWins = { player: 0, cpu: 0 };
  resetTable();

  // Decide quem começa esta mão (aleatório)
  currentTurn = Math.random() < 0.5 ? "player" : "cpu";
  isTrickInProgress = false;

  renderHands();
  renderTable();
  updateTurnStatus();

  if (currentTurn === "cpu") {
    setTimeout(cpuPlay, 800);
  }
}

function updateTurnStatus() {
  if (gameOver) return;

  const base = `Mão atual: rodada ${trickNumber}/3. Placar de rodadas: Você ${trickWins.player} x ${trickWins.cpu} Bot.`;
  if (currentTurn === "player") {
    statusTextEl.textContent = base + " Sua vez de jogar.";
  } else {
    statusTextEl.textContent = base + " Vez do bot.";
  }
}

function handlePlayerPlay(cardIndex) {
  if (gameOver) return;
  if (currentTurn !== "player") return;
  if (isTrickInProgress) return;

  const card = playerHand[cardIndex];
  if (!card) return;

  isTrickInProgress = true;

  // Remove carta da mão do jogador
  playerHand.splice(cardIndex, 1);
  tableCards.player = card;
  renderHands();
  renderTable();

  // Bot joga logo em seguida
  setTimeout(() => {
    cpuPlay();
  }, 600);
}

function cpuPlay() {
  if (gameOver) return;

  let cpuJogouAgora = false;

  // Se bot ainda tem cartas
  if (cpuHand.length > 0 && !tableCards.cpu) {
    const randomIndex = Math.floor(Math.random() * cpuHand.length);
    const card = cpuHand[randomIndex];
    cpuHand.splice(randomIndex, 1);
    tableCards.cpu = card;
    cpuJogouAgora = true;
    renderHands();
    renderTable();
  }

  // Se as duas cartas estão na mesa, resolve a rodada
  if (tableCards.player && tableCards.cpu) {
    setTimeout(resolveTrick, 800);
  } else {
    // Caso típico: bot começou a rodada, jogou a carta,
    // agora a vez passa para o jogador
    if (!tableCards.player && currentTurn === "cpu" && cpuJogouAgora) {
      currentTurn = "player";
      isTrickInProgress = false;
      updateTurnStatus();
      renderHands(); // <<< IMPORTANTE: re-renderiza mão com os cliques habilitados
    }
  }
}

function resolveTrick() {
  const result = compareCards(tableCards.player, tableCards.cpu);
  let winnerThisTrick = null;

  if (result === 1) {
    trickWins.player += 1;
    winnerThisTrick = "player";
    statusTextEl.textContent = `Você ganhou a rodada ${trickNumber}!`;
  } else if (result === -1) {
    trickWins.cpu += 1;
    winnerThisTrick = "cpu";
    statusTextEl.textContent = `O bot ganhou a rodada ${trickNumber}!`;
  } else {
    statusTextEl.textContent = `Rodada ${trickNumber} empatada!`;
  }

  renderScores();
  isTrickInProgress = false;

  // Verifica se alguém já garantiu a mão (melhor de 3)
  if (trickWins.player === 2 || trickWins.cpu === 2 || trickNumber === 3) {
    setTimeout(() => endHand(), 1000);
  } else {
    // Próxima rodada
    trickNumber += 1;
    // Quem ganhou a rodada começa a próxima; se empatou, alterna
    if (winnerThisTrick) {
      currentTurn = winnerThisTrick;
    } else {
      currentTurn = currentTurn === "player" ? "cpu" : "player";
    }
    resetTable();
    renderHands();
    updateTurnStatus();

    if (currentTurn === "cpu") {
      setTimeout(cpuPlay, 800);
    }
  }
}

function endHand() {
  // Decide quem ganhou a mão
  if (trickWins.player > trickWins.cpu) {
    playerScore += 1;
    statusTextEl.textContent =
      `Você ganhou a mão! (Rodadas: Você ${trickWins.player} x ${trickWins.cpu} Bot). +1 ponto.`;
  } else if (trickWins.cpu > trickWins.player) {
    cpuScore += 1;
    statusTextEl.textContent =
      `O bot ganhou a mão! (Rodadas: Você ${trickWins.player} x ${trickWins.cpu} Bot). +1 ponto.`;
  } else {
    statusTextEl.textContent =
      `Mão empatada (Rodadas: Você ${trickWins.player} x ${trickWins.cpu} Bot). Ninguém pontua.`;
  }

  renderScores();
  resetTable();
  renderHands();

  if (playerScore >= 12 || cpuScore >= 12) {
    gameOver = true;
    const winner =
      playerScore > cpuScore ? "Você venceu a partida!" : "O bot venceu a partida!";
    statusTextEl.textContent = winner + " Clique em 'Novo Jogo' para recomeçar.";
  } else {
    // Começa nova mão depois de um pequeno intervalo
    setTimeout(startNewHand, 1500);
  }
}

// ----- Eventos -----

newGameBtn.addEventListener("click", () => {
  startNewMatch();
});

// Estado inicial
renderScores();
renderHands();
renderTable();
statusTextEl.textContent = "Clique em 'Novo Jogo' para começar.";
