export function filterQuestionOptions(questionId, options, answers) {
  if (questionId === "production_dredge" && answers.deployment === "sled") {
    return options.filter((option) => option.id === "p_150");
  }
  if (questionId === "production_dredge" && answers.deployment === "diver") {
    return options.filter((option) => option.id === "p_150" || option.id === "p_200");
  }
  if (
    questionId === "power"
    && answers.application === "process"
    && answers.deployment === "selfpriming"
  ) {
    return options.filter((option) => option.id === "electric");
  }
  return options;
}

export function clearAnswersFromTrack({ answers, track, targetIdx, questions }) {
  const next = { ...answers };
  for (const questionId of track.slice(targetIdx)) {
    delete next[questions[questionId].key];
  }
  if (answers.deployment === "excavator" && next.deployment !== "excavator") {
    delete next.power;
  }
  return next;
}
