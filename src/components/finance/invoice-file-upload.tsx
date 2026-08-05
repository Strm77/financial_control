"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Paperclip, ExternalLink, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { INVOICE_ATTACHMENTS_BUCKET, buildInvoiceAttachmentPath } from "@/lib/storage";
import { recordInvoiceAttachmentAction, removeInvoiceAttachmentAction, getInvoiceFileUrlAction } from "@/lib/actions/invoices";

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
const ACCEPTED_TYPES = ["application/pdf", "image/png", "image/jpeg", "image/webp"];

export function InvoiceFileUpload({ invoiceId, hasAttachment }: { invoiceId: string; hasAttachment: boolean }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [opening, setOpening] = useState(false);
  const [removing, setRemoving] = useState(false);

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (file.size > MAX_FILE_SIZE_BYTES) {
      toast.error("Arquivo muito grande. O limite é 10MB.");
      return;
    }
    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast.error("Formato não suportado. Envie um PDF, PNG, JPG ou WEBP.");
      return;
    }

    setUploading(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      toast.error("Sessão expirada. Faça login novamente.");
      setUploading(false);
      return;
    }

    const path = buildInvoiceAttachmentPath(user.id, invoiceId, file.name);
    const { error: uploadError } = await supabase.storage.from(INVOICE_ATTACHMENTS_BUCKET).upload(path, file, {
      upsert: false,
      contentType: file.type,
    });

    if (uploadError) {
      toast.error("Não foi possível enviar o arquivo.");
      setUploading(false);
      return;
    }

    const result = await recordInvoiceAttachmentAction(invoiceId, path);
    setUploading(false);

    if (!result.success) {
      toast.error(result.message ?? "Não foi possível salvar o anexo.");
      return;
    }

    toast.success("Fatura anexada.");
    router.refresh();
  }

  async function handleOpen() {
    setOpening(true);
    const result = await getInvoiceFileUrlAction(invoiceId);
    setOpening(false);
    if (!result.success || !result.data) {
      toast.error(result.message ?? "Não foi possível abrir o anexo.");
      return;
    }
    window.open(result.data, "_blank", "noopener,noreferrer");
  }

  async function handleRemove() {
    setRemoving(true);
    const result = await removeInvoiceAttachmentAction(invoiceId);
    setRemoving(false);
    if (!result.success) {
      toast.error(result.message ?? "Não foi possível remover o anexo.");
      return;
    }
    toast.success("Anexo removido.");
    router.refresh();
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(",")}
        className="hidden"
        onChange={handleFileChange}
        aria-label="Anexar arquivo da fatura"
      />
      {hasAttachment ? (
        <>
          <Button type="button" size="sm" variant="outline" loading={opening} onClick={handleOpen}>
            <ExternalLink className="size-4" aria-hidden="true" />
            Ver anexo
          </Button>
          <Button type="button" size="sm" variant="outline" loading={uploading} onClick={() => inputRef.current?.click()}>
            <Paperclip className="size-4" aria-hidden="true" />
            Substituir
          </Button>
          <button
            type="button"
            aria-label="Remover anexo"
            disabled={removing}
            onClick={handleRemove}
            className="size-9 grid place-items-center rounded-brutal border-brutal bg-card press-brutal cursor-pointer disabled:opacity-50"
          >
            {removing ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Trash2 className="size-4" aria-hidden="true" />}
          </button>
        </>
      ) : (
        <Button type="button" size="sm" variant="secondary" loading={uploading} onClick={() => inputRef.current?.click()}>
          <Paperclip className="size-4" aria-hidden="true" />
          Anexar fatura (PDF/imagem)
        </Button>
      )}
    </div>
  );
}
