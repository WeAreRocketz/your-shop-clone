import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import logoAsset from "@/assets/shop2shops-logo.png.asset.json";
import {
  fetchAddressByCEP,
  isValidCEP,
  isValidCNPJ,
  isValidCPF,
  isValidPhoneBR,
  maskCEP,
  maskCNPJ,
  maskCPF,
  maskPhoneBR,
  onlyDigits,
} from "@/lib/br-validators";

export const Route = createFileRoute("/signup")({
  head: () => ({ meta: [{ title: "Criar conta — Shop2Shops" }, { name: "description", content: "Crie sua conta no Shop2Shops e comece o trial de 5 dias grátis." }] }),
  validateSearch: (s: Record<string, unknown>) => ({ plan: typeof s.plan === "string" ? s.plan : undefined }),
  component: SignupPage,
});

function SignupPage() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const [personType, setPersonType] = useState<"pf" | "pj">("pf");
  const [name, setName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [document, setDocument] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [cep, setCep] = useState("");
  const [street, setStreet] = useState("");
  const [number, setNumber] = useState("");
  const [complement, setComplement] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [city, setCity] = useState("");
  const [stateUf, setStateUf] = useState("");
  const [loading, setLoading] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);

  const docError = useMemo(() => {
    if (!document) return null;
    if (personType === "pf" && !isValidCPF(document)) return "CPF inválido";
    if (personType === "pj" && !isValidCNPJ(document)) return "CNPJ inválido";
    return null;
  }, [document, personType]);

  useEffect(() => {
    if (!isValidCEP(cep)) return;
    setCepLoading(true);
    fetchAddressByCEP(cep).then((a) => {
      setCepLoading(false);
      if (!a) return;
      if (a.street) setStreet(a.street);
      if (a.neighborhood) setNeighborhood(a.neighborhood);
      if (a.city) setCity(a.city);
      if (a.state) setStateUf(a.state);
    });
  }, [cep]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!name.trim()) return toast.error("Informe seu nome completo");
    if (personType === "pj" && !companyName.trim()) return toast.error("Informe a razão social");
    if (personType === "pf" && !isValidCPF(document)) return toast.error("CPF inválido");
    if (personType === "pj" && !isValidCNPJ(document)) return toast.error("CNPJ inválido");
    if (!isValidPhoneBR(whatsapp)) return toast.error("WhatsApp inválido");
    if (!isValidCEP(cep)) return toast.error("CEP inválido");
    if (!street.trim() || !number.trim() || !city.trim() || !stateUf.trim()) {
      return toast.error("Preencha o endereço completo");
    }

    setLoading(true);
    const { data: signUpData, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
        emailRedirectTo: `${window.location.origin}/onboarding`,
      },
    });
    if (error) {
      setLoading(false);
      toast.error(error.message);
      return;
    }

    const userId = signUpData.user?.id;
    if (userId) {
      await supabase.from("profiles").upsert({
        id: userId,
        email,
        name,
        person_type: personType,
        company_name: personType === "pj" ? companyName : null,
        document: onlyDigits(document),
        whatsapp: onlyDigits(whatsapp),
        address_street: street,
        address_number: number,
        address_complement: complement || null,
        address_neighborhood: neighborhood,
        address_city: city,
        address_state: stateUf,
        address_zip: onlyDigits(cep),
      });
    }

    setLoading(false);
    toast.success("Conta criada! Bem-vindo ao Shop2Shops.");
    navigate({ to: "/onboarding" });
  }

  return (
    <AuthShell title="Criar sua conta" subtitle="Cadastro completo • 3 dias grátis • Sem cartão de crédito">
      {search.plan && (
        <div className="mb-5 rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm">
          Você selecionou o plano <strong className="text-primary">{search.plan}</strong>. Conclua o cadastro para liberar.
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-5">
        <section className="space-y-3">
          <Label className="text-xs uppercase tracking-wide text-muted-foreground">Tipo de conta</Label>
          <RadioGroup
            value={personType}
            onValueChange={(v) => setPersonType(v as "pf" | "pj")}
            className="grid grid-cols-2 gap-2"
          >
            <label className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm ${personType === "pf" ? "border-primary bg-primary/10" : "border-border/60"}`}>
              <RadioGroupItem value="pf" id="pf" />
              Pessoa Física
            </label>
            <label className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm ${personType === "pj" ? "border-primary bg-primary/10" : "border-border/60"}`}>
              <RadioGroupItem value="pj" id="pj" />
              Pessoa Jurídica
            </label>
          </RadioGroup>
        </section>

        <section className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="name">{personType === "pj" ? "Nome do responsável" : "Nome completo"}</Label>
            <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Como devemos te chamar" />
          </div>
          {personType === "pj" && (
            <div className="space-y-2">
              <Label htmlFor="company">Razão social</Label>
              <Input id="company" required value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Nome da empresa" />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="doc">{personType === "pf" ? "CPF" : "CNPJ"}</Label>
            <Input
              id="doc"
              required
              value={document}
              onChange={(e) => setDocument(personType === "pf" ? maskCPF(e.target.value) : maskCNPJ(e.target.value))}
              placeholder={personType === "pf" ? "000.000.000-00" : "00.000.000/0000-00"}
              inputMode="numeric"
            />
            {docError && <p className="text-xs text-destructive">{docError}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="whatsapp">WhatsApp</Label>
            <Input
              id="whatsapp"
              required
              value={whatsapp}
              onChange={(e) => setWhatsapp(maskPhoneBR(e.target.value))}
              placeholder="(11) 99999-9999"
              inputMode="tel"
            />
          </div>
        </section>

        <section className="space-y-3">
          <Label className="text-xs uppercase tracking-wide text-muted-foreground">Endereço</Label>
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-1 space-y-2">
              <Label htmlFor="cep" className="text-xs">CEP</Label>
              <Input id="cep" required value={cep} onChange={(e) => setCep(maskCEP(e.target.value))} placeholder="00000-000" inputMode="numeric" />
            </div>
            <div className="col-span-2 space-y-2">
              <Label htmlFor="street" className="text-xs">Rua {cepLoading && <span className="text-muted-foreground">· buscando...</span>}</Label>
              <Input id="street" required value={street} onChange={(e) => setStreet(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label htmlFor="number" className="text-xs">Número</Label>
              <Input id="number" required value={number} onChange={(e) => setNumber(e.target.value)} />
            </div>
            <div className="col-span-2 space-y-2">
              <Label htmlFor="complement" className="text-xs">Complemento</Label>
              <Input id="complement" value={complement} onChange={(e) => setComplement(e.target.value)} placeholder="Opcional" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="neighborhood" className="text-xs">Bairro</Label>
            <Input id="neighborhood" required value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2 space-y-2">
              <Label htmlFor="city" className="text-xs">Cidade</Label>
              <Input id="city" required value={city} onChange={(e) => setCity(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state" className="text-xs">UF</Label>
              <Input id="state" required maxLength={2} value={stateUf} onChange={(e) => setStateUf(e.target.value.toUpperCase())} />
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <Label className="text-xs uppercase tracking-wide text-muted-foreground">Acesso</Label>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@empresa.com" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input id="password" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mínimo 6 caracteres" />
          </div>
        </section>

        <Button type="submit" className="w-full" disabled={loading}>{loading ? "Criando conta..." : "Criar conta e começar trial"}</Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Já tem conta? <Link to="/login" className="text-primary hover:underline">Entrar</Link>
      </p>
    </AuthShell>
  );
}

export function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="gradient-hero flex min-h-screen items-center justify-center px-6 py-12">
      <div className="w-full max-w-lg">
        <Link to="/" className="mb-8 flex flex-col items-center gap-3">
          <img src={logoAsset.url} alt="Shop2Shops" className="h-16 w-auto md:h-20" />
          <p className="flex items-center gap-2 text-xs font-medium tracking-wide text-muted-foreground">
            <span>Conecte</span>
            <span className="h-1 w-1 rounded-full bg-primary shadow-[0_0_6px_var(--color-primary)]" />
            <span>Gerencie</span>
            <span className="h-1 w-1 rounded-full bg-primary shadow-[0_0_6px_var(--color-primary)]" />
            <span>Escale</span>
          </p>
        </Link>
        <Card className="border-border/60 bg-card p-8">
          <h1 className="text-2xl font-semibold">{title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
          <div className="mt-6">{children}</div>
        </Card>
      </div>
    </div>
  );
}
