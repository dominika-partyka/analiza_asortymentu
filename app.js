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

// Słownik linków dla aktualnego zestawu wyszukiwania
let mapowanieLinkowBiezegoWyszukania = {};

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

    // EAN TYLKO DLA KSIĄŻEK
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
// 4. PERFEKCYJNIE DOPASOWANA WYSZUKIWARKA (1:1 JAK RĘCZNE KLIKNIĘCIE LUPY)
// ==========================================
function szukajImplementacja() {
    const tytulInput = document.getElementById('search-title');
    const eanInput = document.getElementById('search-ean');
    
    const tytul = tytulInput ? tytulInput.value.trim() : "";
    const ean = (aktywnaKategoria === 'Książki' && eanInput) ? eanInput.value.trim() : "";

    if (aktywnaKategoria === 'Książki' && !tytul && ean) {
        alert('Szukanie po samym kodzie EAN jest zablokowane. Wpisz tytuł lub tytuł + EAN.');
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
    mapowanieLinkowBiezegoWyszukania = {}; 

    const wybraneSklepy = PobierzZaznaczoneSklepy();

    let frazaDoWyswietlenia = tytul;
    if (ean) frazaDoWyswietlenia += ` (EAN: ${ean})`;
    
    const escapedNazwaArtykulu = frazaDoWyswietlenia.replace(/'/g, "\\'");
    const lacznaLiczbaSklepow = wybraneSklepy.length;

    wybraneSklepy.forEach((sklep, index) => {
        const domena = SKLEP_DOMENY[sklep] || "google.com";
        let linkWeryfikacyjny = `https://${domena}`;

        // Przygotowanie frazy podstawowej
        let queryStr = ean ? `${tytul} ${ean}` : tytul;
        
        // --- SPECJALISTYCZNE GENEROWANIE STRINGS DLA RÓŻNYCH SILNIKÓW ---
        
        // 1. Standardowe kodowanie małych liter (wymagane m.in. przez Smyka)
        const encodedQueryLower = encodeURIComponent(queryStr.toLowerCase()); 
        
        // 2. Kodowanie z plusami dla Taniej Książki
        const queryWithPluses = encodeURIComponent(queryStr).replace(/%20/g, '+'); 

        // 3. Konwersja 1:1 dla Tantis (ich lupa zamienia spacje na myślniki, usuwa polskie ogonki i wymusza małe litery)
        const queryForTantis = queryStr.toLowerCase()
            .replace(/ /g, '-')
            .replace(/[ąàáâãäå]/g, 'a')
            .replace(/[ęèéêë]/g, 'e')
            .replace(/[óòóôõöø]/g, 'o')
            .replace(/[śćźż]/g, function(m) {
                return {'ś':'s', 'ć':'c', 'ź':'z', 'ż':'z'}[m];
            })
            .replace(/[ł]/g, 'l')
            .replace(/[ń]/g, 'n');

        // --- PRECYZYJNE MAPOWANIE SILNIKÓW (ODWZOROWANIE FORMULARZY SYSTEMOWYCH) ---
        if (domena.includes('biedronka.pl')) {
            linkWeryfikacyjny = `https://www.biedronka.pl/pl/search?query=${encodeURIComponent(queryStr)}`;
        }
        else if (domena.includes('action.com')) {
            linkWeryfikacyjny = `https://www.action.com/pl-pl/search/?q=${encodeURIComponent(queryStr)}`;
        }
        else if (domena.includes('aldi.pl')) {
            linkWeryfikacyjny = `https://www.aldi.pl/wyszukiwanie.html?q=${encodeURIComponent(queryStr)}`;
        }
        else if (domena.includes('sinsay.com')) {
            linkWeryfikacyjny = `https://www.sinsay.com/pl/pl/catalogsearch/result/?q=${encodeURIComponent(queryStr)}`;
        }
        else if (domena.includes('empik.com')) {
            linkWeryfikacyjny = `https://www.empik.com/szukaj/produkt?q=${encodeURIComponent(queryStr)}`;
        }
        else if (domena.includes('allegro.pl')) {
            linkWeryfikacyjny = `https://allegro.pl/listing?string=${encodeURIComponent(queryStr)}`;
        }
        else if (domena.includes('taniaksiazka.pl')) {
            linkWeryfikacyjny = `https://www.taniaksiazka.pl/szukaj?q=${queryWithPluses}`;
        }
        else if (domena.includes('tantis.pl')) {
            // ODWZOROWANIE LUPY TANTIS: Ich wewnętrzny skrypt kieruje zapytanie bezpośrednio na slug wyszukiwarki bez parametrów ?q=
            linkWeryfikacyjny = `https://tantis.pl/szukaj/${queryForTantis}`;
        }
        else if (domena.includes('smyk.com')) {
            // ODWZOROWANIE LUPY SMYK: Wymuszone małe litery i poprawny punkt wejścia skryptu /szukaj.html
            linkWeryfikacyjny = `https://www.smyk.com/szukaj.html?q=${encodedQueryLower}`;
        }

        mapowanieLinkowBiezegoWyszukania[sklep] = linkWeryfikacyjny;
        const uniqueId = `cena-${index}`;

        const row = document.createElement('tr');
        row.className = "border-b border-gray-100 hover:bg-gray-50/40 transition-colors";

        let htmlZawartosc = "";
        
        if (index === 0) {
            htmlZawartosc += `
                <td class="p-4 font-bold text-gray-900 bg-gray-50/50 align-middle" rowspan="${lacznaLiczbaSklepow}" style="border-right: 1px solid #f3f4f6; max-w-xs break-words;">
                    <div class="text-base">${frazaDoWyswietlenia}</div>
                    <div class="text-xs text-gray-400 font-normal mt-1">Kategoria: ${aktywnaKategoria}</div>
                </td>
            `;
        }

        htmlZawartosc += `
            <td class="p-3 align-middle">
                <div class="flex items-center justify-between gap-4">
                    <span class="font-bold text-gray-700">${sklep}</span>
                    <a href="${linkWeryfikacyjny}" target="_blank" class="inline-flex items-center bg-blue-50 text-blue-700 px-2.5 py-1 rounded-md hover:bg-blue-100 font-bold text-xs gap-1 border border-blue-200/50 no-underline">
                        Otwórz silnik <i data-lucide="external-link" class="w-3 h-3"></i>
                    </a>
                </div>
            </td>
            <td class="p-3 text-right align-middle">
                <div class="inline-flex items-center gap-1">
                    <input type="number" id="${uniqueId}" data-sklep="${sklep}" step="0.01" min="0" placeholder="-" 
                           class="w-24 bg-white border border-gray-300 rounded-lg p-1.5 text-sm font-bold text-right text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none kl-wejscie-ceny">
                    <span class="text-xs font-bold text-gray-500">zł</span>
                </div>
            </td>
        `;

        if (index === 0) {
            htmlZawartosc += `
                <td class="p-3 text-center align-middle bg-gray-50/30" rowspan="${lacznaLiczbaSklepow}" style="border-left: 1px solid #f3f4f6;">
                    <button onclick="ZatwierdzZbiorczyProdukt('${escapedNazwaArtykulu}')" 
                            class="bg-[#002f6c] text-white px-5 py-4 rounded-xl text-sm font-bold hover:bg-emerald-600 transition-all cursor-pointer border-0 flex flex-col items-center gap-1 mx-auto shadow-sm group">
                        <i data-lucide="plus-circle" class="w-5 h-5 text-yellow-400 group-hover:text-white transition-colors"></i> 
                        <span>Uwzględnij</span>
                    </button>
                </td>
            `;
        }

        row.innerHTML = htmlZawartosc;
        tabelaWynikow.appendChild(row);
    });
    
    RenderujIkony();
}

// ==========================================
// 5. ZCZYTYWANIE CEN I BUDOWANIE RAPORTU MACIERZOWEGO
// ==========================================
function InicjalizujNaglowkiRaportu() {
    const naglowek = document.getElementById('naglowek-tabeli-raportu');
    if (!naglowek) return;

    let html = `
        <th class="p-2.5">Data analizy</th>
        <th class="p-2.5">Kategoria</th>
        <th class="p-2.5">Artykuł / Produkt</th>
    `;
    
    aktywneSklepyKategorii.forEach(sklep => {
        html += `<th class="p-2.5 text-right border-l border-gray-200 bg-gray-50">${sklep}</th>`;
    });

    html += `
        <th class="p-2.5 text-center border-l border-gray-200">Linki weryfikacyjne</th>
        <th class="p-2.5 text-center">Akcja</th>
    `;
    naglowek.innerHTML = html;
}

// URUCHAMIANE JEDYNYM PRZYCISKIEM: Pobiera wszystkie ceny i wstawia minusy tam, gdzie pusto
function ZatwierdzZbiorczyProdukt(nazwaArtykulu) {
    const tytulInput = document.getElementById('search-title');
    const eanInput = document.getElementById('search-ean');
    const inputData = document.getElementById('data-analizy');
    
    const dataAnalizy = inputData && inputData.value ? inputData.value : new Date().toLocaleDateString('pl-PL');

    const inputsCen = document.querySelectorAll('.kl-wejscie-ceny');
    let mapyCenProduktów = {};
    let mapyLinkówProduktów = {};

    inputsCen.forEach(input => {
        const sklep = input.getAttribute('data-sklep');
        const cenaWartosc = parseFloat(input.value);

        // Brak jakichkolwiek komunikatów błędu - puste pole = minus i pracujemy dalej!
        if (!isNaN(cenaWartosc) && cenaWartosc > 0) {
            mapyCenProduktów[sklep] = cenaWartosc.toFixed(2).replace('.', ',') + ' zł';
            mapyLinkówProduktów[sklep] = mapowanieLinkowBiezegoWyszukania[sklep] || `https://${SKLEP_DOMENY[sklep]}`;
        } else {
            mapyCenProduktów[sklep] = "-";
            mapyLinkówProduktów[sklep] = "";
        }
    });

    const idPozycji = Date.now() + Math.random().toString(36).substr(2, 5);

    const nowyWpisWiersza = {
        id: idPozycji,
        data: dataAnalizy,
        kategoria: aktywnaKategoria,
        produkt: nazwaArtykulu,
        ceny: mapyCenProduktów,
        linki: mapyLinkówProduktów
    };

    window.listaRaportu.push(nowyWpisWiersza);

    // Automatyczne czyszczenie ekranu wyszukiwania po kliknięciu
    document.getElementById('wyniki-box').classList.add('hidden');
    document.getElementById('tabela-wynikow').innerHTML = '';
    tytulInput.value = '';
    if (eanInput) eanInput.value = '';

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

        aktywneSklepyKategorii.forEach(sklep => {
            const cenaValue = item.ceny[sklep] || "-";
            if (cenaValue !== "-") {
                rowHtml += `<td class="p-2.5 text-right font-black text-emerald-600 border-l border-gray-100 bg-gray-50/30">${cenaValue}</td>`;
            } else {
                rowHtml += `<td class="p-2.5 text-right text-gray-300 italic border-l border-gray-100">-</td>`;
            }
        });

        let linkiHtml = "";
        aktywneSklepyKategorii.forEach(sklep => {
            const url = item.linki[sklep];
            if (url) {
                linkiHtml += `
                    <a href="${url}" target="_blank" title="Link dla sklepu: ${sklep}" 
                       class="inline-flex items-center justify-center w-6 h-6 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-md text-xs font-bold no-underline transition-all border border-blue-100 shadow-xs mx-0.5">
                       ${sklep.charAt(0)}
                    </a>
                `;
            }
        });

        rowHtml += `
            <td class="p-2.5 text-center border-l border-gray-200">
                <div class="flex items-center justify-center">${linkiHtml || '<span class="text-gray-300 italic">-</span>'}</div>
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
// 6. MACIERZOWE GENEROWANIE PLIKÓW XLSX
// ==========================================
function eksportujDoXLSX() {
    if (window.listaRaportu.length === 0) {
        alert("Raport jest pusty!");
        return;
    }

    let tsvNaglowek = ["Data analizy", "Kategoria", "Artykuł / Produkt"];
    aktywneSklepyKategorii.forEach(sklep => tsvNaglowek.push(sklep));
    aktywneSklepyKategorii.forEach(sklep => tsvNaglowek.push(`Link ${sklep}`));
    
    let tsvContent = tsvNaglowek.join("\t") + "\n";

    window.listaRaportu.forEach(item => {
        let tsvWiersz = [item.data, item.kategoria, item.produkt];
        aktywneSklepyKategorii.forEach(sklep => tsvWiersz.push(item.ceny[sklep] || "-"));
        aktywneSklepyKategorii.forEach(sklep => tsvWiersz.push(item.linki[sklep] || "-"));
        tsvContent += tsvWiersz.join("\t") + "\n";
    });

    navigator.clipboard.writeText(tsvContent).then(() => {
        const daneDoExcela = window.listaRaportu.map(item => {
            let rowObj = {
                "Data analizy": item.data,
                "Kategoria": item.kategoria,
                "Artykuł / Produkt": item.produkt
            };
            aktywneSklepyKategorii.forEach(sklep => rowObj[sklep] = item.ceny[sklep] || "-");
            aktywneSklepyKategorii.forEach(sklep => rowObj[`Link ${sklep}`] = item.linki[sklep] || "-");
            return rowObj;
        });

        const worksheet = XLSX.utils.json_to_sheet(daneDoExcela);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Raport Porównawczy");

        let colsSpec = [{wch: 15}, {wch: 15}, {wch: 35}];
        aktywneSklepyKategorii.forEach(() => colsSpec.push({wch: 14}));
        aktywneSklepyKategorii.forEach(() => colsSpec.push({wch: 20}));
        worksheet['!cols'] = colsSpec;

        const inputData = document.getElementById('data-analizy');
        const dataPliku = inputData && inputData.value ? inputData.value : "raport";
        
        XLSX.writeFile(workbook, `Zestawienie_Konkurencji_${dataPliku}.xlsx`);

        alert("Pobrano plik Excel! Skopiowano dane do schowka, wklej je w Google Sheets za pomocą Ctrl+V.");
        window.open("https://sheets.new", "_blank");
    }).catch(err => {
        console.error(err);
        alert("Pobrano plik Excel.");
    });
}

window.pokazEkranGlowny = pokazEkranGlowny;
window.wybierzKategorie = wybierzKategorie;
window.szukajImplementacja = szukajImplementacja;
window.ZatwierdzZbiorczyProdukt = ZatwierdzZbiorczyProdukt;
window.eksportujDoXLSX = eksportujDoXLSX;