import type { Metadata } from 'next';
import LegalPage from '@/components/LegalPage';

export const metadata: Metadata = {
  title: 'Usunięcie konta – Spoot',
  description: 'Jak usunąć konto w Spoot i co dzieje się z Twoimi danymi.',
};

const html = `
<h1>Usunięcie konta Spoot</h1>
<p>Konto w aplikacji Spoot możesz usunąć w każdej chwili, bezpłatnie i bez podawania powodu.</p>
<h2>Sposób 1: w aplikacji</h2>
<ul>
<li>Otwórz Spoot i przejdź do zakładki <strong>Profil</strong>.</li>
<li>Wejdź w <strong>Ustawienia</strong>.</li>
<li>Wybierz <strong>Usuń konto</strong> i potwierdź.</li>
</ul>
<p>Konto znika od razu.</p>
<h2>Sposób 2: e-mailem</h2>
<p>Jeśli nie masz już dostępu do aplikacji, napisz na <a href="mailto:info@spootme.pl?subject=Usuni%C4%99cie%20konta">info@spootme.pl</a> z adresu e-mail przypisanego do konta. Usuniemy konto najpóźniej w ciągu 30 dni i potwierdzimy to w odpowiedzi.</p>
<h2>Co usuwamy</h2>
<p>Profil i zdjęcie profilowe, oceny i dołączone do nich zdjęcia, listy, zapisane miejsca, obserwacje, zaimportowane posty, pieczątki w programach lojalnościowych oraz token powiadomień.</p>
<h2>Co zostaje i na jak długo</h2>
<p>Przez <strong>12 miesięcy</strong> od usunięcia konta przechowujemy adres e-mail i numer telefonu (jeśli był podany) wraz z datą usunięcia. Służy to wyłącznie wykazaniu, że usunęliśmy konto na Twoje żądanie, oraz zapobieganiu nadużyciom. Potem usuwamy je trwale. Kopie zapasowe są nadpisywane w ciągu 7 dni.</p>
<p>Usunięcie jest nieodwracalne. Szczegóły znajdziesz w <a href="/polityka-prywatnosci">Polityce prywatności</a>.</p>
`;

export default function UsunKonto() {
  return <LegalPage html={html} />;
}
