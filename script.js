// ===== Settings =====
// Milestone 1 uses fixed settings: 5 easy multiple-choice questions.
// "encode=url3986" asks the API to URL-encode all text, so we can decode it
// safely with decodeURIComponent() instead of using innerHTML.
const API_URL =
  "https://opentdb.com/api.php?amount=5&difficulty=easy&type=multiple&encode=url3986";

const FEEDBACK_DELAY_MS = 1500; // pause after answering, in milliseconds

// ===== Page elements =====
const progressEl = document.getElementById("progress");
const questionEl = document.getElementById("question");
const answersEl = document.getElementById("answers");
const messageEl = document.getElementById("message");

// ===== Game state =====
let questions = [];   // list of { question, correct, answers }
let currentIndex = 0; // which question we're on

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
}

// ===== Handling a click =====
function handleAnswer(clickedButton, q) {
  const buttons = answersEl.querySelectorAll("button");

  buttons.forEach(function (button) {
    button.disabled = true; // stop extra clicks during the pause
    if (button.textContent === q.correct) {
      button.classList.add("correct");
    }
  });

  if (clickedButton.textContent !== q.correct) {
    clickedButton.classList.add("wrong");
  }

  setTimeout(nextQuestion, FEEDBACK_DELAY_MS);
}

// ===== Moving on =====
function nextQuestion() {
  currentIndex++;

  if (currentIndex < questions.length) {
    showQuestion();
  } else {
    // No more questions: clear the board and show Game Over.
    progressEl.textContent = "";
    questionEl.textContent = "";
    answersEl.innerHTML = "";
    messageEl.textContent = "Game Over";
  }
}

// ===== Start the game =====
loadQuestions();
