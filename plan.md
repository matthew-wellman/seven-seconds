# Seven Seconds: Project Plan

## Goal
Build a single-player, browser-based trivia game in plain HTML, CSS, and JavaScript that rewards players for answering quickly and correctly, and use it to learn how to fetch data from the internet.

## Who It Is For
- **Players:** anyone who wants a quick, casual trivia game to play alone in a web browser. No account or setup needed.
- **Developer (me):** this is a school project, so learning comes first. The scope stays small enough that I understand every part of the code.

## Must-Have Features (Version 1)

**1. Game setup and fetching questions**
- Start screen with preset buttons for number of questions (5 / 10 / 20), difficulty (Easy / Medium / Hard), and category.
- The category list and the questions both come from the Open Trivia Database API (free, HTTPS, no API key).
- Question text is displayed safely, using `textContent` instead of `innerHTML`.
- A friendly message appears if the request fails or there aren't enough questions for the chosen settings.

**2. The timed question loop**
- One multiple-choice question at a time, with four answer buttons in random order.
- 7-second countdown per question. When time runs out, the game moves on to the next question.
- Instant feedback: the correct answer turns green and a wrong pick turns red. After a 0.5-second pause (timer stopped), the next question appears.

**3. Scoring and basic end screen**
- Correct answer: **100 + 10 × (seconds left + current streak)**, with seconds left rounded up to match the countdown timer (4.2 seconds left counts as 5)
- Wrong answer or timeout: 0 points, and the streak resets to 0.
- Score and streak are shown live during play.
- End screen shows final score, number correct (e.g., 7 / 10), and a Play Again button.

## Nice-to-Haves (Version 2)
- Longest streak shown on the end screen
- Highest score saved in `localStorage` so it's remembered between visits
- Review list of every question, the player's answer, and the correct answer

## Out of Scope
- Multiplayer or online leaderboards
- User accounts, logins, or any server/backend
- True/False or mixed question types
- Study mode or custom question sets
- Sound effects, animations beyond basic color feedback, and mobile app versions
- Frameworks or libraries (no React, jQuery, etc.)
