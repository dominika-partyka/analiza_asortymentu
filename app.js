// Globalna tablica na raport (upewnij się, że nie jest deklarowana ponownie w innym miejscu jako pusta)
if (typeof listaRaportu === 'undefined') {
    window.listaRaportu = [];
}

// Główna implementacja: Profesjonalny panel weryfikacji i ręcznego wprowadzania cen
async function szukajImplementacja() {
    const query = document.getElementById('search-input').value.trim();
    const tabelaWynikow = document.getElementById('tabela-wynikow');
    const wynikiBox = document.getElementById('wyniki-box');

    if (!query) {
        alert('Wpisz nazwę poszukiwanego artykułu!');
        return;
    }

    wynikiBox.classList.remove('hidden');
    tabelaWynikow.innerHTML = '';

    // Pobieramy zaznaczone lub aktywne sklepy
    const szukaneDomeny = wybraneSklepyFiltru
        .map(sklep => SKLEP_DOMENY[sklep])
        .filter(domena => domena !== undefined);

    const ostateczneDomeny = szukaneDomeny.length > 0 ? szukaneDomeny : aktywneSklepy.map(s => SKLEP_DOMENY[s]);

    ostateczneDomeny.forEach((domena, index) => {
        let nazwaSklepu = 'Konkurencja';
        for (const [klucz, val] of Object.entries(SKLEP_DOMENY)) {
            if (val === domena) nazwaSklepu = klucz;
        }

        // Generowanie precyzyjnych linków wyszukiwania dla sieci handlowych
        let linkWeryfikacyjny = `https://${domena}`;
        const encodedQuery = encodeURIComponent(query);

        if (domena.includes('biedronka.pl')) {
            linkWeryfikacyjny = `https://www.biedronka.pl/pl/search?query=${encodedQuery}`;
        } else if (domena.includes('action.com')) {
            linkWeryfikacyjny = `https://www.action.com/pl-pl/search/?q=${encodedQuery}`;
        } else if (domena.includes('aldi.pl')) {
            linkWeryfikacyjny = `https://www.aldi.pl/wyszukiwanie.html?q=${encodedQuery}`;
        } else if (domena.includes('sinsay.com')) {
            linkWeryfikacyjny = `https://www.sinsay.com/pl/pl/catalogsearch/result/?q=${encodedQuery}`;
        } else if (domena.includes('empik.com')) {
            linkWeryfikacyjny = `https://www.empik.com/szukaj/produkt?q=${encodedQuery}`;
        } else if (domena.includes('taniaksiazka.pl')) {
            linkWeryfikacyjny = `https://www.taniaksiazka.pl/szukaj/zapytanie=${encodedQuery}`;
        } else if (domena.includes('swiatksiazki.pl')) {
            linkWeryfikacyjny = `https://www.swiatksiazki.pl/catalogsearch/result/?q=${encodedQuery}`;
        } else if (domena.includes('smyk.com')) {
            linkWeryfikacyjny = `https://www.smyk.com/catalogsearch/result/?q=${encodedQuery}`;
        } else if (domena.includes('allegro.pl')) {
            linkWeryfikacyjny = `https://allegro.pl/listing?string=${encodedQuery}`;
        }

        const uniqueId = `cena-${index}`;

        const row = document.createElement('tr');
        row.className = "border-b border-gray-50 hover:bg-gray-50/80 transition-colors";
        row.innerHTML = `
            <td class="p-3 font-bold text-gray-700">${nazwaSklepu}</td>
            <td class="p-3">
                <div class="font-semibold text-gray-900">${query}</div>
                <div class="text-xs text-gray-400 max-w-md truncate">Zweryfikuj dostępność klikając przycisk obok.</div>
            </td>
            <td class="p-3 text-right">
                <div class="inline-flex items-center gap-1">
                    <input type="number" id="${uniqueId}" step="0.01" min="0" placeholder="0.00" 
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
                <button onclick="ZatwierdzPozycje('${nazwaSklepu}', '${uniqueId}')" 
                        class="bg-gray-900 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-blue-700 transition-all cursor-pointer border-0 flex items-center gap-1 mx-auto">
                    <i data-lucide="plus" class="w-3 h-3"></i> Uwzględnij
                </button>
            </td>
        `;
        tabelaWynikow.appendChild(row);
    });
    
    lucide.createIcons();
}

// Funkcja pośrednicząca do bezpiecznego odczytu ceny i przekazania do raportu
function ZatwierdzPozycje(sklep, inputId) {
    const query = document.getElementById('search-input').value.trim();
    const cenaInput = document.getElementById(inputId);
    const cenaWpisana = parseFloat(cenaInput.value);

    if (isNaN(cenaWpisana) || cenaWpisana <= 0) {
        alert('Wpisz poprawną, zweryfikowaną cenę produktu przed dodaniem do raportu!');
        return;
    }

    const sformatowanaCena = cenaWpisana.toFixed(2).replace('.', ',') + ' zł';
    
    // Wywołanie właściwej logiki dodawania do raportu
    if (typeof dodajDoRaportu === 'function') {
        dodajDoRaportu(sklep, query, sformatowanaCena);
    } else {
        // Awaryjna implementacja jeśli główna funkcja raportująca w app.js ma inną strukturę
        WstrzyknijDoTabeliRaportu(sklep, query, sformatowanaCena);
    }
}

// Naprawiony mechanizm renderowania dolnej bazy do eksportu
function WstrzyknijDoTabeliRaportu(sklep, produkt, cena) {
    const raportBox = document.getElementById('raport-box');
    const tabelaBody = document.getElementById('tabela-raportu-body');
    const naglowekRaportu = document.getElementById('naglowek-tabeli-raportu');
    const dataAnalizy = document.getElementById('data-analizy').value || new Date().toLocaleDateString('pl-PL');

    raportBox.classList.remove('hidden');

    // Budowanie nagłówków jeśli puste
    if (naglowekRaportu && naglowekRaportu.children.length === 0) {
        naglowekRaportu.innerHTML = `
            <th class="p-2.5">Data analizy</th>
            <th class="p-2.5">Kategoria</th>
            <th class="p-2.5">Sklep</th>
            <th class="p-2.5">Artykuł</th>
            <th class="p-2.5 text-right">Cena rynkowa</th>
        `;
    }

    const nowaPozycja = {
        data: dataAnalizy,
        kategoria: aktywnaKategoria || 'Ogólna',
        sklep: sklep,
        produkt: produkt,
        cena: cena
    };

    window.listaRaportu.push(nowaPozycja);

    const row = document.createElement('tr');
    row.className = "border-b border-gray-100 hover:bg-gray-50/50";
    row.innerHTML = `
        <td class="p-2.5 text-gray-500">${nowaPozycja.data}</td>
        <td class="p-2.5 font-medium text-gray-600">${nowaPozycja.kategoria}</td>
        <td class="p-2.5 font-bold text-gray-800">${nowaPozycja.sklep}</td>
        <td class="p-2.5 text-gray-900">${nowaPozycja.produkt}</td>
        <td class="p-2.5 text-right font-bold text-gray-900">${nowaPozycja.cena}</td>
    `;
    tabelaBody.appendChild(row);
}