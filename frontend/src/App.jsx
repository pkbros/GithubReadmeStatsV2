import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import HeroPage from "./components/HeroPage";
import EditorPage from "./components/EditorPage";

const App = () => {
  return (
    <div className="min-h-screen bg-base-300 text-base-content flex flex-col font-sans">
      <Navbar />
      <Routes>
        <Route path="/" element={<HeroPage />} />
        <Route path="/editor/:username" element={<EditorPage />} />
      </Routes>
    </div>
  );
};

export default App;
