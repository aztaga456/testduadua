const alphabetUpper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const alphabetLower = 'abcdefghijklmnopqrstuvwxyz'.split('');

function speakText(text) {
    if (!text || typeof SpeechSynthesisUtterance === 'undefined') { return; }
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'id-ID';
    utterance.rate = 0.9;
    speechSynthesis.speak(utterance);
}

function showApp(appId) {
    document.querySelectorAll('.container').forEach(c => c.classList.replace('visible', 'hidden'));
    document.getElementById(appId).classList.replace('hidden', 'visible');
    if (appId === 'writingApp') { resizeCanvas(); }
    if (appId === 'matchingApp') { initMatchingGame(); }
    if (appId === 'homeScreen') {
        resetSpelling();
        currentGuideLetter = ''; clearCanvas();
        const activeBtn = document.querySelector('.writing-letter-btn.active');
        if (activeBtn) { activeBtn.classList.remove('active'); }
    }
}

// --- Spelling App Logic ---
const alphabetGrid = document.getElementById('alphabetGrid');
const spellingDisplay = document.getElementById('spellingDisplay');
let currentSpelling = '';
let isSpellingUppercase = true;

function setSpellingCase(isUpper) {
    isSpellingUppercase = isUpper;
    document.getElementById('upperCaseBtn').classList.toggle('active', isUpper);
    document.getElementById('lowerCaseBtn').classList.toggle('active', !isUpper);
    createSpellingLetterCards();
    resetSpelling();
}

function createSpellingLetterCards() {
    alphabetGrid.innerHTML = '';
    const currentAlphabet = isSpellingUppercase ? alphabetUpper : alphabetLower;
    currentAlphabet.forEach(letter => {
        const letterCard = document.createElement('div');
        letterCard.className = 'letter-card';
        letterCard.textContent = letter;
        letterCard.onclick = () => handleLetterClick(letter);
        alphabetGrid.appendChild(letterCard);
    });
}

function handleLetterClick(letter) {
    speakText(letter);
    currentSpelling += letter;
    spellingDisplay.textContent = currentSpelling;
}

function speakSpelledWord() { if (currentSpelling) speakText(currentSpelling); }
function resetSpelling() { currentSpelling = ''; spellingDisplay.textContent = ''; }

// --- Writing App Logic ---
const canvas = document.getElementById('writingCanvas');
const ctx = canvas.getContext('2d');
const writingAlphabetGrid = document.getElementById('writingAlphabetGrid');
let isDrawing = false, lastX = 0, lastY = 0, currentGuideLetter = '';

function resizeCanvas() {
    const container = canvas.parentElement;
    canvas.width = container.clientWidth;
    canvas.height = container.clientWidth * 9 / 16;
    drawLetterGuide(currentGuideLetter);
}

function startDrawing(e) { isDrawing = true; [lastX, lastY] = getMousePos(canvas, e); }

function draw(e) {
    if (!isDrawing) return;
    e.preventDefault();
    const [x, y] = getMousePos(canvas, e);
    ctx.beginPath(); ctx.moveTo(lastX, lastY); ctx.lineTo(x, y);
    ctx.strokeStyle = '#1e3a8a'; ctx.lineWidth = 12; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.stroke();
    [lastX, lastY] = [x, y];
}

function stopDrawing() { isDrawing = false; }

function getMousePos(canvas, evt) {
    const rect = canvas.getBoundingClientRect();
    if (evt.touches && evt.touches.length > 0) return [evt.touches[0].clientX - rect.left, evt.touches[0].clientY - rect.top];
    return [evt.clientX - rect.left, evt.clientY - rect.top];
}

function drawLetterGuide(letter) {
    currentGuideLetter = letter;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!letter) return;
    ctx.font = `bold ${canvas.height * 0.8}px 'Baloo 2', cursive`;
    ctx.fillStyle = 'rgba(147, 197, 253, 0.3)';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(letter, canvas.width / 2, canvas.height / 2 + (canvas.height * 0.05));
}

function clearCanvas() { drawLetterGuide(currentGuideLetter); }

function createWritingLetterButtons() {
    alphabetUpper.forEach(letter => {
        const letterBtn = document.createElement('button');
        letterBtn.className = 'writing-letter-btn';
        letterBtn.textContent = letter;
        letterBtn.onclick = () => {
            speakText(letter);
            drawLetterGuide(letter);
            document.querySelectorAll('.writing-letter-btn.active').forEach(b => b.classList.remove('active'));
            letterBtn.classList.add('active');
        };
        writingAlphabetGrid.appendChild(letterBtn);
    });
}

// --- Matching Game Logic ---
const upperCaseCol = document.getElementById('upperCaseCol');
const lowerCaseCol = document.getElementById('lowerCaseCol');
const matchWinMessage = document.getElementById('matchWinMessage');
const matchGameContainer = document.getElementById('matchGameContainer');
let selectedUpperCard = null, matchedPairs = 0, totalPairs = 0;

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function initMatchingGame() {
    matchGameContainer.classList.replace('hidden', 'visible');
    matchWinMessage.classList.replace('visible', 'hidden');
    upperCaseCol.innerHTML = ''; lowerCaseCol.innerHTML = '';
    selectedUpperCard = null; matchedPairs = 0;
    const gameLetters = shuffle([...alphabetUpper]).slice(0, 6);
    totalPairs = gameLetters.length;
    const shuffledUpper = [...gameLetters];
    const shuffledLower = shuffle([...gameLetters]).map(l => l.toLowerCase());
    shuffledUpper.forEach(letter => createMatchCard(letter, upperCaseCol, true));
    shuffledLower.forEach(letter => createMatchCard(letter, lowerCaseCol, false));
}

function createMatchCard(letter, column, isUpper) {
    const card = document.createElement('div');
    card.className = isUpper ? 'match-card upper' : 'match-card lower';
    card.textContent = letter;
    card.dataset.letter = letter.toLowerCase();
    card.onclick = handleMatchCardClick;
    column.appendChild(card);
}

function handleMatchCardClick(event) {
    const clickedCard = event.currentTarget;
    if (clickedCard.classList.contains('matched') || clickedCard.classList.contains('selected')) return;

    if (clickedCard.classList.contains('upper')) {
        if (selectedUpperCard) selectedUpperCard.classList.remove('selected');
        selectedUpperCard = clickedCard;
        clickedCard.classList.add('selected');
        speakText(clickedCard.textContent);
    } else if (clickedCard.classList.contains('lower') && selectedUpperCard) {
        const upperLetter = selectedUpperCard.dataset.letter;
        const lowerLetter = clickedCard.dataset.letter;

        if (upperLetter === lowerLetter) {
            speakText("Benar");
            selectedUpperCard.classList.add('correct');
            clickedCard.classList.add('correct');
            setTimeout(() => {
                selectedUpperCard.classList.replace('correct','matched');
                clickedCard.classList.replace('correct','matched');
                selectedUpperCard.onclick = null; clickedCard.onclick = null;
                selectedUpperCard = null; matchedPairs++;
                if (matchedPairs === totalPairs) {
                   setTimeout(() => {
                        matchGameContainer.classList.replace('visible', 'hidden');
                        matchWinMessage.classList.replace('hidden', 'visible');
                   }, 500);
                }
            }, 500);
        } else {
            speakText("Salah");
            selectedUpperCard.classList.add('incorrect');
            clickedCard.classList.add('incorrect');
            setTimeout(() => {
                selectedUpperCard.classList.remove('incorrect', 'selected');
                clickedCard.classList.remove('incorrect');
                selectedUpperCard = null;
            }, 800);
        }
    }
}

// --- Initial Setup ---
window.onload = () => {
    setSpellingCase(true);
    createWritingLetterButtons();
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseleave', stopDrawing);
    canvas.addEventListener('touchstart', startDrawing, { passive: false });
    canvas.addEventListener('touchmove', draw, { passive: false });
    canvas.addEventListener('touchend', stopDrawing);
    window.addEventListener('resize', resizeCanvas);
};