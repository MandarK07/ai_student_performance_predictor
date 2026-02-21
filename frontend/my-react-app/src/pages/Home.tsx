// src/pages/Home.tsx
import { Link } from "react-router-dom";

function Home() {
  return (
    <div className="home-container">
      <div className="hero-section">
        <h1>📚 Student Performance Predictor</h1>
        <p className="hero-description">
          Empowering educators with AI-driven insights. Predict academic outcomes, analyze trends, and support student success with precision.
        </p>
        <div className="features-grid">
          <div className="card">
            <h3>🎯 Precision</h3>
            <p>Advanced ML models trained on real student data.</p>
          </div>
          <div className="card">
            <h3>⚡ Real-time</h3>
            <p>Get instant predictions for individual students.</p>
          </div>
          <div className="card">
            <h3>📁 Bulk Support</h3>
            <p>Upload CSV files for entire class assessments.</p>
          </div>
        </div>
        <Link to="/predict">
          <button className="cta-button">Get Started Now</button>
        </Link>
      </div>
    </div>
  );
}

export default Home;