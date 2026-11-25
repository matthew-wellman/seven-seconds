# Trivia Time Attack: Roadmap (Version 1)

Each milestone ends with something you can open in a browser and test. Finish and test each one before starting the next.

---

## Milestone 1: Fetch and Answer Questions
*The smallest version that works: real questions from the internet that you can click through.*

- [x] Create `index.html`, `style.css`, and `script.js`, and link them together
- [x] Fetch 5 easy multiple-choice questions from the Open Trivia Database (fixed settings for now)
- [x] Decode the question and answer text and display it safely with `textContent`
- [x] Show one question with four answer buttons in random order
- [x] On click: correct answer turns green, wrong pick turns red, then a 1.5-second pause
- [x] Move to the next question; after the last one, show "Game Over"

**Test it:** Open `index.html`, answer all 5 questions, and check that the colors are right and that symbols like quotation marks and apostrophes display correctly.

---

## Milestone 2: Countdown Timer
*Adds the time pressure.*

- [ ] Show a 7-second countdown for each question
- [ ] When time runs out, reveal the correct answer (green), pause 1.5 seconds, and move on
- [ ] Stop the timer as soon as an answer is clicked, and keep it stopped during the pause
- [ ] Prevent extra clicks after an answer is chosen or time runs out

**Test it:** Let a question time out, answer one quickly, and click several buttons rapidly to make sure only the first click counts.

---

## Milestone 3: Scoring, Streaks, and End Screen
*Makes it a real game.*

- [ ] Correct answer: `100 + (10 × whole seconds left) + (10 × current streak)`
- [ ] Wrong answer or timeout: 0 points, and the streak resets to 0
- [ ] Show the score and streak live during play
- [ ] End screen: final score, number correct (e.g., 4 / 5), and a Play Again button
- [ ] Play Again fetches new questions and resets the score and streak

**Test it:** Play a round while keeping track of the math on paper, and confirm the final score matches. Then click Play Again and confirm everything resets.

---

## Milestone 4: Setup Screen and Error Handling
*Lets the player choose their game, and handles problems gracefully.*

- [ ] Start screen with preset buttons: 5 / 10 / 20 questions and Easy / Medium / Hard
- [ ] Fetch the category list from the API and show it as a dropdown
- [ ] Build the question request from the player's choices
- [ ] Show a "Loading…" message while questions are being fetched
- [ ] Friendly error message if the internet request fails
- [ ] Friendly message if there aren't enough questions for the chosen settings
- [ ] Play Again returns to the start screen

**Test it:** Try several combinations of settings, including 20 hard questions in a small category. Turn off Wi-Fi and start a game to check the error message.

---

✅ **Version 1 is done** when all four milestones are checked off. Next come the nice-to-haves in `plan.md`.
