(function () {
  "use strict";

  const roundTargets = [1, 3, 5, 10, 30];

  const introPanel = document.querySelector("#intro-panel");
  const readyPanel = document.querySelector("#ready-panel");
  const timingPanel = document.querySelector("#timing-panel");
  const interludePanel = document.querySelector("#interlude-panel");
  const resultsPanel = document.querySelector("#results-panel");
  const panels = [introPanel, readyPanel, timingPanel, interludePanel, resultsPanel];

  const challengeButton = document.querySelector("#challenge-button");
  const roundStartButton = document.querySelector("#round-start-button");
  const stopButton = document.querySelector("#stop-button");
  const replayButton = document.querySelector("#replay-button");

  const roundNumber = document.querySelector("#round-number");
  const targetSeconds = document.querySelector("#target-seconds");
  const interludeTitle = document.querySelector("#interlude-title");
  const interludeNote = document.querySelector("#interlude-note");
  const resultsTitle = document.querySelector("#results-title");
  const totalScoreElement = document.querySelector("#total-score");
  const scoreComment = document.querySelector("#score-comment");
  const roundResults = document.querySelector("#round-results");

  let state = "intro";
  let currentRoundIndex = 0;
  let startTimestamp = null;
  let deadlineTimestamp = null;
  let timeoutTimer = null;
  let interludeTimer = null;
  let results = [];

  function clearTimers() {
    if (timeoutTimer !== null) {
      window.clearTimeout(timeoutTimer);
      timeoutTimer = null;
    }

    if (interludeTimer !== null) {
      window.clearTimeout(interludeTimer);
      interludeTimer = null;
    }
  }

  function beginChallenge() {
    clearTimers();
    results = [];
    currentRoundIndex = 0;
    showRoundReady();
  }

  function showRoundReady() {
    state = "ready";
    const targetTime = roundTargets[currentRoundIndex];
    roundNumber.textContent = String(currentRoundIndex + 1);
    targetSeconds.textContent = String(targetTime);
    roundStartButton.setAttribute(
      "aria-label",
      "開始" + TimeSense.getRoundName(currentRoundIndex) + "關，目標 " + targetTime + " 秒"
    );
    TimeSense.setTimingMode(false);
    TimeSense.showOnly(panels, readyPanel);
    roundStartButton.focus({ preventScroll: true });
  }

  function startRound(event) {
    if (state !== "ready" || event.detail > 1) {
      return;
    }

    const targetTime = roundTargets[currentRoundIndex];
    state = "timing";

    // The measured round starts at the Start button click.
    startTimestamp = performance.now();
    deadlineTimestamp = startTimestamp + (targetTime + 5) * 1000;
    TimeSense.setTimingMode(true);
    TimeSense.showOnly(panels, timingPanel);
    stopButton.focus({ preventScroll: true });
    scheduleTimeoutCheck(targetTime, currentRoundIndex);
  }

  function scheduleTimeoutCheck(targetTime, roundIndex) {
    if (state !== "timing" || currentRoundIndex !== roundIndex) {
      return;
    }

    const remainingMilliseconds = deadlineTimestamp - performance.now();
    if (remainingMilliseconds <= 0) {
      completeRound({
        roundIndex: roundIndex,
        targetTime: targetTime,
        status: "timeout",
        score: 0
      });
      return;
    }

    timeoutTimer = window.setTimeout(function () {
      scheduleTimeoutCheck(targetTime, roundIndex);
    }, remainingMilliseconds);
  }

  function stopRound(event) {
    if (state !== "timing" || event.detail > 1) {
      return;
    }

    const targetTime = roundTargets[currentRoundIndex];
    const endTimestamp = performance.now();
    const actualTime = (endTimestamp - startTimestamp) / 1000;

    if (endTimestamp >= deadlineTimestamp) {
      completeRound({
        roundIndex: currentRoundIndex,
        targetTime: targetTime,
        status: "timeout",
        score: 0
      });
      return;
    }

    const absoluteError = TimeSense.calculateAbsoluteError(actualTime, targetTime);
    const relativeError = TimeSense.calculateRelativeError(actualTime, targetTime);
    const score = TimeSense.calculateRoundScore(relativeError);

    completeRound({
      roundIndex: currentRoundIndex,
      targetTime: targetTime,
      actualTime: actualTime,
      absoluteError: absoluteError,
      relativeError: relativeError,
      score: score,
      status: "completed"
    });
  }

  function completeRound(result) {
    if (state !== "timing") {
      return;
    }

    state = "interlude";
    deadlineTimestamp = null;
    if (timeoutTimer !== null) {
      window.clearTimeout(timeoutTimer);
      timeoutTimer = null;
    }

    results.push(result);
    TimeSense.setTimingMode(false);
    interludeTitle.textContent = TimeSense.getRoundName(currentRoundIndex) + "關完成";
    interludeNote.textContent = currentRoundIndex === roundTargets.length - 1
      ? "五關都完成了。"
      : "下一關即將開始。";
    TimeSense.showOnly(panels, interludePanel);
    interludeTitle.focus({ preventScroll: true });

    interludeTimer = window.setTimeout(function () {
      interludeTimer = null;
      currentRoundIndex += 1;

      if (currentRoundIndex < roundTargets.length) {
        showRoundReady();
      } else {
        showResults();
      }
    }, 1500);
  }

  function createMetricRow(label, value) {
    const row = document.createElement("div");
    const term = document.createElement("dt");
    const description = document.createElement("dd");

    row.className = "metric-row";
    term.textContent = label;
    description.textContent = value;
    row.append(term, description);
    return row;
  }

  function createRoundResult(result) {
    const article = document.createElement("article");
    const heading = document.createElement("h3");
    const metrics = document.createElement("dl");

    article.className = "round-result";
    heading.textContent = TimeSense.getRoundName(result.roundIndex) + "關｜" + result.targetTime + " 秒挑戰";
    metrics.className = "result-metrics";
    metrics.append(createMetricRow("目標時間", TimeSense.formatNumber(result.targetTime) + " 秒"));

    if (result.status === "timeout") {
      metrics.append(createMetricRow("狀態", "Timeout"));
      metrics.append(createMetricRow("本關得分", "0.0000 / 20"));
    } else {
      metrics.append(createMetricRow("你的時間", TimeSense.formatNumber(result.actualTime) + " 秒"));
      metrics.append(createMetricRow("絕對誤差", TimeSense.formatNumber(result.absoluteError) + " 秒"));
      metrics.append(createMetricRow("誤差比率", TimeSense.formatPercent(result.relativeError) + "%"));
      metrics.append(createMetricRow("本關得分", TimeSense.formatNumber(result.score) + " / 20"));
    }

    article.append(heading, metrics);
    return article;
  }

  function showResults() {
    state = "results";
    const totalScore = results.reduce(function (sum, result) {
      return sum + result.score;
    }, 0);

    totalScoreElement.textContent = TimeSense.formatNumber(totalScore);
    scoreComment.textContent = TimeSense.getTotalScoreComment(totalScore);
    roundResults.replaceChildren();
    results.forEach(function (result) {
      roundResults.append(createRoundResult(result));
    });

    TimeSense.showOnly(panels, resultsPanel);
    resultsTitle.focus({ preventScroll: true });
  }

  function replayChallenge() {
    beginChallenge();
  }

  function preventRepeatedKeyActivation(event) {
    if (event.repeat) {
      event.preventDefault();
    }
  }

  challengeButton.addEventListener("click", beginChallenge);
  roundStartButton.addEventListener("click", startRound);
  roundStartButton.addEventListener("keydown", preventRepeatedKeyActivation);
  stopButton.addEventListener("click", stopRound);
  stopButton.addEventListener("keydown", preventRepeatedKeyActivation);
  replayButton.addEventListener("click", replayChallenge);
})();
