import { useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const schema = z.object({
  name: z.string().trim().min(2, "Informe seu nome").max(100),
  whatsapp: z.string().trim().min(8, "Informe um WhatsApp válido").max(30),
  people_count: z.number().int().min(1).max(20),
  note: z.string().trim().max(500).optional(),
});

export function RsvpForm() {
  const [form, setForm] = useState({ name: "", whatsapp: "", people_count: 1, note: "" });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Verifique os dados");
      return;
    }
    setLoading(true);
    const { error: dbError } = await supabase.from("guests").insert({
      name: parsed.data.name,
      whatsapp: parsed.data.whatsapp,
      people_count: parsed.data.people_count,
      note: parsed.data.note || null,
    });
    setLoading(false);
    if (dbError) {
      setError("Não conseguimos registrar agora. Tente novamente.");
      return;
    }
    setDone(true);
  }

  if (done) {
    return (
      <div className="soft-card reveal px-6 py-12 text-center">
        <p className="eyebrow">Presença confirmada</p>
        <h3 className="mt-4 font-serif text-3xl">Que alegria ter você com a gente</h3>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">
          Já anotamos seu nome na nossa lista. Nos vemos em 17 de outubro de 2026.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="soft-card space-y-5 p-6 md:p-8">
      <div className="space-y-2">
        <Label htmlFor="rsvp-name">Nome</Label>
        <Input
          id="rsvp-name"
          value={form.name}
          maxLength={100}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="rsvp-phone">WhatsApp</Label>
        <Input
          id="rsvp-phone"
          inputMode="tel"
          placeholder="(00) 00000-0000"
          value={form.whatsapp}
          maxLength={30}
          onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="rsvp-people">Quantidade de pessoas</Label>
        <Input
          id="rsvp-people"
          type="number"
          min={1}
          max={20}
          value={form.people_count}
          onChange={(e) => setForm({ ...form, people_count: Number(e.target.value) })}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="rsvp-note">Observação (opcional)</Label>
        <Textarea
          id="rsvp-note"
          rows={3}
          maxLength={500}
          value={form.note}
          onChange={(e) => setForm({ ...form, note: e.target.value })}
        />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={loading} className="w-full rounded-none py-6 tracking-[0.2em] uppercase">
        {loading ? "Enviando..." : "Confirmar presença"}
      </Button>
    </form>
  );
}
