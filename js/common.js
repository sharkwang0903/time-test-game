(function () {
  "use strict";

  const mode1Feedback = [
    { upperExclusive: 0.005, message: "你是人體節拍器嗎？" },
    { upperExclusive: 0.01, message: "誇張地準！" },
    { upperExclusive: 0.02, message: "你的時間感極好" },
    { upperExclusive: 0.05, message: "相當準確" },
    { upperExclusive: 0.1, message: "你的時間感還不錯" },
    { upperExclusive: 0.15, message: "正常發揮" },
    { upperExclusive: 0.25, message: "有點飄了喔" },
    { upperExclusive: 0.4, message: "時間感可以再加油" },
    { upperExclusive: Infinity, message: "你和時間可能活在不同時區 😆" }
  ];

  const totalScoreFeedback = [
    { minimum: 95, message: "你的時間感準得有點可怕。" },
    { minimum: 90, message: "非常優秀的時間感。" },
    { minimum: 80, message: "你的時間感相當不錯。" },
    { minimum: 70, message: "整體表現穩定。" },
    { minimum: 60, message: "偶爾會被時間偷偷騙走。" },
    { minimum: 40, message: "你的時間感還有不少進步空間。" },
    { minimum: 0, message: "你和時間的關係似乎有點微妙 😆" }
  ];

  const roundNames = ["第一", "第二", "第三", "第四", "第五"];

  function formatNumber(value) {
    return Number(value).toFixed(4);
  }

  function formatPercent(relativeError) {
    return formatNumber(relativeError * 100);
  }

  function calculateAbsoluteError(actualTime, targetTime) {
    return Math.abs(actualTime - targetTime);
  }

  function calculateRelativeError(actualTime, targetTime) {
    return calculateAbsoluteError(actualTime, targetTime) / targetTime;
  }

  function calculateRoundScore(relativeError) {
    return Math.max(0, 20 * (1 - relativeError));
  }

  function getMode1Comment(relativeError) {
    return mode1Feedback.find(function (entry) {
      return relativeError < entry.upperExclusive;
    }).message;
  }

  function getTotalScoreComment(score) {
    return totalScoreFeedback.find(function (entry) {
      return score >= entry.minimum;
    }).message;
  }

  function getRoundName(index) {
    return roundNames[index] || "第 " + (index + 1);
  }

  function showOnly(panels, visiblePanel) {
    panels.forEach(function (panel) {
      panel.hidden = panel !== visiblePanel;
    });
  }

  function setTimingMode(isTiming) {
    document.body.classList.toggle("timing-active", isTiming);
  }

  window.TimeSense = Object.freeze({
    formatNumber: formatNumber,
    formatPercent: formatPercent,
    calculateAbsoluteError: calculateAbsoluteError,
    calculateRelativeError: calculateRelativeError,
    calculateRoundScore: calculateRoundScore,
    getMode1Comment: getMode1Comment,
    getTotalScoreComment: getTotalScoreComment,
    getRoundName: getRoundName,
    showOnly: showOnly,
    setTimingMode: setTimingMode
  });
})();
