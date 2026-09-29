import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import heroImage from "@/assets/hero-couple.jpg";
import homeImage from "@/assets/story-couple.jpg";
import { Nav } from "@/components/invite/Nav";
import { Countdown } from "@/components/invite/Countdown";
import { RsvpForm } from "@/components/invite/RsvpForm";
import { GiftsSection } from "@/components/invite/GiftsSection";
import { fetchEvent, formatLongDate, isPlaceholder } from "@/lib/invite";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Chá de Casa Nova · Pedro & Clara · 17.10.2026" },
      {
        name: "description",
        content:
          "Convite digital do Chá de Casa Nova de Pedro & Clara. Confirme sua presença e veja a lista de presentes.",
      },
      { property: "og:title", content: "Chá de Casa Nova · Pedro & Clara" },
      {
        property: "og:description",
        content: "Uma nova casa, uma nova história. 17 de outubro de 2026.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Invite,
});

function Section({
  id,
  children,
  className = "",
}: {
  id: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section id={id} className={`scroll-mt-20 px-6 py-24 md:py-36 ${className}`}>
      <div className="mx-auto w-full max-w-2xl">{children}</div>
    </section>
  );
}

function Invite() {
  const { data: event } = useQuery({ queryKey: ["event"], queryFn: fetchEvent });

  const scrollTo = (id: string) =>
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <main className="pb-14 md:pt-14 md:pb-0">
      <Nav />

      <section id="inicio" className="relative flex min-h-[100svh] items-center overflow-hidden">
        <img
          src={heroImage}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full scale-110 object-cover object-top blur-2xl brightness-75"
        />
        <img
          src={heroImage}
          alt="Pedro e Clara"
          width={1086}
          height={1448}
          className="absolute inset-0 mx-auto h-full w-full object-contain"
        />
        <div className="absolute inset-0" style={{ background: "var(--gradient-veil)" }} />
        <div className="relative w-full px-6 pb-14 text-center md:pb-20">
          <p
            className="eyebrow reveal text-[color:var(--ivory)]/80"
            style={{ animationDelay: "0.1s" }}
          >
            Chá de Casa Nova
          </p>
          <h1
            className="reveal mt-6 font-serif text-5xl leading-[0.95] text-[color:var(--ivory)] md:text-8xl"
            style={{ animationDelay: "0.25s" }}
          >
            Pedro
            <span className="mx-3 text-[color:var(--champagne)]">&</span>
            Clara
          </h1>
          <p
            className="reveal mt-6 font-serif text-lg text-[color:var(--ivory)]/90 italic"
            style={{ animationDelay: "0.4s" }}
          >
            “Uma nova casa, uma nova história.”
          </p>
          <p
            className="reveal mt-8 text-[0.7rem] tracking-[0.42em] text-[color:var(--ivory)]/80"
            style={{ animationDelay: "0.55s" }}
          >
            17 • 10 • 2026
          </p>
          <button
            type="button"
            onClick={() => scrollTo("historia")}
            className="reveal mt-12 border border-[color:var(--ivory)]/50 px-10 py-4 text-[0.65rem] tracking-[0.28em] text-[color:var(--ivory)] uppercase transition-colors hover:bg-[color:var(--ivory)] hover:text-foreground"
            style={{ animationDelay: "0.7s" }}
          >
            Entrar no convite
          </button>
        </div>
      </section>

      <Section id="historia">
        <p className="eyebrow">Nossa nova fase</p>
        <h2 className="mt-5 font-serif text-4xl leading-tight md:text-5xl">
          Uma nova fase começa aqui
        </h2>
        <p className="mt-6 text-sm leading-loose text-muted-foreground">
          {event?.story_text ??
            "Depois de muitos planos, encontramos o lugar que vamos chamar de lar."}
        </p>
        <img
          src={homeImage}
          alt="Pedro e Clara no nosso cantinho"
          loading="lazy"
          width={1086}
          height={1448}
          className="mt-12 w-full object-cover"
        />
      </Section>

      <Section id="evento" className="bg-[color:var(--sand)]/40">
        <p className="eyebrow">O encontro</p>
        <h2 className="mt-5 font-serif text-4xl leading-tight md:text-5xl">Vamos comemorar?</h2>
        <dl className="mt-10 divide-y divide-border border-y border-border">
          {[
            { term: "Data", value: event ? formatLongDate(event.event_date) : "17 de outubro de 2026" },
            { term: "Horário", value: event?.event_time },
            { term: "Local", value: event?.location_name },
            { term: "Endereço", value: event?.address },
          ].map((row) => (
            <div key={row.term} className="flex items-baseline justify-between gap-6 py-5">
              <dt className="eyebrow">{row.term}</dt>
              <dd
                className={`text-right text-sm ${isPlaceholder(row.value) ? "text-muted-foreground italic" : ""}`}
              >
                {row.value ?? "a definir"}
              </dd>
            </div>
          ))}
        </dl>
        {!isPlaceholder(event?.maps_url) && (
          <a
            href={event?.maps_url as string}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 inline-flex w-full items-center justify-center border border-foreground/20 py-4 text-[0.65rem] tracking-[0.22em] uppercase transition-colors hover:bg-foreground hover:text-background"
          >
            Ver localização no mapa
          </a>
        )}
        <div className="mt-16">
          <p className="eyebrow mb-6 text-center">Contagem regressiva</p>
          <Countdown />
        </div>
      </Section>

      <Section id="presentes">
        <p className="eyebrow">Lista de presentes</p>
        <h2 className="mt-5 font-serif text-4xl leading-tight md:text-5xl">
          Se quiser nos presentear...
        </h2>
        <p className="mt-6 text-sm leading-loose text-muted-foreground">
          {event?.gifts_text ??
            "Presentear é opcional — o mais importante é a sua presença."}
        </p>
        <div className="mt-12">
          <GiftsSection event={event} />
        </div>
      </Section>

      <Section id="presenca" className="bg-[color:var(--sand)]/40">
        <p className="eyebrow">RSVP</p>
        <h2 className="mt-5 font-serif text-4xl leading-tight md:text-5xl">
          Você vem celebrar com a gente?
        </h2>
        <div className="mt-10">
          <RsvpForm />
        </div>
      </Section>

      <footer className="px-6 py-28 text-center">
        <p className="font-serif text-2xl leading-relaxed md:text-3xl">
          Obrigado por fazer parte desse momento.
        </p>
        <p className="mt-8 font-serif text-xl text-accent">Pedro &amp; Clara</p>
        <p className="mt-4 text-[0.65rem] tracking-[0.4em] text-muted-foreground">17 • 10 • 2026</p>
      </footer>
    </main>
  );
}
