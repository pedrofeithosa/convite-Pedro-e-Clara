import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatBRL, isPlaceholder, whatsappLink, type GiftRow } from "@/lib/invite";

const schema = z.object({
  name: z.string().trim().min(2, "Informe seu nome").max(100),
  whatsapp: z.string().trim().min(8, "Informe um WhatsApp válido").max(30),
});

type Props = {
  gift: GiftRow | null;
  hostWhatsapp?: string | null;
  onClose: () => void;
  onReserved: () => void;
};

export function GiftDialog({ gift, hostWhatsapp, onClose, onReserved }: Props) {
  const [form, setForm] = useState({ name: "", whatsapp: "" });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (gift) {
      setForm({ name: "", whatsapp: "" });
      setError(null);
      setSuccess(false);
    }
  }, [gift]);

  if (!gift) return null;

  const isQuota = gift.gift_type === "cotas";
  const amount = isQuota ? Number(gift.quota_value) : Number(gift.price);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!gift) return;
    setError(null);
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Verifique os dados");
      return;
    }
    setLoading(true);
    const { error: rpcError } = await supabase.rpc("reserve_gift", {
      p_gift_id: gift.id,
      p_name: parsed.data.name,
      p_whatsapp: parsed.data.whatsapp,
    });
    setLoading(false);
    if (rpcError) {
      setError(
        rpcError.message.includes("já reservado")
          ? "Alguém acabou de reservar. Escolha outro presente."
          : "Não conseguimos reservar agora. Tente novamente.",
      );
      onReserved();
      return;
    }
    setSuccess(true);
    onReserved();
  }

  const message = isQuota
    ? `Olá, Pedro! Sou ${form.name} e reservei uma cota de ${formatBRL(amount)} do presente "${gift.name}" no Chá de Casa Nova.`
    : `Olá, Pedro! Sou ${form.name} e vou presentear vocês com "${gift.name}" no Chá de Casa Nova.`;

  return (
    <Dialog open={!!gift} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="rounded-none border-border sm:max-w-md">
        {success ? (
          <div className="py-4 text-center">
            <p className="eyebrow">{isQuota ? "Cota reservada!" : "Presente reservado!"}</p>
            <h3 className="mt-4 font-serif text-3xl">{gift.name}</h3>
            <p className="mx-auto mt-3 max-w-xs text-sm leading-relaxed text-muted-foreground">
              Obrigado pelo carinho. Agora é só combinar os detalhes com o Pedro.
            </p>
            {isPlaceholder(hostWhatsapp) ? (
              <p className="mt-6 text-xs text-muted-foreground">
                WhatsApp de contato ainda não configurado.
              </p>
            ) : (
              <a
                href={whatsappLink(hostWhatsapp as string, message)}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-flex w-full items-center justify-center bg-accent px-6 py-4 text-xs tracking-[0.2em] text-accent-foreground uppercase"
              >
                Falar com Pedro no WhatsApp
              </a>
            )}
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="font-serif text-2xl font-light">{gift.name}</DialogTitle>
            </DialogHeader>
            {(isQuota || amount > 0) && (
              <p className="text-sm text-muted-foreground">
                {isQuota ? `Contribuição de ${formatBRL(amount)}` : formatBRL(amount)}
              </p>
            )}
            <form onSubmit={submit} className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor="gift-name">Nome</Label>
                <Input
                  id="gift-name"
                  value={form.name}
                  maxLength={100}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gift-phone">WhatsApp</Label>
                <Input
                  id="gift-phone"
                  inputMode="tel"
                  placeholder="(00) 00000-0000"
                  value={form.whatsapp}
                  maxLength={30}
                  onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button
                type="submit"
                disabled={loading}
                className="w-full rounded-none py-6 tracking-[0.2em] uppercase"
              >
                {loading ? "Reservando..." : "Confirmar reserva"}
              </Button>
              <p className="text-center text-[0.7rem] leading-relaxed text-muted-foreground">
                Nenhum pagamento é feito aqui. A reserva é registrada e combinada pelo WhatsApp.
              </p>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
