import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function HeroPage() {
  const [inputUsername, setInputUsername] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputUsername.trim()) {
      navigate(`/editor/${inputUsername.trim().toLowerCase()}`);
    }
  };

  return (
    <div className="relative h-[calc(100vh-65px)] w-full overflow-hidden grid grid-cols-1 lg:grid-cols-2 bg-base-300">
      {/* ═══ LEFT HALF: HERO CONTENT ═══ */}
      <div className="flex flex-col justify-center items-start px-8 lg:px-16 z-10 max-w-xl mx-auto lg:mx-0">
        {/* Badge */}
        <div className="badge badge-primary badge-outline gap-2 p-3 font-semibold uppercase tracking-widest text-xs shadow-lg mb-4">
          ⚡ Pure Neon Vector Cards
        </div>

        {/* Title */}
        <h1 className="text-4xl lg:text-5xl font-black tracking-tight text-left leading-tight">
          Transform Your Profile with{" "}
          <span className="text-primary">Neon Cards</span>
        </h1>

        {/* Subtitle */}
        <p className="py-4 text-base opacity-80 text-left">
          Generate live, cached neon widgets for your profile README. Simple,
          automated, and styled for maximum impact.
        </p>

        {/* Form Input */}
        <form
          onSubmit={handleSubmit}
          className="flex flex-col sm:flex-row gap-3 w-full "
        >
          <input
            type="text"
            placeholder="Enter GitHub Username..."
            className="input input-bordered input-primary w-full text-base shadow-inner"
            value={inputUsername}
            onChange={(e) => setInputUsername(e.target.value)}
            required
          />
          <button
            type="submit"
            className="btn btn-primary text-base px-6 shadow-lg shadow-primary/30"
          >
            Generate 🚀
          </button>
        </form>
      </div>

      {/* ═══ RIGHT HALF: TEMPLATE STACK (ALL 5 IN ONE COLUMN) ═══ */}
      <div className="relative hidden lg:flex flex-col justify-center items-center p-1 gap-6 overflow-hidden bg-base-200/40 border-l border-base-300">
        {/* Top/Bottom Ambient Fade Masks */}
        
        {/* The 5 Templates Column */}
        <div className="w-full max-w-md flex flex-col gap-9 transform transition-all hover:scale-100 duration-500">
          <img
            src="/templates/card1-identity.svg"
            alt="Identity Card"
            className="w-full  hover:scale-125"
          />
          <img
            src="/templates/card2-stats.svg"
            alt="Stats Card"
            className="w-full  hover:scale-125"
          />
          <img
            src="/templates/card3-quest-log.svg"
            alt="Quest Log Card"
            className="w-full  hover:scale-125"
          />
          <img
            src="/templates/card4-tech-stack.svg"
            alt="Tech Stack Card"
            className="w-full  hover:scale-125"
          />
          <img
            src="/templates/card5-footer.svg"
            alt="Footer Card"
            className="w-full hover:scale-125"
          />
        </div>
      </div>
    </div>
  );
}
