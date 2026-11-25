// ===== Settings =====
// Milestone 1 uses fixed settings: 5 easy multiple-choice questions.
// "encode=url3986" asks the API to URL-encode all text, so we can decode it
// safely with decodeURIComponent() instead of using innerHTML.
const API_URL =
  "https://opentdb.com/api.php?amount=5&difficulty=easy&type=multiple&encode=url3986";

const FEEDBACK_DELAY_MS = 500; // pause after answering, in milliseconds
const QUESTION_TIME_MS = 7000; // time allowed per question, in milliseconds
const TICK_MS = 100;           // how often the timer display updates
const LOW_TIME_SECONDS = 3;    // timer turns red at or below this

// ===== Page elements =====
const progressEl = document.getElementById("progress");
const timerEl = document.getElementById("timer");
const questionEl = document.getElementById("question");
const answersEl = document.getElementById("answers");
const messageEl = document.getElementById("message");

// ===== Game state =====
let questions = [];   // list of { question, correct, answers }
let currentIndex = 0; // which question we're on

// ===== Timer state =====
let timerId = null;   // the id from setInterval, so we can stop it
let deadline = 0;     // the exact time (in ms) when this question runs out
let answered = false; // true once the player answers OR time runs out

// ===== Fetching questions =====
async function loadQuestions() {
  messageEl.textContent = "Loading…";

  try {
    const response = await fetch(API_URL);
    if (!response.ok) {
      throw new Error("Network response was not OK: " + response.status);
    }

    const data = await response.json();
    // response_code 0 means success. Anything else is a problem.
    if (data.response_code !== 0) {
      throw new Error("API returned response code " + data.response_code);
    }

    // Turn the API's format into simpler objects with decoded text.
    questions = data.results.map(function (item) {
      const correct = decodeURIComponent(item.correct_answer);
      const incorrect = item.incorrect_answers.map(decodeURIComponent);
      return {
        question: decodeURIComponent(item.question),
        correct: correct,
        answers: shuffle([correct, ...incorrect]),
      };
    });

    messageEl.textContent = "";
    currentIndex = 0;
    showQuestion();
  } catch (error) {
    console.error(error);
    messageEl.textContent = "Couldn't load questions. Please refresh to try again.";
  }
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
  stopTimer(); // freeze the timer as soon as an answer is chosen

  revealAnswer(q);

  if (clickedButton.textContent !== q.correct) {
    clickedButton.classList.add("wrong");
  }

  setTimeout(nextQuestion, FEEDBACK_DELAY_MS);
}

// ===== Handling a timeout =====
function handleTimeout() {
  if (answered) return; // the player already answered
  answered = true;
  stopTimer();

  timerEl.textContent = "Time's up!";
  revealAnswer(questions[currentIndex]);

  setTimeout(nextQuestion, FEEDBACK_DELAY_MS);
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
    showQuestion();
  } else {
    // No more questions: clear the board and show Game Over.
    progressEl.textContent = "";
    timerEl.textContent = "";
    timerEl.classList.remove("low");
    questionEl.textContent = "";
    answersEl.innerHTML = "";
    messageEl.textContent = "Game Over";
  }
}

// ===== Start the game =====
loadQuestions();
