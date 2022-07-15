import { Link, Outlet } from "@remix-run/react";

export default function DashboardRoute() {
  return (
    <div className="flex h-screen flex-col">
      <header className="h-14 p-4">
        <Link to="/dashboard" className="font-black">
          Localizard
        </Link>
      </header>
      <main className="flex-1 bg-gray-100 p-4">
        <Outlet />
      </main>
      <footer className="flex flex-col items-center justify-center p-4">
        <p className="text-sm font-bold uppercase">Emilio Schepis 2022</p>
        <div className="mt-1 flex">
          <a href="https://github.com/emilioschepis/localizard">GitHub</a>
          <div aria-hidden className="mx-1">
            &bull;
          </div>
          <a href="https://twitter.com/emilioschepis">Twitter</a>
        </div>
      </footer>
    </div>
  );
}
