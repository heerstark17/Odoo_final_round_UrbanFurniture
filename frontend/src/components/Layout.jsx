import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

function Layout({ children }) {
  return (
    <div className="d-flex" style={{ height: "100vh", overflow: "hidden" }}>
      
      <Sidebar />

      
      <div className="d-flex flex-column flex-grow-1" style={{ minWidth: 0 }}>
        <Navbar />

        <div
          className="flex-grow-1 p-3 p-md-4 bg-light"
          style={{ overflowY: "auto" }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

export default Layout;