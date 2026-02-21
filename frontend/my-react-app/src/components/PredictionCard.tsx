// src/components/PredictionCard.tsx
type Props = {
  studentName: string;
  score: number;
  date: string;
};

function PredictionCard({ studentName, score, date }: Props) {
  return (
    <div className="card prediction-card">
      <h4>{studentName}</h4>
      <p className="score-text">Predicted Score: <strong>{score}</strong></p>
      <small className="date-text">{date}</small>
    </div>
  );
}

export default PredictionCard;