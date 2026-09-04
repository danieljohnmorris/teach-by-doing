/* teach-by-doing widgets: quiz, exercise, qa, flashcards.
 * Declarative: lessons embed markup + JSON; this file wires behaviour.
 * No dependencies, no build step. Results persist to localStorage keyed by
 * <meta name="lesson"> + widget id, so the agent can read them and the
 * learner keeps state across reloads.
 */
(function () {
  "use strict";

  function lessonKey() {
    var m = document.querySelector('meta[name="lesson"]');
    return "td:" + (m ? m.content : "unknown");
  }
  function store(id, value) {
    try { localStorage.setItem(lessonKey() + ":" + id, JSON.stringify(value)); } catch (e) {}
  }
  function read(id) {
    try { return JSON.parse(localStorage.getItem(lessonKey() + ":" + id)); } catch (e) { return null; }
  }
  function data(el) {
    var s = el.querySelector('script[type="application/json"]');
    return s ? JSON.parse(s.textContent) : {};
  }
  function feedback(el, ok, msg) {
    var f = el.querySelector(".feedback");
    if (!f) { f = document.createElement("div"); f.className = "feedback"; el.appendChild(f); }
    f.className = "feedback show " + (ok ? "good" : "bad");
    f.textContent = msg;
    return f;
  }

  /* ---- quiz ---- */
  function initQuiz(el) {
    var d = data(el);
    var options = el.querySelectorAll(".quiz-option");
    options.forEach(function (btn, i) {
      btn.addEventListener("click", function () {
        var correct = d.correct === i || (Array.isArray(d.correct) && d.correct.indexOf(i) !== -1);
        options.forEach(function (b) { b.classList.remove("correct", "wrong"); });
        btn.classList.add(correct ? "correct" : "wrong");
        feedback(el, correct, correct ? (d.goodMsg || "Correct.") : (d.badMsg || "Not quite — see the segment above and try again."));
        store(el.id, { chosen: i, correct: correct, at: Date.now() });
        el.dataset.result = correct ? "pass" : "fail";
      });
    });
    var prev = read(el.id);
    if (prev) el.dataset.result = prev.correct ? "pass" : "fail";
  }

  /* ---- exercise ----
   * JSON: {"checks": [ {"pattern": "regex", "msg": "..."} ], "goodMsg": "...", "solution": "..." }
   * All patterns must match (RegExp against textarea value). Optional self-reveal. */
  function initExercise(el) {
    var d = data(el);
    var ta = el.querySelector("textarea.answer");
    el.querySelector(".btn.check").addEventListener("click", function () {
      var val = ta.value;
      var failed = (d.checks || []).filter(function (c) { return !new RegExp(c.pattern, "m").test(val); });
      var ok = failed.length === 0;
      feedback(el, ok, ok ? (d.goodMsg || "All checks pass.") : failed[0].msg);
      store(el.id, { value: val, pass: ok, at: Date.now() });
      el.dataset.result = ok ? "pass" : "fail";
    });
    var reveal = el.querySelector(".btn.reveal");
    if (reveal) reveal.addEventListener("click", function () {
      ta.value = d.solution || "";
      feedback(el, true, "Solution filled in — study it, then try to reproduce it from memory.");
    });
    var prev = read(el.id);
    if (prev) { ta.value = prev.value; el.dataset.result = prev.pass ? "pass" : "fail"; }
  }

  /* ---- qa (free-text, agent-graded) ----
   * The page can't grade prose. The learner writes an answer; it's persisted.
   * The agent reads the transcript / grades it and (via browser tooling) sets
   * el.dataset.result + feedback. The widget only handles capture + display. */
  function initQa(el) {
    var d = data(el);
    var ta = el.querySelector("textarea.answer");
    el.querySelector(".btn.save").addEventListener("click", function () {
      store(el.id, { value: ta.value, at: Date.now(), points: d.points || [] });
      el.dataset.result = "pending";
      feedback(el, true, "Saved. Ask your tutor to grade it (\"grade my answer\").");
    });
    var prev = read(el.id);
    if (prev) ta.value = prev.value;
    if (el.dataset.result) {
      var r = el.dataset.result;
      if (r === "pass" || r === "fail") feedback(el, r === "pass", el.dataset.feedback || "");
    }
  }

  /* ---- flashcards ----
   * JSON: {"cards": [{"front": "...", "back": "..."}]}  */
  function initFlashcards(el) {
    var d = data(el);
    var cards = d.cards || [];
    if (!cards.length) return;
    var i = 0;
    var card = el.querySelector(".flashcard");
    var pos = el.querySelector(".fc-nav .pos");
    function render() {
      card.classList.remove("flipped");
      card.querySelector(".front").innerHTML = cards[i].front;
      card.querySelector(".back").innerHTML = cards[i].back;
      pos.textContent = (i + 1) + " / " + cards.length;
    }
    card.addEventListener("click", function () { card.classList.toggle("flipped"); });
    el.querySelector(".fc-prev").addEventListener("click", function () { i = (i - 1 + cards.length) % cards.length; render(); });
    el.querySelector(".fc-next").addEventListener("click", function () { i = (i + 1) % cards.length; render(); });
    el.querySelector(".fc-grade .again").addEventListener("click", function () {
      store(el.id + ":" + i, { grade: "again", at: Date.now() });
      i = (i + 1) % cards.length; render();
    });
    el.querySelector(".fc-grade .good").addEventListener("click", function () {
      store(el.id + ":" + i, { grade: "good", at: Date.now() });
      i = (i + 1) % cards.length; render();
    });
    render();
  }

  document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll('.widget[data-kind="quiz"]').forEach(initQuiz);
    document.querySelectorAll('.widget[data-kind="exercise"]').forEach(initExercise);
    document.querySelectorAll('.widget[data-kind="qa"]').forEach(initQa);
    document.querySelectorAll('.widget[data-kind="flashcards"]').forEach(initFlashcards);
  });
})();
