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
    "Świat Książki": "swiatksiazki.pl",
    "Allegro": "allegro.pl"
};

// Tutaj na sztywno definiujemy sklepy, dzięki czemu zawsze wyświetlą się poprawnie!
const SKLEPY_KATEGORII = {
    "Książki": ["Empik", "Tania Książka", "Świat Książki", "Smyk"],
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

// ==========================================
// 2. INICJALIZACJA I OBSŁUGA STARTOWA
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    RenderujIkony();
    UstawDzisiejszaDate();
    pokazEkranGlowny();
    InicjalizujNaglowkiRaportu();
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
}

function wybierzKategorie(nazwaKategorii, ikona) {
    aktywnaKategoria = nazwaKategorii;
    // Pobieranie sklepów prosto z naszej bezpiecznej mapy JS
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

    // Czyszczenie pól i tabeli
    document.getElementById('wyniki-box').classList.add('hidden');
    document.getElementById('tabela-wynikow').innerHTML = '';
    document.getElementById('search-title').value = '';
    document.getElementById('search-ean').value = '';

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
// 4. DWUPOLOWA WYSZUKIWARKA (TYTUŁ + EAN)
// ==========================================
function szukajImplementacja() {
    const tytułInput = document.getElementById('search-title');
    const eanInput = document.getElementById('search-ean');
    
    const tytul = tytułInput ? tytułInput.value.trim() : "";
    const ean = eanInput ? eanInput.value.trim() : "";

    if (!tytul && !ean) {
        alert('Wprowadź Tytuł/Nazwę, kod EAN lub oba te parametry!');
        return;
    }

    const wynikiBox = document.getElementById('wyniki-box');
    const tabelaWynikow = document.getElementById('tabela-wynikow');

    wynikiBox.classList.remove('hidden');
    tabelaWynikow.innerHTML = '';

    const wybraneSklepy = PobierzZaznaczoneSklepy();

    // Definiujemy, co przekazać do wyszukiwarki sklepu
    let frazaDoWyswietlenia = "";
    if (tytul && ean) frazaDoWyswietlenia = `${tytul} (EAN: ${ean})`;
    else if (tytul) frazaDoWyswietlenia = tytul;
    else frazaDoWyswietlenia = `EAN: ${ean}`;

    wybraneSklepy.forEach((sklep, index) => {
        const domena = SKLEP_DOMENY[sklep] || "google.com";
        let linkWeryfikacyjny = `https://${domena}`;

        // Budowanie optymalnego zapytania dla danej konfiguracji pól
        let queryStr = "";
        if (tytul && ean) {
            // Sklepy internetowe rzadko radzą sobie z jednoczesnym szukaniem tekstu i kodu w jednym polu.
            // Strategia: szukamy po EAN, bo jest unikalny, a jeśli sklep go nie trawi, Google załatwi sprawę.
            queryStr = ean; 
        } else {
            queryStr = tytul || ean;
        }

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
        else if (domena.includes('swiatksiazki.pl')) linkWeryfikacyjny = `https://www.swiatksiazki.pl/catalogsearch/result/?q=${encodedQuery}`;

        // Jeśli szukamy po EAN (lub oba) a sklep to np. wspomniany Tantis czy inny wrażliwy system,
        // Google z parametrem site: uratuje sytuację. Na tym etapie Smyk, Empik czy TaniaKsiążka świetnie łykają czysty EAN.
        if (ean && !domena.includes('empik.com') && !domena.includes('taniaksiazka.pl') && !domena.includes('swiatksiazki.pl') && !domena.includes('smyk.com') && !domena.includes('allegro.pl')) {
            linkWeryfikacyjny = `https://www.google.com/search?q=site:${domena}+${encodedQuery}`;
        }

        const uniqueId = `cena-${index}`;

        // Co ma zapisać się jako nazwa produktu w ostatecznym raporcie:
        const ostatecznaNazwaRaportu = tytul ? tytul : `EAN: ${ean}`;

        const row = document.createElement('tr');
        row.className = "border-b border-gray-100 hover:bg-gray-50/80 transition-colors";
        row.innerHTML = `
            <td class="p-3 font-bold text-gray-700">${sklep}</td>
            <td class="p-3">
                <div class="font-semibold text-gray-900">${frazaDoWyswietlenia}</div>
                <div class="text-xs text-gray-400 max-w-md truncate">Wyszukiwanie w oparciu o silnik domeny ${domena}</div>
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
                <button onclick="ZatwierdzPozycje('${sklep}', '${uniqueId}', '${ostatecznaNazwaRaportu.replace(/'/g, "\\'")}')" 
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
// 5. OBSŁUGA LISTY RAPORTU ORAZ USUWANIA
// ==========================================
function InicjalizujNaglowkiRaportu() {
    const naglowek = document.getElementById('naglowek-tabeli-raportu');
    if (naglowek) {
        naglowek.innerHTML = `
            <th class="p-2.5">Data</th>
            <th class="p-2.5">Kategoria</th>
            <th class="p-2.5">Sklep</th>
            <th class="p-2.5">Artykuł / Produkt</th>
            <th class="p-2.5 text-right">Cena</th>
            <th class="p-2.5 text-center">Akcja</th>
        `;
    }
}

function ZatwierdzPozycje(sklep, inputId, domyslnaNazwa) {
    const cenaInput = document.getElementById(inputId);
    const cenaWpisana = parseFloat(cenaInput.value);

    if (isNaN(cenaWpisana) || cenaWpisana <= 0) {
        alert('Wpisz poprawną, sprawdzoną cenę przed dodaniem do raportu!');
        return;
    }

    const sformatowanaCena = cenaWpisana.toFixed(2).replace('.', ',') + ' zł';
    WstrzyknijDoTabeliRaportu(sklep, domyslnaNazwa, sformatowanaCena);
    cenaInput.value = '';
}

function WstrzyknijDoTabeliRaportu(sklep, produkt, cena) {
    const raportBox = document.getElementById('raport-box');
    const tabelaBody = document.getElementById('tabela-raportu-body');
    const inputData = document.getElementById('data-analizy');
    const dataAnalizy = inputData && inputData.value ? inputData.value : new Date().toLocaleDateString('pl-PL');

    if (raportBox) raportBox.classList.remove('hidden');

    const idPozycji = Date.now() + Math.random().toString(36).substr(2, 5);

    const nowaPozycja = {
        id: idPozycji,
        data: dataAnalizy,
        kategoria: aktywnaKategoria,
        sklep: sklep,
        produkt: produkt,
        cena: cena
    };

    window.listaRaportu.push(nowaPozycja);

    if (tabelaBody) {
        const row = document.createElement('tr');
        row.id = `row-${idPozycji}`;
        row.className = "border-b border-gray-100 hover:bg-gray-50/50 transition-colors";
        row.innerHTML = `
            <td class="p-2.5 text-gray-500">${nowaPozycja.data}</td>
            <td class="p-2.5 font-medium text-gray-600">${nowaPozycja.kategoria}</td>
            <td class="p-2.5 font-bold text-gray-800">${nowaPozycja.sklep}</td>
            <td class="p-2.5 text-gray-900">${nowaPozycja.produkt}</td>
            <td class="p-2.5 text-right font-bold text-emerald-600">${nowaPozycja.cena}</td>
            <td class="p-2.5 text-center">
                <button onclick="UsunZRaportu('${idPozycji}')" class="text-red-500 hover:text-red-700 font-bold p-1 border-0 bg-transparent cursor-pointer text-xs flex items-center gap-0.5 mx-auto">
                     <i data-lucide="trash-2" class="w-3.5 h-3.5"></i> Usuń
                </button>
            </td>
        `;
        tabelaBody.appendChild(row);
        RenderujIkony();
    }
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
// 6. EKSPORT DO EXCELA ORAZ GOOGLE SHEETS
// ==========================================
function eksportujDoXLSX() {
    if (window.listaRaportu.length === 0) {
        alert("Raport jest pusty! Dodaj najpierw ceny.");
        return;
    }

    let tsvContent = "Data analizy\tKategoria\tSklep\tArtykuł / Produkt\tCena rynkowa\n";
    window.listaRaportu.forEach(item => {
        tsvContent += `${item.data}\t${item.kategoria}\t${item.sklep}\t${item.produkt}\t${item.cena}\n`;
    });

    navigator.clipboard.writeText(tsvContent).then(() => {
        const daneDoExcela = window.listaRaportu.map(item => ({
            "Data analizy": item.data,
            "Kategoria": item.kategoria,
            "Sklep": item.sklep,
            "Artykuł / Produkt": item.produkt,
            "Cena rynkowa": item.cena
        }));

        const worksheet = XLSX.utils.json_to_sheet(daneDoExcela);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Analiza Cenowa");

        worksheet['!cols'] = [{wch: 15}, {wch: 20}, {wch: 15}, {wch: 40}, {wch: 15}];

        const inputData = document.getElementById('data-analizy');
        const dataPliku = inputData && inputData.value ? inputData.value : "raport";
        
        XLSX.writeFile(workbook, `Raport_Cenowy_${dataPliku}.xlsx`);

        alert("Sukces!\n1. Pobrano plik Raportu w formacie XLSX.\n2. Dane tabeli skopiowano automatycznie do Twojego schowka!\n\nZostaniesz przeniesiony do Google Sheets. Kliknij dowolną komórkę i użyj Ctrl + V, aby wkleić dane.");
        window.open("https://sheets.new", "_blank");
        
    }).catch(err => {
        console.error('Błąd zapisu do schowka: ', err);
        alert("Pobrano plik Excel, ale wystąpił problem z automatycznym kopiowaniem do schowka.");
    });
}

// Mapowanie pod kontekst globalny window
window.pokazEkranGlowny = pokazEkranGlowny;
window.wybierzKategorie = wybierzKategorie;
window.szukajImplementacja = szukajImplementacja;
window.ZatwierdzPozycje = ZatwierdzPozycje;
window.UsunZRaportu = UsunZRaportu;
window.eksportujDoXLSX = eksportujDoXLSX;