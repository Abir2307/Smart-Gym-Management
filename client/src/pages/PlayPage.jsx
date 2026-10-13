import { useEffect, useState } from "react";
import { api } from "../lib/api";

const emptyGame = {
  profile: { tokens: 0, moneyCollected: 0, penaltyAmount: 0, dailySolvedCount: 0, dailyQuestionLimit: 60, streak: 0 },
  challenges: [],
  paymentSuggestions: { moneyCollected: 0, nearestPlan: null, nextPlan: null, nearToGoal: false },
};

export function PlayPage() {
  const [game, setGame] = useState(emptyGame);
  const [selectedId, setSelectedId] = useState("");
  const [answer, setAnswer] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const selected = game.challenges.find((challenge) => challenge.id === selectedId);

  useEffect(() => {
    api.games().then(setGame).catch((requestError) => setError(requestError.message)).finally(() => setLoading(false));
  }, []);

  async function submitAnswer(event) {
    event.preventDefault();
    if (!selected || !answer.trim()) return;
    setMessage("");
    setError("");
    try {
      const result = await api.answerGame(selected.id, answer);
      if (result.game) setGame(result.game);
      setMessage(result.correct
        ? (result.alreadyCompleted ? "Already solved. Pick another challenge." : `Correct. You earned ${result.reward} token${result.reward === 1 ? "" : "s"}.`)
        : result.penalty ? `Not quite. ₹${result.penalty} penalty applied. Try again with the hint.` : "This round is complete.");
      if (result.correct) setAnswer("");
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  return (
    <div className="page-stack play-page">
      <header className="game-hero">
        <div>
          <p className="eyebrow">PulseForge Play Arena</p>
          <h1>Play sharp. Earn real value.</h1>
          <p>Crack puzzles, survive googlies, and collect tokens across the gym's brain-break circuit.</p>
        </div>
        <div className="token-total"><span>YOUR TOKENS</span><strong>{game.profile.tokens}</strong><small>₹{game.profile.moneyCollected} net reward value</small></div>
      </header>

      <section className="game-stats">
        <article><span>Money collected till date</span><strong>₹{game.paymentSuggestions.moneyCollected}</strong><small>after ₹{game.profile.penaltyAmount} wrong-answer penalties</small></article>
        <article><span>Today's round</span><strong>{game.profile.dailySolvedCount}/{game.profile.dailyQuestionLimit}</strong><small>questions solved</small></article>
        <article><span>Streak</span><strong>{game.profile.streak}</strong><small>correct answers</small></article>
      </section>

      <section className="goal-strip">
        <div>
          <p className="eyebrow">Next best move</p>
          {game.paymentSuggestions.nearestPlan ? (
            <h2>{game.paymentSuggestions.nearToGoal ? "You are close to " : "You need more to reach "}{game.paymentSuggestions.nearestPlan.name}</h2>
          ) : <h2>All available payment plans are within reach.</h2>}
        </div>
        {game.paymentSuggestions.nearestPlan ? <div className="goal-amount"><strong>₹{game.paymentSuggestions.nearestPlan.amountNeeded}</strong><span>needed · {game.paymentSuggestions.nearestPlan.progress}% reached</span></div> : null}
        {game.paymentSuggestions.nearToGoal && game.paymentSuggestions.nextPlan ? <div className="next-goal"><span>Then aim for</span><strong>{game.paymentSuggestions.nextPlan.name}</strong><small>₹{game.paymentSuggestions.nextPlan.amountNeeded} more after this goal</small></div> : null}
      </section>

      {error ? <p className="form-error">{error}</p> : null}
      {message ? <p className="form-success">{message}</p> : null}
      {loading ? <div className="empty-state">Loading the next round...</div> : (
        <section className="game-layout">
          <div className="challenge-list">
            <div className="section-header compact"><div><p className="eyebrow">Choose your arena</p><h2>Pick a challenge</h2></div></div>
            {game.challenges.map((challenge) => (
              <button type="button" key={challenge.id} className={`challenge-card ${selectedId === challenge.id ? "selected" : ""}`} onClick={() => { setSelectedId(challenge.id); setAnswer(""); setMessage(""); }}>
                <span className="challenge-category">{challenge.category}</span>
                <strong>{challenge.prompt}</strong>
                <small>{challenge.difficulty} · {challenge.reward} token{challenge.reward === 1 ? "" : "s"} {challenge.completed ? "· Solved" : ""}</small>
              </button>
            ))}
          </div>

          <div className="game-board">
            {selected ? <form onSubmit={submitAnswer}>
              <span className="pill pill-accent">{selected.difficulty} · +{selected.reward} tokens</span>
              <p className="eyebrow">{selected.category}</p>
              <h2>{selected.prompt}</h2>
              <label className="field"><span>Your answer</span><input autoFocus value={answer} onChange={(event) => setAnswer(event.target.value)} placeholder="Type your answer" disabled={selected.completed} /></label>
              <p className="hint-text">Hint: {selected.hint}</p>
              <button type="submit" className="primary-button full-width" disabled={selected.completed || !answer.trim()}>{selected.completed ? "Challenge solved" : "Lock in answer"}</button>
            </form> : <div className="game-empty"><span>01</span><h2>Choose a challenge to begin.</h2><p>Every correct answer adds tokens. A wrong answer applies a ₹5 penalty to your net reward value.</p></div>}
          </div>
        </section>
      )}
    </div>
  );
}