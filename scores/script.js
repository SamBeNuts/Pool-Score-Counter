// STRING CONSTANTS
const RESULTS_STORAGE_PREFIX = 'results_';
const ALL = 'ALL';
const SNOOKER = 'snooker';
const ONE_DAY = 1000 * 60 * 60 * 24;
const ONE_WEEK = ONE_DAY * 7;
const ONE_MONTH = ONE_DAY * 30;
const ONE_YEAR = ONE_DAY * 365;

selectDOM = document.querySelectorAll('select');
recordsDOM = document.querySelector('.table_records');
resultsDOM = document.querySelector('.table_results');
detailsDOM = document.querySelector('.table_details');
popupDOM = document.querySelector('.popup_details');

let game;
let period = ALL;
let player = ALL;
let opponent = ALL;
let scores;
let filteredScores;

// SCORES METHODS

const getStats = (id) => {
	let stats = {
		victoryCount: 0,
		longestVictoryStreak: 0,
		bestScore: 0,
		bestBreak: 0,
		averageBestBreak: 0,
		averageBreak: 0,
		averagePenaltyCount: 0
	};
	let victoryStreak = 0;
	let missingBestBreak = 0;
	let missingPenaltyCount = 0;
	for (let score of filteredScores) {
		const [player, opponent] = score.j1.id === id ? [score.j1, score.j2] : [score.j2, score.j1];
		if (player.score > opponent.score) {
			stats.victoryCount++;
			victoryStreak++;
			stats.longestVictoryStreak = Math.max(stats.longestVictoryStreak, victoryStreak);
		} else {
			victoryStreak = 0;
		}
		if (game === SNOOKER) {
			if (player.bestBreak !== undefined) {
				stats.bestScore = Math.max(stats.bestScore, player.score);
				stats.bestBreak = Math.max(stats.bestBreak, player.bestBreak);
				stats.averageBestBreak += player.bestBreak;
			} else {
				missingBestBreak++;
			}
			if (player.penaltyCount !== undefined) {
				stats.averageBreak += (player.score - 4 * opponent.penaltyCount) / score.breaks.filter(b => b.id === id).length;
				stats.averagePenaltyCount += player.penaltyCount;
			} else {
				missingPenaltyCount++;
			}
		}
	}
	stats.victoryPercent = Math.round(stats.victoryCount / filteredScores.length * 100);
	if (game === SNOOKER) {
		stats.averageBestBreak = Math.round(stats.averageBestBreak / (filteredScores.length - missingBestBreak) * 10) / 10;
		stats.averageBreak = Math.round(stats.averageBreak / (filteredScores.length - missingPenaltyCount) * 10) / 10;
		stats.averagePenaltyCount = Math.round(stats.averagePenaltyCount / (filteredScores.length - missingPenaltyCount) * 10) / 10;
	}
	return stats;
}

const populateRecords = () => {
	if (player === ALL) return;
	if (opponent !== ALL) {
		recordsDOM.innerHTML += `
			<tr>
				<th style="border-top: none; border-left: none;"></th>
				<th>${player}</th>
				<th>${opponent}</th>
			</tr>
		`;
	}
	const playerStats = getStats(player);
	const opponentStats = opponent !== ALL ? getStats(opponent) : undefined;
	recordsDOM.innerHTML += `
		<tr>
			<th>Number of victories</th>
			<td>${playerStats.victoryCount} (${playerStats.victoryPercent}%)</td>
			${opponent !== ALL ? `<td>${opponentStats.victoryCount} (${opponentStats.victoryPercent}%)</td>` : ''}
		</tr>
	`;
	recordsDOM.innerHTML += `
		<tr>
			<th>Longuest victory streak</th>
			<td>${playerStats.longestVictoryStreak}</td>
			${opponent !== ALL ? `<td>${opponentStats.longestVictoryStreak}</td>` : ''}
		</tr>
	`;
	if (game === SNOOKER) {
		recordsDOM.innerHTML += `
			<tr>
				<th>Best score</th>
				<td>${playerStats.bestScore}</td>
				${opponent !== ALL ? `<td>${opponentStats.bestScore}</td>` : ''}
			</tr>
		`;
		recordsDOM.innerHTML += `
			<tr>
				<th>Best break</th>
				<td>${playerStats.bestBreak}</td>
				${opponent !== ALL ? `<td>${opponentStats.bestBreak}</td>` : ''}
			</tr>
		`;
		recordsDOM.innerHTML += `
			<tr>
				<th>Average best break</th>
				<td>${playerStats.averageBestBreak}</td>
				${opponent !== ALL ? `<td>${opponentStats.averageBestBreak}</td>` : ''}
			</tr>
		`;
		recordsDOM.innerHTML += `
			<tr>
				<th>Average break</th>
				<td>${playerStats.averageBreak}</td>
				${opponent !== ALL ? `<td>${opponentStats.averageBreak}</td>` : ''}
			</tr>
		`;
		recordsDOM.innerHTML += `
			<tr>
				<th>Average number of penalties</th>
				<td>${playerStats.averagePenaltyCount}</td>
				${opponent !== ALL ? `<td>${opponentStats.averagePenaltyCount}</td>` : ''}
			</tr>
		`;
	}
}

const populateResults = () => {
	resultsDOM.innerHTML += `
		<tr>
			<th>Date</th>
			<th>${player === ALL ? 'J1' : player}'s score</th>
			<th>${opponent === ALL ? 'J2' : opponent}'s score</th>
			${game === SNOOKER ? '<th>Best break</th>' : ''}
		</tr>
	`;
	filteredScores.forEach(score => {
		const date = new Date(score.date);
		const leftCell = score.j1.id === player ? score.j1 : score.j2;
		const rightCell = score.j1.id === player ? score.j2 : score.j1;
		resultsDOM.innerHTML += `
			<tr>
				<td>${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}</td>
				<td${leftCell.score <= rightCell.score ? ' class="looser"' : ''}>${leftCell.score} ${player === ALL ? `(${leftCell.id})` : ''}</td>
				<td${leftCell.score >= rightCell.score ? ' class="looser"' : ''}>${rightCell.score} ${opponent === ALL ? `(${rightCell.id})` : ''}</td>
				${game === SNOOKER ? `<td>${Math.max(leftCell.bestBreak ?? 0, rightCell.bestBreak ?? 0)} (${(leftCell.bestBreak ?? 0) > (rightCell.bestBreak ?? 0) ? leftCell.id : rightCell.id})</td>` : ''}
				${game === SNOOKER && score.breaks ? `<td><img onclick="populateDetails('${JSON.stringify(score.breaks).replace(/"/g,'\\\'')}')" class="info" src="../resources/info.png" /></td>` : ''}
			</tr>
		`;
	});
}

const populateDetails = (breaks) => {
	togglePopup();
	detailsDOM.innerHTML = "";
	breaks = JSON.parse(breaks.replace(/'/g,'"'));
	breaks.forEach(breakDetails => {
		detailsDOM.innerHTML += `
			<tr>
				<td>${breakDetails.id}</td>
				<td>${breakDetails.break.map(ballId => `<img class="details_balls" src="../resources/${getBallName(ballId)}.png" />`).join("")}</td>
			</tr>
		`;
	});
}

const togglePopup = () => {
	popupDOM.style.display = popupDOM.style.display === "block" ? "none" : "block";
}

const getBallName = (ballId) => {
	console.log(ballId)
	switch (ballId) {
		case 1:
			return 'red';
		case 2:
			return 'yellow';
		case 3:
			return 'green';
		case 4:
			return 'brown';
		case 5:
			return 'blue';
		case 6:
			return 'pink';
		case 7:
			return 'black';
		case 'P':
			return 'penalty';
	}
}

const convertPeriodToNumber = () => {
	switch (period) {
		case 'WEEK':
			return ONE_WEEK;
		case 'MONTH':
			return ONE_MONTH;
		case 'YEAR':
			return ONE_YEAR;
	}
}

const filterScores = () => {
	filteredScores = scores;
	const today = new Date();
	if (period !== ALL) {
		filteredScores = filteredScores.filter(score => today - new Date(score.date) < convertPeriodToNumber());
	}
	if (player !== ALL) {
		filteredScores = filteredScores.filter(score => score.j1.id === player || score.j2.id === player);
	}
	if (opponent !== ALL) {
		filteredScores = filteredScores.filter(score => score.j1.id === opponent || score.j2.id === opponent);
	}
}

const updateUI = () => {
	filterScores();
	selectDOM[0].value = game;
	selectDOM[1].value = period;
	selectDOM[2].value = player;
	selectDOM[3].value = opponent;
	selectDOM[3].disabled = player === ALL;
	recordsDOM.innerHTML = '';
	resultsDOM.innerHTML = '';
	if (localStorage.getItem('favorite') === JSON.stringify({ game, period, player, opponent })) {
		document.querySelector('.favorite').src = '../resources/full_star.png';
	} else {
		document.querySelector('.favorite').src = '../resources/outlined_star.png';
	}
	if (filteredScores.length > 0) {
		populateRecords();
		populateResults();
	}
}

const setQueryParam = (key, value, needUpdate = true) => {
	switch(key) {
		case 'game':
			game = value;
			player = ALL;
			opponent = ALL;
			scores = JSON.parse(localStorage.getItem(RESULTS_STORAGE_PREFIX + game) ?? '[]').reverse();
			initDropdowns();
			break;
		case 'period':
			period = value;
			break;
		case 'player':
			player = value;
			opponent = ALL;
			break;
		case 'opponent':
			if (value !== player) {
				opponent = value;
			}
			break;
	}
	if (needUpdate) {
		updateUI();
	}
}

const initDropdowns = () => {
	const players = new Set();
	selectDOM[2].innerHTML = '<option value="ALL">ALL</option>';
	selectDOM[3].innerHTML = '<option value="ALL">ALL</option>';
	scores.forEach(score => {
		[score.j1.id, score.j2.id].forEach(id => {
			if (!players.has(id)) {
				players.add(id);
				selectDOM[2].innerHTML += `<option value="${id}">${id}</option>`;
				selectDOM[3].innerHTML += `<option value="${id}">${id}</option>`;
			}
		});
	});
}

const loadScores = () => {
	const params = window.location.search;
	if (params === '') {
		const favorite = JSON.parse(localStorage.getItem('favorite'));
		if (favorite !== null) {
			window.location.search = `?game=${favorite.game}&period=${favorite.period}&player=${favorite.player}&opponent=${favorite.opponent}`;
		}
	}
	for (const param of window.location.search.slice(1).split('&')) {
		[key, value] = param.split('=');
		setQueryParam(key, value, false);
	}
	if (game === undefined) {
		setQueryParam('game', SNOOKER, false);
	}
	if (player === ALL) {
		opponent = ALL;
	}
	updateUI();
}

const setFavorite = () => {
	localStorage.setItem('favorite', JSON.stringify({
		game,
		period,
		player,
		opponent
	}));
	document.querySelector('.favorite').src = '../resources/full_star.png';
}
