// ==========================================
// 1. KONFIGURACJA SZEFA (SKLEPY PRZYPISANE W JS)
// ==========================================
const SKLEP_DOMENY = {
    "Biedronka": "biedronka.pl",
    "Aldi": "aldi.pl",
    "Sinsay": "sinsay.com",
    "Action": "action.com",
    "Smyk": "smyk.com",
    "Empik": "empik.com",
    "Tania Książka": "taniaksiazka.pl",
    "Tantis": "tantis.pl", // ZAMIANA: Świat Książki -> Tantis
    "Allegro": "allegro.pl"
};

const SKLEPY_KATEGORII = {
    "Książki": ["Empik", "Tania Książka", "Tantis", "Smyk"], // Podmieniony na Tantis
    "Back to School": ["Biedronka", "Aldi", "Sinsay", "Action"],
    "Zabawki": ["Smyk", "Allegro", "Empik"]
};

const KOLORY_KATEGORII = {
    "Książki": "bg-blue-600",
    "Back to School": "bg-yellow-500",
    "Zabawki": "bg-pink-500"
};

let aktywneSklepyKategorii = [];
let aktywnaKategoria = "";
window.listaRaportu = []; 
// Struktura obiektów w liście raportu zmieniła się na:
// { id, data, kategoria, produkt, ceny: { "Sklep1": "12,34 zł", ... }, linki: { "Sklep1": "url", ... } }

// Tymczasowy schowek na linki wygenerowane podczas bieżącego wyszukiwania
let biezaceLinkiWyszukiwania = {};

// ==========================================
// 2. INICJALIZACJA I OBSŁUGA STARTOWA
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    RenderujIkony();
    UstawDzisiejszaDate();
    pokazEkranGlowny();
});

function RenderujIkony() {
    if (window.lucide) {
        window.lucide.createIcons();
    }
}

function UstawDzisiejszaDate() {
    const inputData = document.getElementById('data-analizy');
    if (inputData) {
        const dzis = new Date();
        const yyyy = dzis.getFullYear();
        const mm = String(dzis.getMonth() + 1).padStart(2, '0');
        const dd = String(dzis.getDate()).padStart(2, '0');
        inputData.value = `${yyyy}-${mm}-${dd}`;
    }
}

// ==========================================
// 3. NAWIGACJA I PRZEŁĄCZANIE EKRANÓW
// ==========================================
function pokazEkranGlowny() {
    document.getElementById('ekran-glowny').classList.remove('hidden');
    document.getElementById('ekran-kategorii').classList.add('hidden');
    document.getElementById('current-category-badge').classList.add('hidden');
    aktywnaKategoria = "";
    aktywneSklepyKategorii = [];
    window.listaRaportu = []; // Reset zestawienia przy powrocie do głównego menu
    document.getElementById('raport-box').classList.add('hidden');
    document.getElementById('tabela-raportu-body').innerHTML = '';
}

function wybierzKategorie(nazwaKategorii, ikona) {
    aktywnaKategoria = nazwaKategorii;
    aktywneSklepyKategorii = SKLEPY_KATEGORII[nazwaKategorii] || [];

    document.getElementById('ekran-glowny').classList.add('hidden');
    document.getElementById('ekran-kategorii').classList.remove('hidden');

    const badge = document.getElementById('current-category-badge');
    badge.innerText = nazwaKategorii;
    badge.classList.remove('hidden');

    document.getElementById('kat-title').innerText = nazwaKategorii;
    const iconBox = document.getElementById('kat-icon-box');
    
    iconBox.className = `w-12 h-12 rounded-xl flex items-center justify-center text-white ${KOLORY_KATEGORII[nazwaKategorii] || 'bg-blue-600'}`;
    iconBox.innerHTML = `<i data-lucide="${ikona || 'bookmark'}"></i>`;

    // DYNAMICZNE UKRYWANIE KODU EAN (Tylko dla Książek)
    const boxEan = document.getElementById('box-ean');
    if (nazwaKategorii === 'Książki') {
        boxEan.style.display = 'block';
    } else {
        boxEan.style.display = 'none';
    }

    // Czyszczenie i przygotowanie tabeli raportu
    document.getElementById('wyniki-box').classList.add('hidden');
    document.getElementById('tabela-wynikow').innerHTML = '';
    document.getElementById('search-title').value = '';
    document.getElementById('search-ean').value = '';
    
    window.listaRaportu = []; 
    document.getElementById('raport-box').classList.add('hidden');
    
    InicjalizujNaglowkiRaportu();
    GenerujCheckboxySklepow(aktywneSklepyKategorii);
    RenderujIkony();
}

function GenerujCheckboxySklepow(sklepy) {
    const kontener = document.getElementById('sklepy-lista');
    kontener.innerHTML = '';

    sklepy.forEach(sklep => {
        const label = document.createElement('label');
        label.className = "inline-flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold px-3 py-2 rounded-xl cursor-pointer select-none transition-colors border border-gray-200";
        label.innerHTML = `
            <input type="checkbox" value="${sklep}" checked class="rounded text-blue-600 focus:ring-blue-500 w-4 h-4">
            <span>${sklep}</span>
        `;
        kontener.appendChild(label);
    });
}

function PobierzZaznaczoneSklepy() {
    const checkboxes = document.querySelectorAll('#sklepy-lista input[type="checkbox"]');
    const zaznaczone = [];
    checkboxes.forEach(cb => {
        if (cb.checked) zaznaczone.push(cb.value);
    });
    return zaznaczone.length > 0 ? zaznaczone : aktywneSklepyKategorii;
}

// ==========================================
// 4. INTELIGENTNA WYSZUKIWARKA (NAZWA / EAN)
// ==========================================
function szukajImplementacja() {
    const tytulInput = document.getElementById('search-title');
    const eanInput = document.getElementById('search-ean');
    
    const tytul = tytulInput ? tytulInput.value.trim() : "";
    // Jeśli nie jesteśmy w książkach, ignorujemy wartość EAN
    const ean = (aktywnaKategoria === 'Książki' && eanInput) ? eanInput.value.trim() : "";

    if (aktywnaKategoria === 'Książki' && !tytul && ean) {
        alert('Szukanie po samym kodzie EAN jest zablokowane, ponieważ większość wyszukiwarek sklepów go nie obsługuje. Podaj tytuł książki lub tytuł razem z EAN.');
        return;
    }

    if (!tytul) {
        alert('Wprowadź nazwę/tytuł artykułu do wyszukania!');
        return;
    }

    const wynikiBox = document.getElementById('wyniki-box');
    const tabelaWynikow = document.getElementById('tabela-wynikow');

    wynikiBox.classList.remove('hidden');
    tabelaWynikow.innerHTML = '';
    biezaceLinkiWyszukiwania = {}; // Wyczyszczenie tymczasowej tablicy linków

    const wybraneSklepy = PobierzZaznaczoneSklepy();

    let frazaDoWyswietlenia = tytul;
    if (ean) frazaDoWyswietlenia += ` (EAN: ${ean})`;

    wybraneSklepy.forEach((sklep, index) => {
        const domena = SKLEP_DOMENY[sklep] || "google.com";
        let linkWeryfikacyjny = `https://${domena}`;

        // Budowanie frazy wyszukiwania: Tytuł + EAN (jeśli podano) lub sam Tytuł
        let queryStr = ean ? `${tytul} ${ean}` : tytul;
        const encodedQuery = encodeURIComponent(queryStr);

        // Mapowanie linków bezpośrednich
        if (domena.includes('biedronka.pl')) linkWeryfikacyjny = `https://www.biedronka.pl/pl/search?query=${encodedQuery}`;
        else if (domena.includes('action.com')) linkWeryfikacyjny = `https://www.action.com/pl-pl/search/?q=${encodedQuery}`;
        else if (domena.includes('aldi.pl')) linkWeryfikacyjny = `https://www.aldi.pl/wyszukiwanie.html?q=${encodedQuery}`;
        else if (domena.includes('sinsay.com')) linkWeryfikacyjny = `https://www.sinsay.com/pl/pl/catalogsearch/result/?q=${encodedQuery}`;
        else if (domena.includes('empik.com')) linkWeryfikacyjny = `https://www.empik.com/szukaj/produkt?q=${encodedQuery}`;
        else if (domena.includes('allegro.pl')) linkWeryfikacyjny = `https://allegro.pl/listing?string=${encodedQuery}`;
        else if (domena.includes('smyk.com')) linkWeryfikacyjny = `https://www.smyk.com/szukaj/produkt?q=${encodedQuery}`;
        else if (domena.includes('taniaksiazka.pl')) linkWeryfikacyjny = `https://www.taniaksiazka.pl/szukaj/zapytanie-${encodedQuery}`;
        else if (domena.includes('tantis.pl')) linkWeryfikacyjny = `https://tantis.pl/szukaj?q=${encodedQuery}`;

        // Zapisujemy link w pamięci podręcznej, aby trafił do ostatecznego wiersza raportu
        biezaceLinkiWyszukiwania[sklep] = linkWeryfikacyjny;

        const uniqueId = `cena-${index}`;

        const row = document.createElement('tr');
        row.className = "border-b border-gray-100 hover:bg-gray-50/80 transition-colors";
        row.innerHTML = `
            <td class="p-3 font-bold text-gray-700">${sklep}</td>
            <td class="p-3">
                <div class="font-semibold text-gray-900">${frazaDoWyswietlenia}</div>
                <div class="text-xs text-gray-400 max-w-md truncate">Wyszukiwanie w wyszukiwarce domeny ${domena}</div>
            </td>
            <td class="p-3 text-right">
                <div class="inline-flex items-center gap-1">
                    <input type="number" id="${uniqueId}" data-sklep="${sklep}" step="0.01" min="0" placeholder="brak" 
                           class="w-24 bg-white border border-gray-300 rounded-lg p-1.5 text-sm font-bold text-right text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none input-cena-wynik">
                    <span class="text-xs font-bold text-gray-500">zł</span>
                </div>
            </td>
            <td class="p-3 text-center">
                <a href="${linkWeryfikacyjny}" target="_blank" class="inline-flex items-center bg-blue-50 text-blue-700 px-2.5 py-1 rounded-md hover:bg-blue-100 font-bold text-xs gap-1 no-underline border border-blue-200/60 shadow-sm">
                    Otwórz sklep <i data-lucide="external-link" class="w-3 h-3"></i>
                </a>
            </td>
            <td class="p-3 text-center text-xs text-gray-400 italic">
                Czeka na zbiorcze dodanie
            </td>
        `;
        tabelaWynikow.appendChild(row);
    });
    
    RenderujIkony();
}

// ==========================================
// 5. OBSŁUGA DYNAMICZNEGO I ZGRUPOWANEGO RAPORTU
// ==========================================
function InicjalizujNaglowkiRaportu() {
    const naglowek = document.getElementById('naglowek-tabeli-raportu');
    if (!naglowek) return;

    // Budowanie nagłówków tabeli w zależności od sklepów przypisanych do danej kategorii
    let html = `
        <th class="p-2.5">Data</th>
        <th class="p-2.5">Kategoria</th>
        <th class="p-2.5">Artykuł / Produkt</th>
    `;
    
    aktywneSklepyKategorii.forEach(sklep => {
        html += `
            <th class="p-2.5 text-right border-l border-gray-200 bg-gray-50">${sklep} (Cena)</th>
            <th class="p-2.5 text-center bg-gray-50 text-gray-400 font-normal">Link</th>
        `;
    });

    html += `<th class="p-2.5 text-center border-l border-gray-200">Akcja</th>`;
    naglowek.innerHTML = html;
}

function ZatwierdzCaloscDoRaportu() {
    const tytulInput = document.getElementById('search-title');
    const eanInput = document.getElementById('search-ean');
    const inputData = document.getElementById('data-analizy');
    
    const tytul = tytulInput ? tytulInput.value.trim() : "";
    const ean = (aktywnaKategoria === 'Książki' && eanInput) ? eanInput.value.trim() : "";
    const dataAnalizy = inputData && inputData.value ? inputData.value : new Date().toLocaleDateString('pl-PL');

    const ostatecznaNazwaProduktu = ean ? `${tytul} (EAN: ${ean})` : tytul;

    // Pobranie wpisanych cen ze wszystkich pól
    const inputs = document.querySelectorAll('.input-cena-wynik');
    let cenyObiekt = {};
    let linkiObiekt = {};
    let czyDodanoCokolwiek = false;

    inputs.forEach(input => {
        const sklep = input.getAttribute('data-sklep');
        const cenaWartosc = parseFloat(input.value);

        if (!isNaN(cenaWartosc) && cenaWartosc > 0) {
            cenyObiekt[sklep] = cenaWartosc.toFixed(2).replace('.', ',') + ' zł';
            linkiObiekt[sklep] = biezaceLinkiWyszukiwania[sklep] || `https://${SKLEP_DOMENY[sklep]}`;
            czyDodanoCokolwiek = true;
        } else {
            cenyObiekt[sklep] = "-"; // Brak wprowadzonej ceny dla danego sklepu
            linkiObiekt[sklep] = "";
        }
    });

    if (!czyDodanoCokolwiek) {
        alert('Wprowadź cenę dla co najmniej jednego sklepu przed dodaniem produktu do zestawienia!');
        return;
    }

    const idPozycji = Date.now() + Math.random().toString(36).substr(2, 5);

    const nowyProduktWiersz = {
        id: idPozycji,
        data: dataAnalizy,
        kategoria: aktywnaKategoria,
        produkt: ostatecznaNazwaProduktu,
        ceny: cenyObiekt,
        linki: linkiObiekt
    };

    window.listaRaportu.push(nowyProduktWiersz);

    // Wyświetlenie sekcji raportu
    document.getElementById('raport-box').classList.remove('hidden');
    
    // Renderowanie wiersza w tabeli HTML
    const tabelaBody = document.getElementById('tabela-raportu-body');
    if (tabelaBody) {
        const row = document.createElement('tr');
        row.id = `row-${idPozycji}`;
        row.className = "border-b border-gray-100 hover:bg-gray-50/50 transition-colors";
        
        let rowHtml = `
            <td class="p-2.5 text-gray-500">${nowyProduktWiersz.data}</td>
            <td class="p-2.5 font-medium text-gray-600">${nowyProduktWiersz.kategoria}</td>
            <td class="p-2.5 font-bold text-gray-900 max-w-xs truncate" title="${nowyProduktWiersz.produkt}">${nowyProduktWiersz.produkt}</td>
        `;

        // Iteracja po wszystkich stałych sklepach tej kategorii gwarantuje stabilną strukturę kolumn
        aktywneSklepyKategorii.forEach(sklep => {
            const cena = nowyProduktWiersz.ceny[sklep] || "-";
            const link = nowyProduktWiersz.linki[sklep] || "";
            
            if (cena !== "-") {
                rowHtml += `
                    <td class="p-2.5 text-right font-bold text-emerald-600 border-l border-gray-100 bg-gray-50/40">${cena}</td>
                    <td class="p-2.5 text-center bg-gray-50/40">
                        <a href="${link}" target="_blank" class="text-blue-600 hover:underline"><i data-lucide="link" class="w-3.5 h-3.5 inline"></i></a>
                    </td>
                `;
            } else {
                rowHtml += `
                    <td class="p-2.5 text-right text-gray-300 italic border-l border-gray-100">-</td>
                    <td class="p-2.5 text-center text-gray-300">-</td>
                `;
            }
        });

        rowHtml += `
            <td class="p-2.5 text-center border-l border-gray-200">
                <button onclick="UsunZRaportu('${idPozycji}')" class="text-red-500 hover:text-red-700 font-bold p-1 border-0 bg-transparent cursor-pointer text-xs flex items-center gap-0.5 mx-auto">
                     <i data-lucide="trash-2" class="w-3.5 h-3.5"></i> Usuń
                </button>
            </td>
        `;

        row.innerHTML = rowHtml;
        tabelaBody.appendChild(row);
        RenderujIkony();
    }

    // Resetowanie pól formularza wyszukiwania
    document.getElementById('wyniki-box').classList.add('hidden');
    document.getElementById('tabela-wynikow').innerHTML = '';
    tytulInput.value = '';
    if (eanInput) eanInput.value = '';
}

function UsunZRaportu(id) {
    window.listaRaportu = window.listaRaportu.filter(item => item.id !== id);
    const row = document.getElementById(`row-${id}`);
    if (row) row.remove();

    if (window.listaRaportu.length === 0) {
        document.getElementById('raport-box').classList.add('hidden');
    }
}

// ==========================================
// 6. MATRYCOWY EKSPORT DO EXCELA / GOOGLE SHEETS
// ==========================================
function eksportujDoXLSX() {
    if (window.listaRaportu.length === 0) {
        alert("Raport jest pusty! Dodaj najpierw ceny.");
        return;
    }

    // 1. Budowa nagłówka dla pliku TSV (Schowek Google Sheets)
    let tsvNaglowek = ["Data analizy", "Kategoria", "Artykuł / Produkt"];
    aktywneSklepyKategorii.forEach(sklep => {
        tsvNaglowek.push(`${sklep} (Cena)`);
        tsvNaglowek.push(`${sklep} (Link)`);
    });
    
    let tsvContent = tsvNaglowek.join("\t") + "\n";

    // Wygenerowanie wierszy dla TSV
    window.listaRaportu.forEach(item => {
        let tsvWiersz = [item.data, item.kategoria, item.produkt];
        aktywneSklepyKategorii.forEach(sklep => {
            tsvWiersz.push(item.ceny[sklep] || "-");
            tsvWiersz.push(item.linki[sklep] || "");
        });
        tsvContent += tsvWiersz.join("\t") + "\n";
    });

    // Kopiowanie do schowka
    navigator.clipboard.writeText(tsvContent).then(() => {
        
        // 2. Budowa struktury obiektów JSON dedykowanych pod SheetJS (Eksport XLSX)
        const daneDoExcela = window.listaRaportu.map(item => {
            let rowObj = {
                "Data analizy": item.data,
                "Kategoria": item.kategoria,
                "Artykuł / Produkt": item.produkt
            };
            
            aktywneSklepyKategorii.forEach(sklep => {
                rowObj[`${sklep} (Cena)`] = item.ceny[sklep] || "-";
                rowObj[`${sklep} (Link)`] = item.linki[sklep] || "";
            });
            return rowObj;
        });

        const worksheet = XLSX.utils.json_to_sheet(daneDoExcela);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Analiza Porównawcza");

        // Obliczanie dynamicznej szerokości kolumn dla estetyki Excela
        let colsSpec = [{wch: 15}, {wch: 18}, {wch: 35}];
        aktywneSklepyKategorii.forEach(() => {
            colsSpec.push({wch: 16}); // Kolumna ceny
            colsSpec.push({wch: 12}); // Kolumna linku
        });
        worksheet['!cols'] = colsSpec;

        const inputData = document.getElementById('data-analizy');
        const dataPliku = inputData && inputData.value ? inputData.value : "raport";
        
        XLSX.writeFile(workbook, `Raport_Macierzowy_${dataPliku}.xlsx`);

        alert("Sukces!\n1. Pobrano sformatowany raport w pliku XLSX (struktura kolumnowa).\n2. Dane tabeli skopiowano automatycznie do schowka!\n\nZostaniesz przekierowany do Google Sheets. Kliknij komórkę A1 i użyj Ctrl + V, aby zachować idealny podział na kolumny.");
        window.open("https://sheets.new", "_blank");
        
    }).catch(err => {
        console.error('Błąd zapisu do schowka: ', err);
        alert("Pobrano plik Excel, ale wystąpił problem z automatycznym zapisaniem tabeli w schowku systemowym.");
    });
}

// Mapowanie pod kontekst globalny window
window.pokazEkranGlowny = pokazEkranGlowny;
window.wybierzKategorie = wybierzKategorie;
window.szukajImplementacja = szukajImplementacja;
window.ZatwierdzCaloscDoRaportu = ZatwierdzCaloscDoRaportu;
window.UsunZRaportu = UsunZRaportu;
window.eksportujDoXLSX = eksportujDoXLSX;