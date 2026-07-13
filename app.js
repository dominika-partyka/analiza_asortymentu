// Konfiguracja Twoich indywidualnych kluczy Google API
const GOOGLE_API_KEY = 'AIzaSyCM64jCCKtfjSQYaoWa4GM9ATbUjo9_wC8';
const GOOGLE_CX = '5393052c79d0c4c4a';

// Dane globalne aplikacji
let aktywnaKategoria = '';
let aktywneSklepy = [];
let wybraneSklepyFiltru = [];
let listaDoEksportu = [];

// Mapowanie nazw sklepów z Twojego interfejsu na domeny internetowe dla wyszukiwarki Google
const SKLEP_DOMENY = {
    'Empik': 'empik.com',
    'Tania Książka': 'taniaksiazka.pl',
    'Świat Książki': 'swiatksiazki.pl',
    'Biedronka': 'biedronka.pl',
    'Aldi': 'aldi.pl',
    'Sinsay': 'sinsay.com',
    'Action': 'action.com',
    'Smyk': 'smyk.com',
    'Allegro': 'allegro.pl'
};

// Inicjalizacja ikon Lucide przy starcie strony
document.addEventListener("DOMContentLoaded", () => {
    lucide.createIcons();
    // Ustawienie dzisiejszej daty jako domyślnej
    document.getElementById('data-analizy').valueAsDate = new Date();
});

// Nawigacja: Powrót na ekran główny
function pokazEkranGlowny() {
    document.getElementById('ekran-glowny').classList.remove('hidden');
    document.getElementById('ekran-kategorii').classList.add('hidden');
    document.getElementById('current-category-badge').classList.add('hidden');
}

// Nawigacja: Wybór kafelka / kategorii
function wybierzKategorie(nazwa, ikona, sklepy) {
    aktywnaKategoria = nazwa;
    aktywneSklepy = sklepy;
    wybraneSklepyFiltru = [...sklepy]; // domyślnie zaznaczone wszystkie sklepy z danej kategorii

    // Aktualizacja paska nawigacyjnego (Badge)
    const badge = document.getElementById('current-category-badge');
    badge.innerText = nazwa;
    badge.classList.remove('hidden');

    // Konfiguracja wizualna nagłówka ekranu szczegółów
    document.getElementById('kat-title').innerText = nazwa;
    const iconBox = document.getElementById('kat-icon-box');
    iconBox.innerHTML = `<i data-lucide="${ikona}" class="w-6 h-6"></i>`;
    
    // Zmiana koloru boxu ikony w zależności od wybranej sekcji
    iconBox.className = "w-12 h-12 rounded-xl flex items-center justify-center text-white ";
    if (nazwa === 'Książki') iconBox.classList.add('bg-blue-600');
    else if (nazwa === 'Back to School') iconBox.classList.add('bg-yellow-500');
    else iconBox.classList.add('bg-pink-500');

    // Generowanie przełączników (checkboxów) filtrowania sklepów konkurencji
    const sklepyListaContainer = document.getElementById('sklepy-lista');
    sklepyListaContainer.innerHTML = '';
    sklepy.forEach(sklep => {
        const label = document.createElement('label');
        label.className = "inline-flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer select-none transition-colors";
        label.innerHTML = `
            <input type="checkbox" checked value="${sklep}" onchange="przepnijFiltrSklepu(this)" class="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5">
            <span>${sklep}</span>
        `;
        sklepyListaContainer.appendChild(label);
    });

    // Resetowanie widoków tabel po zmianie kategorii
    document.getElementById('search-input').value = '';
    document.getElementById('wyniki-box').classList.add('hidden');
    document.getElementById('tabela-wynikow').innerHTML = '';
    
    // Odświeżenie tabeli raportu (wyświetli tylko produkty dodane wcześniej w TEJ kategorii)
    odswiezTabeleRaportu();

    // Przełączenie ekranu
    document.getElementById('ekran-glowny').classList.add('hidden');
    document.getElementById('ekran-kategorii').classList.remove('hidden');
    
    // Przeładowanie nowo dodanych ikon lucide wstrzykniętych w HTML
    lucide.createIcons();
}

// Obsługa klikania w filtry sklepów
function przepnijFiltrSklepu(cb) {
    if (cb.checked) {
        if (!wybraneSklepyFiltru.includes(cb.value)) wybraneSklepyFiltru.push(cb.value);
    } else {
        wybraneSklepyFiltru = wybraneSklepyFiltru.filter(s => s !== cb.value);
    }
}

// Główna implementacja wyszukiwania za pomocą Google API
// Główna implementacja wyszukiwania za pomocą Google API
async function szukajImplementacja() {
    const query = document.getElementById('search-input').value.trim();
    const tabelaWynikow = document.getElementById('tabela-wynikow');
    const wynikiBox = document.getElementById('wyniki-box');

    if (!query) {
        alert('Wpisz nazwę poszukiwanego artykułu!');
        return;
    }

    if (wybraneSklepyFiltru.length === 0) {
        alert('Musisz zaznaczyć przynajmniej jeden sklep do odfiltrowania wyników!');
        return;
    }

    wynikiBox.classList.remove('hidden');
    tabelaWynikow.innerHTML = `
        <tr>
            <td colspan="5" class="p-6 text-center text-sm text-gray-500 font-medium">
                <span class="inline-block animate-spin mr-2">⏳</span> Przeszukuję zasoby rynkowe konkurencji...
            </td>
        </tr>
    `;

    // Konwersja zaznaczonych sklepów na domeny
    const szukaneDomeny = wybraneSklepyFiltru
        .map(sklep => SKLEP_DOMENY[sklep])
        .filter(domena => domena !== undefined);

    // Jeśli nic nie zaznaczono, bierzemy domyślne dla kategorii
    const ostateczneDomeny = szukaneDomeny.length > 0 ? szukaneDomeny : aktywneSklepy.map(s => SKLEP_DOMENY[s]);

    const filtrStron = ostateczneDomeny.map(domena => `site:${domena}`).join(' OR ');
    const pelneZapytanie = `${query} (${filtrStron})`;

    const url = `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_API_KEY}&cx=${GOOGLE_CX}&q=${encodeURIComponent(pelneZapytanie)}`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        tabelaWynikow.innerHTML = '';

        if (!data.items || data.items.length === 0) {
            tabelaWynikow.innerHTML = `
                <tr>
                    <td colspan="5" class="p-6 text-center text-sm text-gray-400">
                        Brak bezpośrednich trafień dla frazy "${query}" w wybranych sklepach.
                    </td>
                </tr>
            `;
            return;
        }

        // Renderowanie pobranych rekordów
        data.items.forEach((item) => {
            let nazwaSklepu = 'Konkurencja';
            const linkUrl = item.link.toLowerCase();
            
            for (const [klucz, domena] of Object.entries(SKLEP_DOMENY)) {
                if (linkUrl.includes(domena.toLowerCase())) {
                    nazwaSklepu = klucz;
                    break;
                }
            }

            const wyciagnietaCena = wyciągnijCeneZOpisu(item.snippet || '');

            const row = document.createElement('tr');
            row.className = "border-b border-gray-50 hover:bg-gray-50/80 transition-colors";
            row.innerHTML = `
                <td class="p-3 font-bold text-gray-700">${nazwaSklepu}</td>
                <td class="p-3">
                    <div class="font-semibold text-gray-900">${item.title}</div>
                    <div class="text-xs text-gray-400 max-w-md truncate">${item.snippet || ''}</div>
                </td>
                <td class="p-3 text-right font-bold text-emerald-600 text-base">${wyciagnietaCena}</td>
                <td class="p-3 text-center">
                    <a href="${item.link}" target="_blank" class="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium text-xs gap-0.5 no-underline">
                        Otwórz <i data-lucide="external-link" class="w-3 h-3"></i>
                    </a>
                </td>
                <td class="p-3 text-center">
                    <button onclick="dodajDoRaportu('${nazwaSklepu}', \`${item.title.replace(/["']/g, "")}\`, '${wyciagnietaCena}')" 
                            class="bg-gray-900 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-blue-700 transition-all cursor-pointer border-0 flex items-center gap-1 mx-auto">
                        <i data-lucide="plus" class="w-3 h-3"></i> Uwzględnij
                    </button>
                </td>
            `;
            tabelaWynikow.appendChild(row);
        });

        lucide.createIcons();

    } catch (e) {
        console.error(e);
        tabelaWynikow.innerHTML = `
            <tr>
                <td colspan="5" class="p-6 text-center text-sm text-red-500 font-semibold">
                    Wystąpił problem techniczny podczas pobierania ofert rynkowych.
                </td>
            </tr>
        `;
    }
}

// Funkcja dodająca wybrany artykuł z rynku do końcowej sekcji raportu
function dodajDoRaportu(sklep, nazwa, cena) {
    const dataAnalizy = document.getElementById('data-analizy').value || new Date().toISOString().split('T')[0];
    
    const nowyProdukt = {
        id: Date.now() + Math.random().toString(36).substr(2, 5),
        kategoria: aktywnaKategoria,
        data: dataAnalizy,
        sklep: sklep,
        nazwaArtykulu: nazwa,
        cenaKonkurencji: cena
    };

    listaDoEksportu.push(nowyProdukt);
    odswiezTabeleRaportu();
}

// Funkcja usuwająca pozycję z raportu przed eksportem
function usunZRaportu(id) {
    listaDoEksportu = listaDoEksportu.filter(item => item.id !== id);
    odswiezTabeleRaportu();
}

// Funkcja synchronizująca widok tabeli zbiorczej w HTML
function odswiezTabeleRaportu() {
    const raportBox = document.getElementById('raport-box');
    const naglowek = document.getElementById('naglowek-tabeli-raportu');
    const body = document.getElementById('tabela-raportu-body');

    // Filtrujemy produkty przeznaczone tylko dla aktualnie przeglądanej sekcji
    const produktyDlaKategorii = listaDoEksportu.filter(item => item.kategoria === aktywnaKategoria);

    if (produktyDlaKategorii.length === 0) {
        raportBox.classList.add('hidden');
        return;
    }

    raportBox.classList.remove('hidden');

    // Nadpisanie nagłówków strukturalnych zgodnie z Twoim projektem
    naglowek.innerHTML = `
        <th class="p-2.5">Data monitoringu</th>
        <th class="p-2.5">Podmiot badany</th>
        <th class="p-2.5">Nazwa produktu w bazie</th>
        <th class="p-2.5 text-right">Zarejestrowana cena</th>
        <th class="p-2.5 text-center" style="width: 60px;">Opcje</th>
    `;

    body.innerHTML = '';
    produktyDlaKategorii.forEach(item => {
        const tr = document.createElement('tr');
        tr.className = "hover:bg-gray-50/50 transition-colors";
        tr.innerHTML = `
            <td class="p-2.5 font-medium text-gray-500">${item.data}</td>
            <td class="p-2.5 font-bold text-gray-800">${item.sklepu || item.sklep}</td>
            <td class="p-2.5 text-gray-700 font-medium">${item.nazwaArtykulu}</td>
            <td class="p-2.5 text-right font-bold text-gray-900">${item.cenaKonkurencji}</td>
            <td class="p-2.5 text-center">
                <button onclick="usunZRaportu('${item.id}')" class="text-gray-400 hover:text-red-500 transition-colors cursor-pointer bg-transparent border-0 p-1">
                    <i data-lucide="trash-2" class="w-4 h-4"></i>
                </button>
            </td>
        `;
        body.appendChild(tr);
    });

    lucide.createIcons();
}

// Logika eksportu danych bezpośrednio do pliku xlsx (Excel) przy użyciu SheetJS
function eksportujDoXLSX() {
    const produktyDlaKategorii = listaDoEksportu.filter(item => item.kategoria === aktywnaKategoria);
    
    if (produktyDlaKategorii.length === 0) {
        alert('Brak zakwalifikowanych pozycji w bieżącym zestawieniu!');
        return;
    }

    // Przekształcenie danych do formatu arkusza kalkulacyjnego Excel
    const przygotowaneWiersze = produktyDlaKategorii.map(item => ({
        'Data analizy': item.data,
        'Kategoria asortymentowa': item.kategoria,
        'Konkurent': item.sklep,
        'Nazwa artykułu konkurencji': item.nazwaArtykulu,
        'Zarejestrowana cena': item.cenaKonkurencji
    }));

    const nazwaPliku = `Raport_Cenowy_${aktywnaKategoria.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;

    // Wykorzystanie biblioteki SheetJS (xlsx) do zapisu
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(przygotowaneWiersze);
    XLSX.utils.book_append_sheet(wb, ws, "Zestawienie Cenowe");
    XLSX.writeFile(wb, nazwaPliku);
}

// Wyrażenie regularne przeszukujące opis (snippet) w poszukiwaniu cen (np. 12,99 zł, 150 PLN)
function wyciągnijCeneZOpisu(tekst) {
    const regex = /(\d+[\.,]\d{2})\s*(zł|PLN)/i;
    const dopasowanie = tekst.match(regex);
    return dopasowanie ? `${dopasowanie[1]} ${dopasowanie[2]}` : 'Do weryfikacji';
}