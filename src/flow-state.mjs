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
