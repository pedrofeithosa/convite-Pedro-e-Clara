import { useEffect, useState } from "react";

const LINKS = [
  { id: "inicio", label: "Início" },
  { id: "historia", label: "Nossa história" },
  { id: "evento", label: "Evento" },
  { id: "presentes", label: "Presentes" },
  { id: "presenca", label: "Presença" },
];

export function Nav() {
  const [active, setActive] = useState("inicio");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(entry.target.id);
        });
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    LINKS.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  const go = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/85 backdrop-blur-md md:inset-x-auto md:bottom-auto md:top-0 md:right-0 md:left-0 md:border-t-0 md:border-b">
      <ul className="mx-auto flex max-w-3xl items-center justify-between px-3 py-2.5 md:justify-center md:gap-10 md:py-4">
        {LINKS.map((link) => (
          <li key={link.id}>
            <button
              type="button"
              onClick={() => go(link.id)}
              className={`text-[0.6rem] tracking-[0.18em] uppercase transition-colors md:text-[0.65rem] md:tracking-[0.24em] ${
                active === link.id ? "text-accent" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {link.label}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
