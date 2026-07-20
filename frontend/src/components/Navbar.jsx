export default function Navbar() {
  return (
    <div className="navbar bg-base-100 shadow-sm border-b border-base-300">
      <div className="flex-1">
        <a className="btn btn-ghost text-xl">GitHub Neon Stats Cards</a>
      </div>
      <div className="flex-none">
        <a
          href="https://github.com/pkbros/GithubReadmeStatsV2"
          target="_blank"
          rel="noreferrer"
          className="btn btn-ghost"
        >
          GitHub
        </a>
      </div>
    </div>
  );
}
