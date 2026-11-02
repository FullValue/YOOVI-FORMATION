"use client";
import { useState } from "react";
import { Check, Copy, Mail, Send } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { SelectField, TextArea, TextField } from "@/components/ui/Field";
import { useToast } from "@/components/ui/Toast";

const SUBJECT = "Demande d'assistance — Formation Yoovi";

/** Prépare un e-mail prérempli et ouvre le logiciel de messagerie de l'utilisateur (pas de chat interne). */
export function SupportForm({ email, user, modules }: {
  email: string;
  user: { name: string; email: string; org: string | null };
  modules: string[];
}) {
  const [topic, setTopic] = useState("Question sur une formation");
  const [module, setModule] = useState("");
  const [message, setMessage] = useState("");
  const [copied, setCopied] = useState(false);
  const toast = useToast();

  const body = [
    "Bonjour l'équipe Yoovi,",
    "",
    message.trim() || "[Décrivez votre demande ici]",
    "",
    "—",
    `Type de demande : ${topic}`,
    module ? `Module concerné : ${module}` : null,
    `Nom : ${user.name}`,
    user.org ? `Organisme : ${user.org}` : null,
    `Adresse du compte : ${user.email}`,
  ].filter((l) => l !== null).join("\n");

  const href = `mailto:${email}?subject=${encodeURIComponent(`${SUBJECT}${topic ? ` — ${topic}` : ""}`)}&body=${encodeURIComponent(body)}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      toast("success", "Adresse copiée dans le presse-papiers.");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast("error", "Copie impossible : sélectionnez l'adresse manuellement.");
    }
  }

  return (
    <form
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        window.location.href = href;
        toast("success", "Votre messagerie s'ouvre avec la demande préremplie.");
      }}
    >
      <div className="grid gap-5 xl:grid-cols-2">
        <SelectField label="Type de demande" name="topic" value={topic} onChange={(e) => setTopic(e.target.value)}>
          <option>Question sur une formation</option>
          <option>Problème de connexion</option>
          <option>Une vidéo ne se lance pas</option>
          <option>Question sur Yoovi pour les élèves</option>
          <option>Autre demande</option>
        </SelectField>
        <SelectField label="Module concerné" name="module" optional value={module} onChange={(e) => setModule(e.target.value)}>
          <option value="">Aucun en particulier</option>
          {modules.map((m) => <option key={m}>{m}</option>)}
        </SelectField>
      </div>
      <TextArea label="Décrivez brièvement votre demande" name="message" optional rows={5} maxLength={1500}
        value={message} onChange={(e) => setMessage(e.target.value)}
        placeholder="Ex. : la vidéo « Présentation de l'interface » ne se lance pas sur ma tablette…"
        hint="Ce texte est repris dans l'e-mail : vous pourrez le relire et le compléter avant l'envoi." />
      <TextField label="Objet de l'e-mail" name="subject" readOnly value={`${SUBJECT} — ${topic}`} className="[&_input]:bg-violet-50" />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Button type="submit" size="lg" icon={<Send className="size-[18px]" />}>Contacter le support</Button>
        <button type="button" onClick={copy} className="inline-flex items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-semibold text-violet-700 hover:bg-violet-100">
          {copied ? <Check className="size-4" /> : <Copy className="size-4" />} Copier l&apos;adresse
        </button>
      </div>
      <p className="flex items-start gap-2 text-[13px] text-ink-faint">
        <Mail className="mt-0.5 size-4 shrink-0" />
        Le bouton ouvre votre logiciel de messagerie. Si rien ne se passe, écrivez directement à{" "}
        <a href={`mailto:${email}`} className="font-semibold text-violet-600 underline">{email}</a>.
      </p>
    </form>
  );
}
