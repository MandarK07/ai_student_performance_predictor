// src/components/Footer.tsx
function Footer() {
  return (
    <footer className="footer">
      <p>© {new Date().getFullYear()} Student Predictor App</p>
      <p>
        Built using FastAPI, React, and ML magic ✨
      </p>
    </footer>
  );
}

export default Footer;