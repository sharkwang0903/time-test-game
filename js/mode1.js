(function () {
  "use strict";

  const setupPanel = document.querySelector("#setup-panel");
  const readyPanel = document.querySelector("#ready-panel");
  const timingPanel = document.querySelector("#timing-panel");
  const resultPanel = document.querySelector("#result-panel");
  const panels = [setupPanel, readyPanel, timingPanel, resultPanel];

  const startButton = document.querySelector("#start-button");
  const readyStartButton = document.querySelector("#ready-start-button");
  const backToSelectionButton = document.querySelector("#back-to-selection-button");
  const stopButton = document.querySelector("#stop-button");
  const retryButton = document.querySelector("#retry-button");
  const resultTitle = document.querySelector("#result-title");
  const resultTarget = document.querySelector("#result-target");
  const resultActual = document.querySelector("#result-actual");
  const resultError = document.querySelector("#result-error");
  const resultRatio = document.querySelector("#result-ratio");
  const resultComment = document.querySelector("#result-comment");
  const resultRelation = document.querySelector("#result-relation");

  const actualRow = document.querySelector("#actual-row");
  const errorRow = document.querySelector("#error-row");
  const ratioRow = document.querySelector("#ratio-row");
  const statusRow = document.querySelector("#status-row");
  const readyTarget = document.querySelector("#ready-target");

  let state = "setup";
  let targetTime = 1;
  let startTimestamp = null;
  let deadlineTimestamp = null;
  let timeoutTimer = null;

  function clearRoundTimer() {
    if (timeoutTimer !== null) {
      window.clearTimeout(timeoutTimer);
      timeoutTimer = null;
    }
  }

  function enterChallenge(event) {
    if (state !== "setup" || event.detail > 1) {
      return;
    }

    const selectedTarget = document.querySelector('input[name="target-time"]:checked');
    targetTime = Number(selectedTarget.value);
    readyTarget.textContent = String(targetTime);
    readyStartButton.setAttribute("aria-label", "開始" + targetTime + "秒挑戰");
    state = "ready";
    TimeSense.setTimingMode(false);
    TimeSense.showOnly(panels, readyPanel);
    readyStartButton.focus({ preventScroll: true });
  }

  function startRound(event) {
    if (state !== "ready" || event.detail > 1) {
      return;
    }

    // The measured round starts at the Start button click.
    startTimestamp = performance.now();
    deadlineTimestamp = startTimestamp + (targetTime + 5) * 1000;
    state = "timing";
    TimeSense.setTimingMode(true);
    TimeSense.showOnly(panels, timingPanel);
    stopButton.focus({ preventScroll: true });
    scheduleTimeoutCheck();
  }

  function scheduleTimeoutCheck() {
    if (state !== "timing") {
      return;
    }

    const remainingMilliseconds = deadlineTimestamp - performance.now();
    if (remainingMilliseconds <= 0) {
      finishRound({ status: "timeout", targetTime: targetTime });
      return;
    }

    timeoutTimer = window.setTimeout(scheduleTimeoutCheck, remainingMilliseconds);
  }

  function stopRound(event) {
    if (state !== "timing" || event.detail > 1) {
      return;
    }

    const endTimestamp = performance.now();
    const actualTime = (endTimestamp - startTimestamp) / 1000;

    // A delayed timeout callback must not turn an overdue press into a score.
    if (endTimestamp >= deadlineTimestamp) {
      finishRound({ status: "timeout", targetTime: targetTime });
      return;
    }

    const absoluteError = TimeSense.calculateAbsoluteError(actualTime, targetTime);
    const relativeError = TimeSense.calculateRelativeError(actualTime, targetTime);

    finishRound({
      status: "completed",
      targetTime: targetTime,
      actualTime: actualTime,
      absoluteError: absoluteError,
      relativeError: relativeError
    });
  }

  function finishRound(result) {
    if (state !== "timing") {
      return;
    }

    state = "result";
    clearRoundTimer();
    TimeSense.setTimingMode(false);
    renderResult(result);
    TimeSense.showOnly(panels, resultPanel);
    resultTitle.focus({ preventScroll: true });
  }

  function renderResult(result) {
    resultTarget.textContent = TimeSense.formatNumber(result.targetTime);

    const isTimeout = result.status === "timeout";
    actualRow.hidden = isTimeout;
    errorRow.hidden = isTimeout;
    ratioRow.hidden = isTimeout;
    statusRow.hidden = !isTimeout;

    if (isTimeout) {
      resultTitle.textContent = "這一回合逾時了";
      resultComment.textContent = "這次沒有留下成績。";
      resultRelation.textContent = "超過目標時間 5 秒，系統已自動結束；這一回合沒有記錄玩家時間。";
      return;
    }

    resultTitle.textContent = "你的時間感";
    resultActual.textContent = TimeSense.formatNumber(result.actualTime);
    resultError.textContent = TimeSense.formatNumber(result.absoluteError);
    resultRatio.textContent = TimeSense.formatPercent(result.relativeError);
    resultComment.textContent = TimeSense.getMode1Comment(result.relativeError);

    if (result.actualTime < result.targetTime) {
      resultRelation.textContent = "你比目標時間早了 " + TimeSense.formatNumber(result.absoluteError) + " 秒。";
    } else if (result.actualTime > result.targetTime) {
      resultRelation.textContent = "你比目標時間晚了 " + TimeSense.formatNumber(result.absoluteError) + " 秒。";
    } else {
      resultRelation.textContent = "你剛好命中目標時間。";
    }
  }

  function resetRound() {
    clearRoundTimer();
    startTimestamp = null;
    deadlineTimestamp = null;
    state = "ready";
    TimeSense.setTimingMode(false);
    readyTarget.textContent = String(targetTime);
    readyStartButton.setAttribute("aria-label", "開始" + targetTime + "秒挑戰");
    TimeSense.showOnly(panels, readyPanel);
    readyStartButton.focus({ preventScroll: true });
  }

  function backToSelection() {
    if (state !== "ready") {
      return;
    }

    state = "setup";
    TimeSense.showOnly(panels, setupPanel);
    startButton.focus({ preventScroll: true });
  }

  function preventRepeatedKeyActivation(event) {
    if (event.repeat) {
      event.preventDefault();
    }
  }

  startButton.addEventListener("click", enterChallenge);
  readyStartButton.addEventListener("click", startRound);
  readyStartButton.addEventListener("keydown", preventRepeatedKeyActivation);
  backToSelectionButton.addEventListener("click", backToSelection);
  stopButton.addEventListener("click", stopRound);
  stopButton.addEventListener("keydown", preventRepeatedKeyActivation);
  retryButton.addEventListener("click", resetRound);
})();
