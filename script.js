// ===== Settings =====
// Open Trivia Database web addresses (free, HTTPS, no API key needed).
const QUESTIONS_URL = "https://opentdb.com/api.php";
const CATEGORIES_URL = "https://opentdb.com/api_category.php";

// The API allows about one request every 5 seconds. If we're too fast,
// we wait this long and try once more.
const RATE_LIMIT_WAIT_MS = 5000;

const FEEDBACK_DELAY_MS = 500; // pause after answering, in milliseconds
const QUESTION_TIME_MS = 7000; // time allowed per question, in milliseconds
const TICK_MS = 100;           // how often the timer display updates
const LOW_TIME_SECONDS = 3;    // timer turns red at or below this

// Scoring rules: 100 + 10 × (seconds left, rounded up + current streak)
const BASE_POINTS = 100;
const BONUS_POINTS = 10;

// ===== Page elements =====
const setupScreenEl = document.getElementById("setup-screen");
const amountChoicesEl = document.getElementById("amount-choices");
const difficultyChoicesEl = document.getElementById("difficulty-choices");
const categorySelect = document.getElementById("category");
const startButton = document.getElementById("start-button");
const setupMessageEl = document.getElementById("setup-message");
const gameScreenEl = document.getElementById("game-screen");
const endScreenEl = document.getElementById("end-screen");
const scoreEl = document.getElementById("score");
const streakEl = document.getElementById("streak");
const finalScoreEl = document.getElementById("final-score");
const finalCorrectEl = document.getElementById("final-correct");
const playAgainButton = document.getElementById("play-again");
const progressEl = document.getElementById("progress");
const timerEl = document.getElementById("timer");
const questionEl = document.getElementById("question");
const answersEl = document.getElementById("answers");
const messageEl = document.getElementById("message");

// ===== Player's choices (defaults match the "selected" buttons in index.html) =====
const settings = {
  amount: "10",
  difficulty: "easy",
  category: "", // "" means Any Category
};

// ===== Game state =====
let questions = [];   // list of { question, correct, answers }
let currentIndex = 0; // which question we're on
let score = 0;        // total points this game
let streak = 0;       // correct answers in a row
let correctCount = 0; // how many questions answered correctly

// ===== Timer state =====
let timerId = null;   // the id from setInterval, so we can stop it
let deadline = 0;     // the exact time (in ms) when this question runs out
let answered = false; // true once the player answers OR time runs out

// ===== Setup screen: choice buttons =====
// Makes a group of buttons act like "pick one": clicking a button highlights
// it, un-highlights the others, and saves its value into settings[settingName].
function setUpChoiceGroup(groupEl, settingName) {
  const buttons = groupEl.querySelectorAll("button");

  buttons.forEach(function (button) {
    button.addEventListener("click", function () {
      buttons.forEach(function (other) {
        other.classList.remove("selected");
        other.setAttribute("aria-pressed", "false");
      });
      button.classList.add("selected");
      button.setAttribute("aria-pressed", "true");

      settings[settingName] = button.dataset.value; // from data-value="..."
    });
  });
}

// ===== Setup screen: category dropdown =====
async function loadCategories() {
  try {
    const response = await fetch(CATEGORIES_URL);
    if (!response.ok) {
      throw new Error("Category request failed: " + response.status);
    }
    const data = await response.json();

    data.trivia_categories.forEach(function (category) {
      const option = document.createElement("option");
      option.value = category.id;
      option.textContent = category.name; // textContent: shown as plain text
      categorySelect.appendChild(option);
    });
  } catch (error) {
    // Not a big problem: "Any Category" still works.
    console.error(error);
    setupMessageEl.textContent =
      "Couldn't load the category list, but you can still play with Any Category.";
  }
}

categorySelect.addEventListener("change", function () {
  settings.category = categorySelect.value;
});

// ===== Fetching questions =====
// Builds the request web address from the player's choices, for example:
// https://opentdb.com/api.php?amount=10&difficulty=easy&type=multiple&encode=url3986
function buildQuestionsUrl() {
  const params = new URLSearchParams({
    amount: settings.amount,
    difficulty: settings.difficulty,
    type: "multiple",
    // URL-encoded text can be decoded safely with decodeURIComponent(),
    // so we never need innerHTML.
    encode: "url3986",
  });
  if (settings.category !== "") {
    params.set("category", settings.category);
  }
  return QUESTIONS_URL + "?" + params.toString();
}

// A "friendly" error carries a message that's safe to show the player.
// Any other error (like no internet) gets a general message instead.
function friendlyError(message) {
  const error = new Error(message);
  error.friendly = true;
  return error;
}

// Waits for the given number of milliseconds (use with await).
function wait(ms) {
  return new Promise(function (resolve) {
    setTimeout(resolve, ms);
  });
}

// Fetches questions and returns them as simple objects with decoded text.
// Throws an error if anything goes wrong.
async function fetchQuestions() {
  const url = buildQuestionsUrl();

  // Try up to 2 times, in case the first try hits the rate limit.
  for (let attempt = 1; attempt <= 2; attempt++) {
    const response = await fetch(url); // throws if there's no internet

    // Rate limited: 429 status, or response_code 5 (checked below).
    let data = null;
    if (response.ok) {
      data = await response.json();
    } else if (response.status !== 429) {
      throw friendlyError(
        "The trivia server had a problem (error " + response.status + "). Please try again."
      );
    }

    const rateLimited = response.status === 429 || (data && data.response_code === 5);
    if (rateLimited) {
      if (attempt === 1) {
        setupMessageEl.textContent = "The trivia server is busy. Trying again in a few seconds…";
        await wait(RATE_LIMIT_WAIT_MS);
        continue; // go around the loop for attempt 2
      }
      throw friendlyError("The trivia server is busy. Please wait a few seconds and try again.");
    }

    // response_code 1 means there aren't enough questions for these settings.
    if (data.response_code === 1) {
      throw friendlyError(notEnoughQuestionsMessage());
    }
    // Any other non-zero code is unexpected.
    if (data.response_code !== 0) {
      throw friendlyError("Something went wrong getting questions (code " +
        data.response_code + "). Please try again.");
    }

    // Success! Turn the API's format into simpler objects.
    return data.results.map(function (item) {
      const correct = decodeURIComponent(item.correct_answer);
      const incorrect = item.incorrect_answers.map(decodeURIComponent);
      return {
        question: decodeURIComponent(item.question),
        correct: correct,
        answers: shuffle([correct, ...incorrect]),
      };
    });
  }
}

// e.g. "There aren't 20 hard questions in Science: Gadgets. Try fewer questions,
// a different difficulty, or another category."
function notEnoughQuestionsMessage() {
  const categoryName = categorySelect.options[categorySelect.selectedIndex].textContent;
  return "There aren't " + settings.amount + " " + settings.difficulty +
    " questions in " + categoryName +
    ". Try fewer questions, a different difficulty, or another category.";
}

// ===== Helpers =====
// Fisher–Yates shuffle: returns a new array in random order.
function shuffle(array) {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// ===== Showing a question =====
function showQuestion() {
  const q = questions[currentIndex];

  progressEl.textContent = "Question " + (currentIndex + 1) + " of " + questions.length;
  // textContent shows text exactly as-is and never runs it as HTML.
  questionEl.textContent = q.question;

  answersEl.innerHTML = ""; // clear old buttons (safe: no outside text here)
  q.answers.forEach(function (answer) {
    const button = document.createElement("button");
    button.textContent = answer;
    button.addEventListener("click", function () {
      handleAnswer(button, q);
    });
    answersEl.appendChild(button);
  });

  answered = false;
  startTimer();
}

// ===== Countdown timer =====
// Instead of counting down 7, 6, 5..., we remember the exact time the question
// ends (the "deadline") and check how much time is left on each tick.
// This stays accurate even if the browser runs a tick a little late.
function startTimer() {
  deadline = Date.now() + QUESTION_TIME_MS;
  updateTimerDisplay();
  timerId = setInterval(updateTimerDisplay, TICK_MS);
}

function stopTimer() {
  clearInterval(timerId);
  timerId = null;
}

// Milliseconds left on the current question (never below 0).
function getTimeLeftMs() {
  return Math.max(0, deadline - Date.now());
}

function updateTimerDisplay() {
  const msLeft = getTimeLeftMs();
  // Round UP for display so the player sees 7, 6, ... 1 (never a misleading 0).
  const secondsShown = Math.ceil(msLeft / 1000);

  timerEl.textContent = secondsShown;
  timerEl.classList.toggle("low", secondsShown <= LOW_TIME_SECONDS);

  if (msLeft === 0) {
    handleTimeout();
  }
}

// ===== Handling a click =====
function handleAnswer(clickedButton, q) {
  if (answered) return; // ignore anything after the first answer
  answered = true;

  // Read the time left BEFORE stopping the timer.
  // Rounded up, to match the number on the timer: 4.2 seconds left counts as 5.
  const secondsLeft = Math.ceil(getTimeLeftMs() / 1000);
  stopTimer(); // freeze the timer as soon as an answer is chosen

  revealAnswer(q);

  if (clickedButton.textContent === q.correct) {
    // The streak bonus uses the streak from BEFORE this answer.
    const points =
      BASE_POINTS + BONUS_POINTS * (secondsLeft + streak);
    score += points;
    streak++;
    correctCount++;
    messageEl.textContent = "+" + points;
  } else {
    clickedButton.classList.add("wrong");
    streak = 0;
    messageEl.textContent = "+0";
  }

  updateStats();
  setTimeout(nextQuestion, FEEDBACK_DELAY_MS);
}

// ===== Handling a timeout =====
function handleTimeout() {
  if (answered) return; // the player already answered
  answered = true;
  stopTimer();

  timerEl.textContent = "Time's up!";
  revealAnswer(questions[currentIndex]);

  // A timeout counts the same as a wrong answer.
  streak = 0;
  messageEl.textContent = "+0";
  updateStats();

  setTimeout(nextQuestion, FEEDBACK_DELAY_MS);
}

// Show the current score and streak on the page.
function updateStats() {
  scoreEl.textContent = score;
  streakEl.textContent = streak;
}

// Disable every button and turn the correct one green.
function revealAnswer(q) {
  const buttons = answersEl.querySelectorAll("button");
  buttons.forEach(function (button) {
    button.disabled = true; // stop extra clicks during the pause
    if (button.textContent === q.correct) {
      button.classList.add("correct");
    }
  });
}

// ===== Moving on =====
function nextQuestion() {
  currentIndex++;

  if (currentIndex < questions.length) {
    messageEl.textContent = ""; // clear the "+points" from the last question
    showQuestion();
  } else {
    showEndScreen();
  }
}

// ===== End screen =====
function showEndScreen() {
  finalScoreEl.textContent = score;
  finalCorrectEl.textContent = correctCount + " / " + questions.length;

  showScreen("end");
}

// ===== Switching screens =====
// Shows one screen ("setup", "game", or "end") and hides the other two.
function showScreen(name) {
  setupScreenEl.hidden = name !== "setup";
  gameScreenEl.hidden = name !== "game";
  endScreenEl.hidden = name !== "end";
}

// ===== Starting a game =====
// Stays on the setup screen while loading, so if something goes wrong the
// player can see the message, change their settings, and try again.
async function startGame() {
  startButton.disabled = true; // stop double-clicks from sending two requests
  setupMessageEl.textContent = "Loading…";

  try {
    questions = await fetchQuestions();
  } catch (error) {
    console.error(error);
    setupMessageEl.textContent = error.friendly
      ? error.message
      : "Couldn't reach the trivia server. Check your internet connection and try again.";
    startButton.disabled = false;
    return; // stay on the setup screen
  }

  // Reset everything from the previous game.
  currentIndex = 0;
  score = 0;
  streak = 0;
  correctCount = 0;
  updateStats();
  timerEl.classList.remove("low");
  messageEl.textContent = "";
  setupMessageEl.textContent = "";
  startButton.disabled = false;

  showScreen("game");
  showQuestion();
}

startButton.addEventListener("click", startGame);

// Play Again goes back to the setup screen. The previous choices stay selected.
playAgainButton.addEventListener("click", function () {
  showScreen("setup");
});

// ===== When the page loads =====
setUpChoiceGroup(amountChoicesEl, "amount");
setUpChoiceGroup(difficultyChoicesEl, "difficulty");
loadCategories();
