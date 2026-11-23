import { OWNER_CONTACT_EMAIL, OWNER_CONTACT_PHONE } from '@/lib/contact';

/** Kontakt do nas na ekranach zgłoszenia lokalu: mail, a po wysłaniu zgłoszenia (withPhone) także telefon. */
export default function OwnerContact({ lead = 'Masz pytanie?', withPhone = false }: { lead?: string; withPhone?: boolean }) {
  const link = 'py-2 font-display font-bold text-spoot-ink underline underline-offset-4';
  return (
    <p className="flex flex-wrap items-center gap-x-3 text-[13px] text-spoot-ink2">
      {lead}
      {withPhone && <a href={`tel:${OWNER_CONTACT_PHONE.replace(/\s/g, '')}`} className={link}>{OWNER_CONTACT_PHONE}</a>}
      <a href={`mailto:${OWNER_CONTACT_EMAIL}`} className={link}>{OWNER_CONTACT_EMAIL}</a>
    </p>
  );
}
