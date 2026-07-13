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
    "Tantis": "tantis.pl",
    "Allegro": "allegro.pl"
};

const SKLEPY_KATEGORII = {
    "Książki": ["Empik", "Tania Książka", "Tantis", "Smyk"],
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
// Struktura obiektów: { produkt, data, kategoria, ceny: { "Sklep": "Cena" }, linki: { "Sklep": "URL" } }

// Słownik przechowujący wygenerowane linki podczas ostatniego wyszukiwania
let mapowanieLinkowBiezacegoWyszukiwania = {};

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
    window.listaRaportu = [];
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

    const boxEan = document.getElementById('box-ean');
    if (nazwaKategorii === 'Książki') {
        boxEan.style.display = 'block';
    } else {
        boxEan.style.display = 'none';
    }

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
    mapowanieLinkowBiezacegoWyszukiwania = {}; 

    const wybraneSklepy = PobierzZaznaczoneSklepy();

    let frazaDoWyswietlenia = tytul;
    if (ean) frazaDoWyswietlenia += ` (EAN: ${ean})`;

    wybraneSklepy.forEach((sklep, index) => {
        const domena = SKLEP_DOMENY[sklep] || "google.com";
        let linkWeryfikacyjny = `https://${domena}`;

        let queryStr = ean ? `${tytul} ${ean}` : tytul;
        const encodedQuery = encodeURIComponent(queryStr);
        const queryWithPluses = encodeURIComponent(queryStr).replace(/%20/g, '+');

        if (domena.includes('biedronka.pl')) linkWeryfikacyjny = `https://www.biedronka.pl/pl/search?query=${encodedQuery}`;
        else if (domena.includes('action.com')) linkWeryfikacyjny = `https://www.action.com/pl-pl/search/?q=${encodedQuery}`;
        else if (domena.includes('aldi.pl')) linkWeryfikacyjny = `https://www.aldi.pl/wyszukiwanie.html?q=${encodedQuery}`;
        else if (domena.includes('sinsay.com')) linkWeryfikacyjny = `https://www.sinsay.com/pl/pl/catalogsearch/result/?q=${encodedQuery}`;
        else if (domena.includes('empik.com')) linkWeryfikacyjny = `https://www.empik.com/szukaj/produkt?q=${encodedQuery}`;
        else if (domena.includes('allegro.pl')) linkWeryfikacyjny = `https://allegro.pl/listing?string=${encodedQuery}`;
        else if (domena.includes('smyk.com')) linkWeryfikacyjny = `https://www.smyk.com/szukaj/produkt?q=${encodedQuery}`;
        else if (domena.includes('taniaksiazka.pl')) linkWeryfikacyjny = `https://www.taniaksiazka.pl/szukaj?q=${queryWithPluses}`;
        else if (domena.includes('tantis.pl')) linkWeryfikacyjny = `https://tantis.pl/szukaj?q=${encodedQuery}`;

        mapowanieLinkowBiezacegoWyszukiwania[sklep] = linkWeryfikacyjny;
        const uniqueId = `cena-${index}`;
        const escapedNazwaArtykulu = frazaDoWyswietlenia.replace(/'/g, "\\'");

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
                    <input type="number" id="${uniqueId}" step="0.01" min="0" placeholder="0.00" 
                           class="w-24 bg-white border border-gray-300 rounded-lg p-1.5 text-sm font-bold text-right text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none">
                    <span class="text-xs font-bold text-gray-500">zł</span>
                </div>
            </td>
            <td class="p-3 text-center">
                <a href="${linkWeryfikacyjny}" target="_blank" class="inline-flex items-center bg-blue-50 text-blue-700 px-2.5 py-1 rounded-md hover:bg-blue-100 font-bold text-xs gap-1 no-underline border border-blue-200/60 shadow-sm">
                    Otwórz sklep <i data-lucide="external-link" class="w-3 h-3"></i>
                </a>
            </td>
            <td class="p-3 text-center">
                <button onclick="ZatwierdzPozycje('${sklep}', '${uniqueId}', '${escapedNazwaArtykulu}')" 
                        class="bg-gray-900 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-blue-700 transition-all cursor-pointer border-0 flex items-center gap-1 mx-auto">
                    <i data-lucide="plus" class="w-3 h-3"></i> Uwzględnij
                </button>
            </td>
        `;
        tabelaWynikow.appendChild(row);
    });
    
    RenderujIkony();
}

// ==========================================
// 5. OBSŁUGA POZIOMEGO RAPORTU (JEDEN WIERSZ = JEDEN ARTYKUŁ)
// ==========================================
function InicjalizujNaglowkiRaportu() {
    const naglowek = document.getElementById('naglowek-tabeli-raportu');
    if (!naglowek) return;

    let html = `
        <th class="p-2.5">Data analizy</th>
        <th class="p-2.5">Kategoria</th>
        <th class="p-2.5">Artykuł / Produkt</th>
    `;
    
    // Generowanie kolumn cen dla każdego sklepu w danej kategorii
    aktywneSklepyKategorii.forEach(sklep => {
        html += `<th class="p-2.5 text-right border-l border-gray-200 bg-gray-50">${sklep}</th>`;
    });

    // Końcowa kolumna na zebrane linki weryfikacyjne
    html += `
        <th class="p-2.5 text-center border-l border-gray-200">Linki weryfikacyjne</th>
        <th class="p-2.5 text-center">Akcja</th>
    `;
    naglowek.innerHTML = html;
}

function ZatwierdzPozycje(sklep, inputId, nazwaArtykulu) {
    const cenaInput = document.getElementById(inputId);
    const cenaWpisana = parseFloat(cenaInput.value);

    if (isNaN(cenaWpisana) || cenaWpisana <= 0) {
        alert('Wpisz poprawną, sprawdzoną cenę przed dodaniem do raportu!');
        return;
    }

    const sformatowanaCena = cenaWpisana.toFixed(2).replace('.', ',') + ' zł';
    const inputData = document.getElementById('data-analizy');
    const dataAnalizy = inputData && inputData.value ? inputData.value : new Date().toLocaleDateString('pl-PL');
    const linkZrodlowy = mapowanieLinkowBiezacegoWyszukiwania[sklep] || `https://${SKLEP_DOMENY[sklep]}`;

    // Szukamy czy ten artykuł został już wcześniej wprowadzony do zestawienia
    let istniejącyArtykul = window.listaRaportu.find(item => item.produkt === nazwaArtykulu && item.kategoria === aktywnaKategoria);

    if (istniejącyArtykul) {
        // AKTUALIZACJA ISTNIEJĄCEGO WIERSZA
        istniejącyArtykul.ceny[sklep] = sformatowanaCena;
        istniejącyArtykul.linki[sklep] = linkZrodlowy;
    } else {
        // TWORZENIE NOWEGO OBIEKTU MACIERZOWEGO
        let nowyWpis = {
            data: dataAnalizy,
            kategoria: aktywnaKategoria,
            produkt: nazwaArtykulu,
            ceny: {},
            linki: {}
        };

        // Wypełnienie domyślne minusami dla wszystkich sklepów z kategorii
        aktywneSklepyKategorii.forEach(s => {
            nowyWpis.ceny[s] = "-";
            nowyWpis.linki[s] = "";
        });

        // Nadpisanie danymi aktualnie klikniętego sklepu
        nowyWpis.ceny[sklep] = sformatowanaCena;
        nowyWpis.linki[sklep] = linkZrodlowy;

        window.listaRaportu.push(nowyWpis);
    }

    // Wyczyszczenie pola input po udanym dodaniu
    cenaInput.value = '';
    
    // Przerysowanie tabeli raportowej na podstawie zaktualizowanych danych strukturalnych
    OdswiezWidokTabeliRaportu();
}

function OdswiezWidokTabeliRaportu() {
    const raportBox = document.getElementById('raport-box');
    const tabelaBody = document.getElementById('tabela-raportu-body');
    
    if (window.listaRaportu.length > 0 && raportBox) {
        raportBox.classList.remove('hidden');
    } else {
        if (raportBox) raportBox.classList.add('hidden');
        return;
    }

    if (!tabelaBody) return;
    tabelaBody.innerHTML = '';

    window.listaRaportu.forEach((item, indeks) => {
        const row = document.createElement('tr');
        row.className = "border-b border-gray-100 hover:bg-gray-50/50 transition-colors";

        let rowHtml = `
            <td class="p-2.5 text-gray-500">${item.data}</td>
            <td class="p-2.5 font-medium text-gray-600">${item.kategoria}</td>
            <td class="p-2.5 font-bold text-gray-900 max-w-xs truncate" title="${item.produkt}">${item.produkt}</td>
        `;

        // Kolumny cen (wypełniane ceną lub automatycznym minusem)
        aktywneSklepyKategorii.forEach(sklep => {
            const cenaValue = item.ceny[sklep] || "-";
            if (cenaValue !== "-") {
                rowHtml += `<td class="p-2.5 text-right font-black text-emerald-600 border-l border-gray-100 bg-gray-50/30">${cenaValue}</td>`;
            } else {
                rowHtml += `<td class="p-2.5 text-right text-gray-300 italic border-l border-gray-100">-</td>`;
            }
        });

        // Zbiorcza sekcja linków na samym końcu wiersza
        let linkiHtml = "";
        aktywneSklepyKategorii.forEach(sklep => {
            const url = item.linki[sklep];
            if (url) {
                linkiHtml += `
                    <a href="${url}" target="_blank" title="Otwórz ofertę w ${sklep}" 
                       class="inline-flex items-center justify-center w-6 h-6 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-md text-xs font-bold no-underline transition-all border border-blue-100 shadow-xs">
                       ${sklep.charAt(0)}
                    </a>
                `;
            }
        });

        rowHtml += `
            <td class="p-2.5 text-center border-l border-gray-200">
                <div class="flex items-center justify-center gap-1">${linkiHtml || '<span class="text-gray-300 italic">-</span>'}</div>
            </td>
            <td class="p-2.5 text-center">
                <button onclick="UsunZRaportuZIndeksu(${indeks})" class="text-red-500 hover:text-red-700 font-bold p-1 border-0 bg-transparent cursor-pointer text-xs flex items-center gap-0.5 mx-auto">
                     <i data-lucide="trash-2" class="w-3.5 h-3.5"></i> Usuń
                </button>
            </td>
        `;

        row.innerHTML = rowHtml;
        tabelaBody.appendChild(row);
    });

    RenderujIkony();
}

function UsunZRaportuZIndeksu(indeks) {
    window.listaRaportu.splice(indeks, 1);
    OdswiezWidokTabeliRaportu();
}

// ==========================================
// 6. MATRYCOWY EKSPORT DO EXCELA / GOOGLE SHEETS
// ==========================================
function eksportujDoXLSX() {
    if (window.listaRaportu.length === 0) {
        alert("Raport jest pusty! Dodaj najpierw ceny.");
        return;
    }

    // 1. Nagłówek schowka TSV (Google Sheets)
    let tsvNaglowek = ["Data analizy", "Kategoria", "Artykuł / Produkt"];
    aktywneSklepyKategorii.forEach(sklep => {
        tsvNaglowek.push(sklep);
    });
    aktywneSklepyKategorii.forEach(sklep => {
        tsvNaglowek.push(`Link ${sklep}`);
    });
    
    let tsvContent = tsvNaglowek.join("\t") + "\n";

    // Dane schowka TSV
    window.listaRaportu.forEach(item => {
        let tsvWiersz = [item.data, item.kategoria, item.produkt];
        aktywneSklepyKategorii.forEach(sklep => {
            tsvWiersz.push(item.ceny[sklep] || "-");
        });
        aktywneSklepyKategorii.forEach(sklep => {
            tsvWiersz.push(item.linki[sklep] || "-");
        });
        tsvContent += tsvWiersz.join("\t") + "\n";
    });

    navigator.clipboard.writeText(tsvContent).then(() => {
        
        // 2. Eksport do stałego pliku Excel (.XLSX) za pomocą SheetJS
        const daneDoExcela = window.listaRaportu.map(item => {
            let rowObj = {
                "Data analizy": item.data,
                "Kategoria": item.kategoria,
                "Artykuł / Produkt": item.produkt
            };
            
            // Kolumny z cenami
            aktywneSklepyKategorii.forEach(sklep => {
                rowObj[sklep] = item.ceny[sklep] || "-";
            });
            // Kolumny z linkami
            aktywneSklepyKategorii.forEach(sklep => {
                rowObj[`Link ${sklep}`] = item.linki[sklep] || "-";
            });
            return rowObj;
        });

        const worksheet = XLSX.utils.json_to_sheet(daneDoExcela);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Zestawienie Cenowe");

        // Formatowanie szerokości kolumn arkusza
        let colsSpec = [{wch: 15}, {wch: 15}, {wch: 35}];
        aktywneSklepyKategorii.forEach(() => colsSpec.push({wch: 14})); // Ceny
        aktywneSklepyKategorii.forEach(() => colsSpec.push({wch: 20})); // Linki
        worksheet['!cols'] = colsSpec;

        const inputData = document.getElementById('data-analizy');
        const dataPliku = inputData && inputData.value ? inputData.value : "raport";
        
        XLSX.writeFile(workbook, `Zestawienie_Konkurencji_${dataPliku}.xlsx`);

        alert("Sukces!\n1. Wygenerowano i pobrano zestawienie poziome w pliku XLSX.\n2. Dane tabeli skopiowano automatycznie do schowka!\n\nWklej je w komórce A1 w nowo otwartym arkuszu Google Sheets przy użyciu Ctrl + V.");
        window.open("https://sheets.new", "_blank");
        
    }).catch(err => {
        console.error('Błąd zapisu do schowka: ', err);
        alert("Pobrano plik Excel, lecz wystąpił problem z zapisem struktury do schowka systemowego.");
    });
}

// Mapowanie pod kontekst globalny window
window.pokazEkranGlowny = pokazEkranGlowny;
window.wybierzKategorie = wybierzKategorie;
window.szukajImplementacja = szukajImplementacja;
window.ZatwierdzPozycje = ZatwierdzPozycje;
window.eksportujDoXLSX = eksportujDoXLSX;