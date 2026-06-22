import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Shield } from "@/components/icon";
import logoAsset from "@/assets/shop2shops-logo.png.asset.json";

export const Route = createFileRoute("/report-abuse")({
  head: () => ({
    meta: [
      { title: "Relatar Abuso — Shop2Shops" },
      { name: "description", content: "Denuncie uso indevido, fraude, golpe ou violação de direitos envolvendo a plataforma Shop2Shops." },
      { property: "og:title", content: "Relatar Abuso — Shop2Shops" },
      { property: "og:description", content: "Canal oficial para reportar abusos e violações." },
      { property: "og:url", content: "/report-abuse" },
    ],
    links: [{ rel: "canonical", href: "/report-abuse" }],
  }),
  component: ReportAbusePage,
});

const CATEGORIES = [
  "Fraude / golpe",
  "Produto ilegal ou proibido",
  "Violação de marca / direitos autorais",
  "Spam / phishing",
  "Conteúdo ofensivo",
  "Vazamento de dados pessoais",
  "Outro",
] as const;

const schema = z.object({
  reporter_name: z.string().trim().min(1, "Informe seu nome").max(120),
  reporter_email: z.string().trim().email("E-mail inválido").max(255),
  target_url: z.string().trim().max(500).optional().or(z.literal("")),
  category: z.enum(CATEGORIES, { message: "Selecione uma categoria" }),
  description: z.string().trim().min(10, "Descreva com pelo menos 10 caracteres").max(4000),
});

function ReportAbusePage() {
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors({});
    const fd = new FormData(e.currentTarget);
    const raw = {
      reporter_name: String(fd.get("reporter_name") ?? ""),
      reporter_email: String(fd.get("reporter_email") ?? ""),
      target_url: String(fd.get("target_url") ?? ""),
      category: String(fd.get("category") ?? ""),
      description: String(fd.get("description") ?? ""),
    };
    const parsed = schema.safeParse(raw);
    if (!parsed.success) {
      const fe: Record<string, string> = {};
      for (const issue of parsed.error.issues) fe[String(issue.path[0])] = issue.message;
      setErrors(fe);
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("abuse_reports").insert({
      reporter_name: parsed.data.reporter_name,
      reporter_email: parsed.data.reporter_email,
      target_url: parsed.data.target_url ? parsed.data.target_url : null,
      category: parsed.data.category,
      description: parsed.data.description,
    });
    setSubmitting(false);
    if (error) {
      toast.error("Não foi possível enviar sua denúncia. Tente novamente.");
      return;
    }
    setDone(true);
    toast.success("Denúncia recebida. Obrigado por nos avisar.");
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/40">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-6">
          <Link to="/" className="flex items-center gap-2">
            <img src={logoAsset.url} alt="Shop2Shops" className="h-8 w-auto object-contain" />
          </Link>
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-primary">
            <ArrowLeft className="h-4 w-4" /> Voltar ao site
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-6 py-14">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-accent/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.15em] text-accent ring-1 ring-accent/30">
          <Shield className="h-3.5 w-3.5" /> Canal oficial
        </div>
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Relatar abuso</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Use este formulário para denunciar fraudes, golpes, conteúdo ilegal ou violações envolvendo a plataforma Shop2Shops. Toda denúncia é analisada por nosso time.
        </p>

        {done ? (
          <div className="mt-10 rounded-2xl border border-border/60 bg-card/50 p-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent/20 text-accent">
              <Shield className="h-6 w-6" />
            </div>
            <h2 className="mt-4 text-xl font-semibold">Denúncia recebida</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Obrigado por nos avisar. Caso precisemos de mais detalhes, entraremos em contato pelo e-mail informado.
            </p>
            <Button asChild className="mt-6">
              <Link to="/">Voltar para a Shop2Shops</Link>
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-10 space-y-5 rounded-2xl border border-border/60 bg-card/40 p-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="reporter_name">Seu nome</Label>
                <Input id="reporter_name" name="reporter_name" maxLength={120} required />
                {errors.reporter_name && <p className="text-xs text-destructive">{errors.reporter_name}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="reporter_email">Seu e-mail</Label>
                <Input id="reporter_email" name="reporter_email" type="email" maxLength={255} required />
                {errors.reporter_email && <p className="text-xs text-destructive">{errors.reporter_email}</p>}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="target_url">URL ou loja relacionada (opcional)</Label>
              <Input id="target_url" name="target_url" placeholder="https://..." maxLength={500} />
              {errors.target_url && <p className="text-xs text-destructive">{errors.target_url}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Categoria</Label>
              <Select name="category" required>
                <SelectTrigger id="category"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
              {errors.category && <p className="text-xs text-destructive">{errors.category}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descreva o ocorrido</Label>
              <Textarea id="description" name="description" rows={6} maxLength={4000} required placeholder="Conte o que aconteceu, datas e qualquer evidência relevante." />
              {errors.description && <p className="text-xs text-destructive">{errors.description}</p>}
            </div>
            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? "Enviando..." : "Enviar denúncia"}
            </Button>
            <p className="text-xs text-muted-foreground">
              Ao enviar, você concorda com a nossa <Link to="/legal/privacidade" className="text-primary hover:underline">Política de Privacidade</Link>. Não compartilhamos seus dados com o denunciado.
            </p>
          </form>
        )}
      </main>
    </div>
  );
}