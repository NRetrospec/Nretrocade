import { useNavigate } from "react-router-dom";

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div
      className="relative flex items-center justify-center h-screen bg-cover bg-center bg-no-repeat overflow-hidden"
      style={{ backgroundImage: "url('/landing-image.png')" }}
    >
      <div className="bg-black/20 backdrop-blur-sm rounded-lg p-11 text-center z-21 landing-overlay">
        <h1 className="text-6xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent mb-4 pixel-font landing-title">
          N RETROSPEC
        </h1>
        <p className="text-cyan-300 text-lg mb-8 landing-subtitle">Enter the Retro Gaming Universe</p>
        <button
          className="bg-transparent border-2 border-cyan-400 text-cyan-400 px-8 py-4 rounded-lg text-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-cyan-400/50 hover:bg-cyan-400 hover:text-black glow-effect z-30 landing-button"
          onClick={() => navigate("/main")}
        >
          Enter
        </button>
      </div>
      <img
        src="/FLASH-MACHINE.png"
        alt="Flash Machine"
        className="absolute -right-96 top-0 h-1/1 w-auto animate__animated animate__fadeInRight z-20 object-contain pointer-events-none flash-machine"
        style={{ maxWidth: '100%' }}
      />
    </div>
  );
}
