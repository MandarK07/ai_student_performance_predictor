import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

type SidebarProps = {
  isOpen: boolean;
  onClose: () => void;
};

function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { user } = useAuth();

  return (
    <>
      <div className={`sidebar-overlay ${isOpen ? "active" : ""}`} onClick={onClose}></div>
      <aside className={`sidebar ${isOpen ? "open" : ""}`}>
        <div className="sidebar-header">
          <h3>Main Menu</h3>
          <button className="close-sidebar" onClick={onClose}>X</button>
        </div>
        <ul>
          <li><Link to="/predict" onClick={onClose}>Predict</Link></li>
          <li><Link to="/results" onClick={onClose}>Results</Link></li>
          <li><Link to="/profile" onClick={onClose}>Student Profile</Link></li>
          <li><Link to="/upload" onClick={onClose}>Upload CSV</Link></li>
          {user?.role === "admin" && (
            <li><Link to="/register-user" onClick={onClose}>Register User</Link></li>
          )}
          <li><Link to="/about" onClick={onClose}>About</Link></li>
        </ul>
      </aside>
    </>
  );
}

export default Sidebar;
