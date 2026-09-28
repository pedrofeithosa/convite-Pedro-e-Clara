import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { GiftDialog } from "./GiftDialog";
import { CATEGORIES, fetchGifts, formatBRL, type EventRow, type GiftRow } from "@/lib/invite";

export function GiftsSection({ event }: { event?: EventRow | null }) {
  const [category, setCategory] = useState<string>("Todos");
  const [term, setTerm] = useState("");
  const [selected, setSelected] = useState<GiftRow | null>(null);

  const { data: gifts = [], refetch } = useQuery({ queryKey: ["gifts"], queryFn: fetchGifts });

  const filtered = useMemo(() => {
    const q = term.trim().toLowerCase();
    return gifts.filter((gift) => {
      const matchCategory = category === "Todos" || gift.category === category;
      const matchTerm =
        !q ||
        gift.name.toLowerCase().includes(q) ||
        (gift.description ?? "").toLowerCase().includes(q);
      return matchCategory && matchTerm;
    });
  }, [gifts, category, term]);

  const categories = useMemo(
  () => [
    "Todos",
    ...CATEGORIES.filter((c) => c !== "Todos" && gifts.some((g) => g.category === c)),
  ],
  [gifts],
);

  return (
    <div>
      <div className="flex flex-col gap-4">
        <Input
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="Buscar presente"
          className="rounded-none border-0 border-b border-border bg-transparent px-0 shadow-none focus-visible:ring-0"
        />
        <div className="-mx-6 flex gap-6 overflow-x-auto px-6 pb-1 md:mx-0 md:flex-wrap md:px-0">
          {categories.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setCategory(item)}
              className={`shrink-0 text-[0.62rem] tracking-[0.2em] whitespace-nowrap uppercase transition-colors ${
                category === item ? "text-accent" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-10 grid gap-5 md:grid-cols-2">
        {filtered.map((gift) => {
          const isQuota = gift.gift_type === "cotas";
          const remaining = gift.total_quotas - gift.reserved_quotas;
          const taken = remaining <= 0;
          return (
            <article key={gift.id} className="soft-card flex flex-col p-6">
              <h3 className="font-serif text-2xl">{gift.name}</h3>
              {gift.description && (
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {gift.description}
                </p>
              )}
              {(isQuota || Number(gift.price) > 0) && (
  <div className="mt-5 flex items-baseline justify-between border-t border-border pt-4">
    <span className="text-sm">{formatBRL(Number(gift.price))}</span>
    {isQuota && (
      <span className="text-[0.65rem] tracking-[0.15em] text-muted-foreground uppercase">
        {gift.total_quotas} cotas de {formatBRL(Number(gift.quota_value))}
      </span>
    )}
  </div>
)}
              {isQuota && (
                <div className="mt-4">
                  <div className="h-px w-full bg-border">
                    <div
                      className="h-px bg-accent"
                      style={{ width: `${(gift.reserved_quotas / gift.total_quotas) * 100}%` }}
                    />
                  </div>
                  <p className="mt-2 text-[0.65rem] tracking-[0.15em] text-muted-foreground uppercase">
                    {remaining} de {gift.total_quotas} cotas disponíveis
                  </p>
                </div>
              )}
              <button
                type="button"
                disabled={taken}
                onClick={() => setSelected(gift)}
                className="mt-6 w-full border border-foreground/20 py-3.5 text-[0.65rem] tracking-[0.22em] uppercase transition-colors enabled:hover:bg-foreground enabled:hover:text-background disabled:cursor-not-allowed disabled:border-border disabled:text-muted-foreground"
              >
                {taken
                  ? "Já reservado"
                  : isQuota
                    ? `Contribuir com ${formatBRL(Number(gift.quota_value))}`
                    : "Vou presentear com isso"}
              </button>
            </article>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <p className="mt-12 text-center text-sm text-muted-foreground">
          Nenhum presente encontrado nessa busca.
        </p>
      )}

      <GiftDialog
        gift={selected}
        hostWhatsapp={event?.whatsapp}
        onClose={() => setSelected(null)}
        onReserved={() => void refetch()}
      />
    </div>
  );
}
