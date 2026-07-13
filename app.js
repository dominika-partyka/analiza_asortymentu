// ==========================================
// 1. CONFIGURATION AND GLOBAL VARIABLES
// ==========================================
const GOOGLE_API_KEY = "AIzaSyD...[TWOJ_KLUCZ_API]"; // Put your actual API key here
const GOOGLE_CX = "5393052c79d0c4c4a";

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

let aktywneSklepy = ["Biedronka", "Aldi", "Sinsay", "Action"];
let wybraneSklepyFiltru = [];
let aktywnaKategoria = "Back to School";

if (typeof window.listaRaportu === 'undefined') {
    window.listaRaportu = [];
}

// ==========================================
// 2. CORE INITIALIZATION & MENU NAVIGATION
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    // 1. Initialise Lucide Icons safely
    RenderujIkony();

    // 2. Setup dates and filters
    InicjalizujObslugeFiltrow();
    UstawDzisiejszaDate();
    
    // 3. NAVIGATION: Fixes the unclickable "Back to School" tile
    const kafelkiMenu = document.querySelectorAll('[data-kategoria]');
    const sekcjaMenu = document.getElementById('main-menu') || document.querySelector('.grid');
    const sekcjaPanelu = document.getElementById('panel-analityczny') || document.body.firstElementChild; 
    const btnPowrot = document.getElementById('btn-powrot') || document.querySelector('header button') || document.querySelector('button');

    // Dynamic switching between home menu and the tool panel
    kafelkiMenu.forEach(kafelek => {
        kafelek.addEventListener('click', () => {
            const kat = kafelek.getAttribute('data-kategoria') || "Back to School";
            aktywnaKategoria = kat;
            
            // Show panel, hide main grid
            if(sekcjaMenu) sekcjaMenu.classList.add('hidden');
            if(sekcjaPanelu) sekcjaPanelu.classList.remove('hidden');
            
            const naglowekKat = document.getElementById('nazwa-aktywnej-kategorii') || document.querySelector('h1');
            if (naglowekKat) naglowekKat.innerText = kat;
        });
    });

    if (btnPowrot) {
        btnPowrot.addEventListener('click', () => {
            if(sekcjaPanelu) sekcjaPanelu.classList.add('hidden');
            if(sekcjaMenu) sekcjaMenu.classList.remove('hidden');
        });
    }
    
    // 4. SEARCH TRIGGER LINKS
    const btnSzukaj = document.getElementById('search-button') || document.querySelector('.bg-blue-900') || document.querySelector('button[onclick*="szukaj"]');
    if (btnSzukaj) {
        btnSzukaj.addEventListener('click', szukajImplementacja);
    }
    
    const inputSzukaj = document.getElementById('search-input');
    if (inputSzukaj) {
        inputSzukaj.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') szukajImplementacja();
        });
    }
});

function RenderujIkony() {
    if (window.lucide) {
        window.lucide.createIcons();
    } else {
        // Fallback injection if CDN is loading slow
        setTimeout(() => { if (window.lucide) window.lucide.createIcons(); }, 1000);
    }
}

// ==========================================
// 3. INTERFACE COMPLEMENTS
// ==========================================
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

function InicjalizujObslugeFiltrow() {
    const checkboxes = document.querySelectorAll('input[type="checkbox"]');
    wybraneSklepyFiltru = [];
    
    checkboxes.forEach(cb => {
        const labelText = cb.parentElement.textContent.trim();
        if (aktywneSklepy.includes(labelText)) {
            cb.checked = true;
            if (!wybraneSklepyFiltru.includes(labelText)) wybraneSklepyFiltru.push(labelText);
        }

        cb.addEventListener('change', () => {
            wybraneSklepyFiltru = [];
            checkboxes.forEach(c => {
                if (c.checked) {
                    wybraneSklepyFiltru.push(c.parentElement.textContent.trim());
                }
            });
        });
    });
}

function znajdzCeneWOpisie(tekst) {
    if (!tekst) return "";
    const regex = /(\d+[\.,]\d{2}|\d+)\s*(?:zł|zl|pln)/i;
    const match = tekst.match(regex);
    return match ? match[1].replace(',', '.') : "";
}

// ==========================================
// 4. HYBRID ENGINE (AUTO API + MANUAL OVERRIDE)
// ==========================================
async function szukajImplementacja() {
    const queryInput = document.getElementById('search-input');
    if (!queryInput) return;
    
    const query = queryInput.value.trim();
    const tabelaWynikow = document.getElementById('tabela-wynikow');
    const wynikiBox = document.getElementById('wyniki-box');

    if (!query) {
        alert('Wpisz nazwę poszukiwanego artykułu!');
        return;
    }

    wynikiBox.classList.remove('hidden');
    tabelaWynikow.innerHTML = `
        <tr>
            <td colspan="5" class="p-6 text-center text-sm text-gray-500 font-medium">
                <span class="inline-block animate-spin mr-2">⏳</span> Pobieram dane i przygotowuję arkusz weryfikacji...
            </td>
        </tr>
    `;

    let googleItems = [];
    try {
        const url = `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_API_KEY}&cx=${GOOGLE_CX}&q=${encodeURIComponent(query)}`;
        const response = await fetch(url);
        const data = await response.json();
        if (data.items) googleItems = data.items;
    } catch (e) {
        console.log("Google API status override.");
    }

    tabelaWynikow.innerHTML = '';
    const ostateczneSklepy = wybraneSklepyFiltru.length > 0 ? wybraneSklepyFiltru : aktywneSklepy;

    ostateczneSklepy.forEach((sklep, index) => {
        const domena = SKLEP_DOMENY[sklep] || "google.com";
        let znalezionyOpis = "Brak automatycznego dopasowania. Kliknij 'Otwórz sklep' i wprowadź cenę ręcznie.";
        let automatycznaCena = "";

        const dopasowanyWynik = googleItems.find(item => item.link.toLowerCase().includes(domena.toLowerCase()));
        if (dopasowanyWynik) {
            znalezionyOpis = dopasowanyWynik.title + " - " + (dopasowanyWynik.snippet || "");
            automatycznaCena = znajdzCeneWOpisie(dopasowanyWynik.snippet || "");
        }

        let linkWeryfikacyjny = `https://${domena}`;
        const encodedQuery = encodeURIComponent(query);

        if (domena.includes('biedronka.pl')) linkWeryfikacyjny = `https://www.biedronka.pl/pl/search?query=${encodedQuery}`;
        else if (domena.includes('action.com')) linkWeryfikacyjny = `https://www.action.com/pl-pl/search/?q=${encodedQuery}`;
        else if (domena.includes('aldi.pl')) linkWeryfikacyjny = `https://www.aldi.pl/wyszukiwanie.html?q=${encodedQuery}`;
        else if (domena.includes('sinsay.com')) linkWeryfikacyjny = `https://www.sinsay.com/pl/pl/catalogsearch/result/?q=${encodedQuery}`;
        else if (domena.includes('empik.com')) linkWeryfikacyjny = `https://www.empik.com/szukaj/produkt?q=${encodedQuery}`;
        else if (domena.includes('allegro.pl')) linkWeryfikacyjny = `https://allegro.pl/listing?string=${encodedQuery}`;

        const uniqueId = `cena-${index}`;

        const row = document.createElement('tr');
        row.className = "border-b border-gray-50 hover:bg-gray-50/80 transition-colors";
        row.innerHTML = `
            <td class="p-3 font-bold text-gray-700">${sklep}</td>
            <td class="p-3">
                <div class="font-semibold text-gray-900">${query}</div>
                <div class="text-xs text-gray-400 max-w-md truncate">${znalezionyOpis}</div>
            </td>
            <td class="p-3 text-right">
                <div class="inline-flex items-center gap-1">
                    <input type="number" id="${uniqueId}" step="0.01" min="0" value="${automatycznaCena}" placeholder="0.00" 
                           class="w-20 bg-white border border-gray-300 rounded-lg p-1.5 text-sm font-bold text-right text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none">
                    <span class="text-xs font-bold text-gray-500">zł</span>
                </div>
            </td>
            <td class="p-3 text-center">
                <a href="${linkWeryfikacyjny}" target="_blank" class="inline-flex items-center bg-blue-50 text-blue-700 px-2.5 py-1 rounded-md hover:bg-blue-100 font-bold text-xs gap-1 no-underline border border-blue-200/60 shadow-sm">
                    Otwórz sklep <i data-lucide="external-link" class="w-3 h-3"></i>
                </a>
            </td>
            <td class="p-3 text-center">
                <button onclick="ZatwierdzPozycje('${sklep}', '${uniqueId}')" 
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
// 5. REPORT GENERATION & EXCEL EXPORT
// ==========================================
function ZatwierdzPozycje(sklep, inputId) {
    const query = document.getElementById('search-input').value.trim();
    const cenaInput = document.getElementById(inputId);
    const cenaWpisana = parseFloat(cenaInput.value);

    if (isNaN(cenaWpisana) || cenaWpisana <= 0) {
        alert('Wpisz poprawną cenę przed dodaniem do raportu!');
        return;
    }

    const sformatowanaCena = cenaWpisana.toFixed(2).replace('.', ',') + ' zł';
    WstrzyknijDoTabeliRaportu(sklep, query, sformatowanaCena);
}

function WstrzyknijDoTabeliRaportu(sklep, produkt, cena) {
    const raportBox = document.getElementById('raport-box');
    const tabelaBody = document.getElementById('tabela-raportu-body');
    const inputData = document.getElementById('data-analizy');
    const dataAnalizy = inputData ? inputData.value : new Date().toLocaleDateString('pl-PL');

    if (raportBox) raportBox.classList.remove('hidden');

    const nowaPozycja = {
        data: dataAnalizy,
        kategoria: aktywnaKategoria,
        sklep: sklep,
        produkt: produkt,
        cena: cena
    };

    window.listaRaportu.push(nowaPozycja);

    if (tabelaBody) {
        const row = document.createElement('tr');
        row.className = "border-b border-gray-100 hover:bg-gray-50/50";
        row.innerHTML = `
            <td class="p-2.5 text-gray-500">${nowaPozycja.data}</td>
            <td class="p-2.5 font-medium text-gray-600">${nowaPozycja.kategoria}</td>
            <td class="p-2.5 font-bold text-gray-800">${nowaPozycja.sklep}</td>
            <td class="p-2.5 text-gray-900">${nowaPozycja.produkt}</td>
            <td class="p-2.5 text-right font-bold text-emerald-600">${nowaPozycja.cena}</td>
        `;
        tabelaBody.appendChild(row);
    }
}

function eksportujDoExcel() {
    if (window.listaRaportu.length === 0) {
        alert("Raport jest pusty!");
        return;
    }

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
    const dataPliku = inputData ? inputData.value : "raport";
    
    XLSX.writeFile(workbook, `Raport_Cenowy_Konkurencja_${dataPliku}.xlsx`);
}

window.ZatwierdzPozycje = ZatwierdzPozycje;
window.eksportujDoExcel = eksportujDoExcel;