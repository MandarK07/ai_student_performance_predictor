import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

type NavbarProps = {
  onToggleSidebar: () => void;
};

function Navbar({ onToggleSidebar }: NavbarProps) {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <nav>
      <div className="nav-left">
        <button className="menu-toggle" onClick={onToggleSidebar}>
          Menu
        </button>
        <Link to="/" className="nav-brand">
          Student AI
        </Link>
      </div>
      <div className="nav-links">
        {user ? (
          <>
            <Link to="/">Home</Link>
            <Link to="/predict">Predictor</Link>
            <Link to="/about">About</Link>
            {user.role === "admin" && <Link to="/register-user">Register User</Link>}
            <span style={{ color: "var(--text-muted)" }}>
              {user.username} ({user.role})
            </span>
            <button onClick={handleLogout}>Logout</button>
          </>
        ) : (
          <Link to="/login">Login</Link>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
