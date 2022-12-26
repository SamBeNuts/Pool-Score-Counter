// STRING CONSTANTS
const J1 = 'J1';
const J2 = 'J2';
const PENALTY = 'P';
const INACTIVE_CLASS = 'inactive';
const RESULTS_STORAGE_PREFIX = 'results_';
const ALL = 'ALL';
const SNOOKER = 'snooker';

// GENERAL CONSTANTS
let pointSound = null;
let penaltySound = null;
const playersDOM = document.querySelectorAll('.player.score_j');
let scoreJ1 = 0;
let scoreJ2 = 0;

// SNOOKER CONSTANTS
const breakScoreDOM = document.querySelector('.break_score');
let isJ1Active = true;
let breakScore = 0;
let history = [J1]

// HOMEPAGE METHOD

const randomGame = () => {
	switch (Math.floor(Math.random() * 3)) {
		case 0:
			window.location.href = '8ball/game.html'
			break;
		case 1:
			window.location.href = '9ball/game.html'
			break;
		case 2:
			window.location.href = 'snooker/game.html'
			break;
	}
}

// GENERAL METHODS

const loadPlayerNames = () => {
	document.querySelector('.' + J1).value = localStorage.getItem(J1) ?? J1;
	document.querySelector('.' + J2).value = localStorage.getItem(J2) ?? J2;
}

const savePlayerName = (value, isJ1 = true) => {
	localStorage.setItem(isJ1 ? J1 : J2, value);
}

const playSound = (isPenalty = false) => {
	if (!pointSound) {
		pointSound = new Audio('../resources/point.wav');
		penaltySound = new Audio('../resources/penalty.wav');
	}
	if (isPenalty) {
		penaltySound.currentTime = 0;
		penaltySound.play();
	} else {
		pointSound.currentTime = 0;
		pointSound.play();
	}
}

const updateUI = (isSnooker = true) => {
	playersDOM[0].innerHTML = scoreJ1;
	playersDOM[1].innerHTML = scoreJ2;
	if (isSnooker) {
		if (isJ1Active === playersDOM[0].classList.contains(INACTIVE_CLASS)) {
			playersDOM.forEach(player => player.classList.toggle(INACTIVE_CLASS));
		}
		breakScoreDOM.innerHTML = breakScore;
	}
}

const upScore = (points, isSnooker = true, isJ1 = true) => {
	playSound();
	if (isSnooker && isJ1Active || !isSnooker && isJ1) {
		scoreJ1 += points;
	} else {
		scoreJ2 += points;
	}
	if (isSnooker) {
		history.push(points);
		breakScore += points;
	} else {
		makeAllBallsVisible();
	}
	updateUI(isSnooker);
}

// SNOOKER METHODS

const addPenalty = () => {
	playSound(true);
	history.push(PENALTY);
	toggleActivePlayer();
	if (isJ1Active) {
		scoreJ1 += 4;
	} else {
		scoreJ2 += 4;
	}
	updateUI();
}

const toggleActivePlayer = () => {
	isJ1Active = !isJ1Active;
	history.push(isJ1Active ? J1 : J2)
	breakScore = 0;
	updateUI();
}

const revertLastAction = () => {
	if (history.length === 0) return updateUI();
	const lastAction = history.pop();
	switch (lastAction) {
		case J1:
		case J2:
			isJ1Active = !isJ1Active;
			return revertLastAction();
		case PENALTY:
			if (isJ1Active) {
				scoreJ2 -= 4;
			} else {
				scoreJ1 -= 4;
			}
			break;
		default:
			if (isJ1Active) {
				scoreJ1 -= lastAction;
			} else {
				scoreJ2 -= lastAction;
			}
	}
	breakScore = 0;
	for (let i = history.length - 1; i >= 0; i--) {
		if (history[i][0] === 'J') break;
		breakScore += history[i];
	}
	playSound();
	updateUI();
}

// 8 & 9 BALL METHODS

const toggleBallVisibility = (ball) => {
	ball.classList.toggle(INACTIVE_CLASS);
}

const makeAllBallsVisible = () => {
	document.querySelectorAll('.balls img').forEach(ball =>
		ball.classList.remove(INACTIVE_CLASS)
	);
}

// SAVE GAME METHODS

convertResultsFromV1ToV2 = (results, isSnooker) => {
	return results.map(res => ({
		date: res[0],
		j1: {
			id: 'Sa',
			score: res[1],
			bestBreak: isSnooker && res[3] === 'Sa' ? res[4] : undefined
		},
		j2: {
			id: 'Ri',
			score: res[2],
			bestBreak: isSnooker && res[3] === 'Ri' ? res[4] : undefined
		}
	}));
}

const addSnookerStats = (result, ids) => {
	const breaks = [];
	let breakCount = 0;
	let bestBreakJ1 = 0;
	let bestBreakJ2 = 0;
	let penaltyCountJ1 = 0;
	let penaltyCountJ2 = 0;
	for (let i = 0; i < history.length; i++) {
		if (history[i][0] === 'J') {
			if (i + 1 < history.length && history[i + 1][0] !== 'J') {
				breakCount = 0;
				breaks.push({
					id: ids[history[i][1] - '1'],
					break: []
				});
			}
		} else {
			breaks[breaks.length - 1].break.push(history[i]);
			if (history[i] === PENALTY) {
				if (breaks[breaks.length - 1].id === ids[0]) {
					penaltyCountJ1++;
				} else {
					penaltyCountJ2++;
				}
			} else {
				breakCount += history[i];
				if (breaks[breaks.length - 1].id === ids[0]) {
					bestBreakJ1 = Math.max(bestBreakJ1, breakCount);
				} else {
					bestBreakJ2 = Math.max(bestBreakJ2, breakCount);
				}
			}
		}
	}
	result.j1.bestBreak = bestBreakJ1;
	result.j2.bestBreak = bestBreakJ2;
	result.j1.penaltyCount = penaltyCountJ1;
	result.j2.penaltyCount = penaltyCountJ2;
	result.breaks = breaks;
}

const saveResult = (game) => {
	const isSnooker = game === SNOOKER;
	const ids = [...document.querySelectorAll('.score input')].map(input => input.value);
	let results = JSON.parse(localStorage.getItem(RESULTS_STORAGE_PREFIX + game) ?? '[]');
	if (results.length > 0 && Array.isArray(results[0])) {
		results = convertResultsFromV1ToV2(results, isSnooker);
	}
	const result = {
		date: new Date(),
		j1: {
			id: ids[0],
			score: scoreJ1
		},
		j2: {
			id: ids[1],
			score: scoreJ2
		}
	};
	if (isSnooker) {
		addSnookerStats(result, ids);
	}
	results.push(result);
	localStorage.setItem(RESULTS_STORAGE_PREFIX + game, JSON.stringify(results));
	window.location.href = `../scores/index.html?game=${game}&period=ALL&player=${ids[0]}&opponent=${ids[1]}`;
}
