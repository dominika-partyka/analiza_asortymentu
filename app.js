// Inicjalizacja ikon Lucide
lucide.createIcons();

// PULA KLUCZY API (Zgodnie z ustaleniami - przygotowana na przyszłe podpięcie zewnętrznego API)
const PULA_KLUCZY_API = [
    "DARMOWY_KLUCZ_Z_MAILA_1_SERPAPI",
    "DARMOWY_KLUCZ_Z_MAILA_2_SERPAPI",
    "DARMOWY_KLUCZ_Z_MAILA_3_SERPAPI"
];
let indeksAktualnegoKlucza = 0;

// ROZBUDOWANA TESTOWA BAZA DANYCH (MOCK-UP)
const BAZA_GAZETEK = [
    { kategoria: "Back to School", sklep: "Biedronka", produkt: "Zeszyt A5 60k w kratkę", cena: 2.99, url: "https://www.biedronka.pl/pl/sklep/artykuły-szkolne/zeszyt-a5" },
    { kategoria: "Back to School", sklep: "Biedronka", produkt: "Kredki świecowe Bambino 24 kolory", cena: 11.49, url: "https://www.biedronka.pl/pl/gazetka/kredki-bambino" },
    { kategoria: "Back to School", sklep: "Aldi", produkt: "Zeszyt A5 60k Oxford premium", cena: 3.49, url: "https://www.aldi.pl/oferty-tygodnia/zeszyt-oxford" },
    { kategoria: "Back to School", sklep: "Aldi", produkt: "Piórnik tuba Milan z wyposażeniem", cena: 24.99, url: "https://www.aldi.pl/oferty-tygodnia/piornik-milan" },
    { kategoria: "Back to School", sklep: "Action", produkt: "Kredki ołówkowe metalowe etui 50 szt", cena: 9.99, url: "https://www.action.com/pl-pl/p/kredki-artystyczne/" },
    { kategoria: "Back to School", sklep: "Action", produkt: "Zeszyt szkolny matowy A5 32k", cena: 0.99, url: "https://www.action.com/pl-pl/p/zeszyt-szkolny-a5/" },
    { kategoria: "Back to School", sklep: "Sinsay", produkt: "Piórnik szkolny z organizerem", cena: 15.99, url: "https://www.sinsay.com/pl/pl/piornik-szkolny-organizer" },
    { kategoria: "Back to School", sklep: "Sinsay", produkt: "Plecak szkolny pastelowy dziewczęcy", cena: 39.99, url: "https://www.sinsay.com/pl/pl/plecak-szkolny-pastel" },

    { kategoria: "Książki", sklep: "Empik", produkt: "Wiedźmin: Ostatnie życzenie - A. Sapkowski", cena: 34.90, url: "https://www.empik.com/wiedxmin-ostatnie-zyczenie" },
    { kategoria: "Książki", sklep: "Tania Książka", produkt: "Wiedźmin: Ostatnie życzenie - A. Sapkowski", cena: 29.80, url: "https://www.taniaksiazka.pl/wiedzmin-ostatnie-zyczenie" },
    
    { kategoria: "Zabawki", sklep: "Smyk", produkt: "Klocki LEGO Technic Wyścigówka", cena: 45.99, url: "https://www.smyk.com/p/lego-technic-samochod" },
    { kategoria: "Zabawki", sklep: "Allegro", produkt: "Gra planszowa Monopoly Classic oryginał", cena: 99.00, url: "https://allegro.pl/oferta/monopoly-classic-gra-planszowa" }
];

// LOKALNY KOSZYK PRZECHOWUJĄCY ELEMENTY DODANE DO ANALIZY / RAPORTU
let KOSZYK_RAPORTU = [];
let aktualnieAnalizowanyObiekt = null;

// Obsługa przełączania kart kategorii
function wybierzKategorie(nazwa, ikona, sklepy) {
    document.getElementById('ekran-glowny').classList.add('hidden');
    document.getElementById('ekran-kategorii').classList.remove('hidden');
    document.getElementById('wyniki-box').classList.add('hidden');
    
    document.getElementById('kat-title').innerText = nazwa;
    const badge = document.getElementById('current-category-badge');
    badge.innerText = nazwa;
    badge.classList.remove('hidden');
    
    const iconBox = document.getElementById('kat-icon-box');
    iconBox.innerHTML = `<i data-lucide="${ikona}" class="w-6 h-6"></i>`;
    
    if(nazwa === 'Książki') iconBox.className = "w-12 h-12 rounded-xl flex items-center justify-center text-white bg-blue-600";
    if(nazwa === 'Back to School') iconBox.className = "w-12 h-12 rounded-xl flex items-center justify-center text-white bg-yellow-500";
    if(nazwa === 'Zabawki') iconBox.className = "w-12 h-12 rounded-xl flex items-center justify-center text-white bg-pink-500";
    
    // Automatyczne wstrzykiwanie dzisiejszej daty
    const dzis = new Date();
    document.getElementById('data-analizy').value = `${dzis.getFullYear()}-${String(dzis.getMonth() + 1).padStart(2, '0')}-${String(dzis.getDate()).padStart(2, '0')}`;

    // Render checkboxów z konkretnymi nazwami
    const sklepyLista = document.getElementById('sklepy-lista');
    sklepyLista.innerHTML = '';
    sklepy.forEach(sklep => {
        sklepyLista.innerHTML += `
            <label class="flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors text-gray-700">
                <input type="checkbox" checked value="${sklep}" onchange="odswiezTabeleRaportu()" class="sklep-checkbox rounded text-blue-600 focus:ring-blue-500">
                <span>${sklep}</span>
            </label>
        `;
    });
    
    // Reset kalkulatora i inputu
    document.getElementById('search-input').value = '';
    document.getElementById('min-price').value = '';
    document.getElementById('target-price').innerText = '0.00 zł';
    document.getElementById('calc-product-name').innerText = "Nie wybrano produktu";
    aktualnieAnalizowanyObiekt = null;
    
    odswiezTabeleRaportu();
    lucide.createIcons();
}

function pokazEkranGlowny() {
    document.getElementById('ekran-kategorii').classList.add('hidden');
    document.getElementById('ekran-glowny').classList.remove('hidden');
    document.getElementById('current-category-badge').classList.add('hidden');
}

// GŁÓWNA OBSŁUGA FUNKCJI SZUKANIA
function szukajImplementacja() {
    const fraza = document.getElementById('search-input').value.trim().toLowerCase();
    const aktualnaKategoria = document.getElementById('kat-title').innerText;
    
    if (!fraza) {
        alert('Wpisz nazwę szukanego produktu!');
        return;
    }
    
    const zaznaczoneSklepy = Array.from(document.querySelectorAll('#sklepy-lista input:checked')).map(cb => cb.value);
    
    // Przyszłościowy mechanizm 'try...catch' dla API oraz pętli puli kluczy:
    // W tej chwili pobiera dane z mock-up błyskawicznie
    const znalezione = BAZA_GAZETEK.filter(item => {
        return item.kategoria === aktualnaKategoria && 
               zaznaczoneSklepy.includes(item.sklep) && 
               item.produkt.toLowerCase().includes(fraza);
    });
    
    const wynikiBox = document.getElementById('wyniki-box');
    const tabelaTbody = document.getElementById('tabela-wynikow');
    
    wynikiBox.classList.remove('hidden');
    tabelaTbody.innerHTML = '';
    
    if (znalezione.length === 0) {
        tabelaTbody.innerHTML = `<tr><td colspan="5" class="p-4 text-center text-gray-400 text-sm">Brak ofert pasujących do frazy w zaznaczonych sklepach.</td></tr>`;
        return;
    }
    
    znalezione.forEach((item, index) => {
        tabelaTbody.innerHTML += `
            <tr class="border-b border-gray-100 hover:bg-gray-50/80 transition-colors">
                <td class="p-3 font-bold text-gray-700">${item.sklep}</td>
                <td class="p-3 text-gray-600 font-medium">${item.produkt}</td>
                <td class="p-3 text-right font-black text-gray-900">${item.cena.toFixed(2)} zł</td>
                <td class="p-3 text-center">
                    <a href="${item.url}" target="_blank" class="text-blue-600 hover:text-blue-800 font-bold underline text-xs">Przejdź</a>
                </td>
                <td class="p-3 text-center">
                    <button onclick="wybierzDoKalkulatora('${item.sklep}', '${item.produkt.replace(/'/g, "\\'")}', ${item.cena}, '${item.url}')" class="bg-blue-50 text-[#002f6c] hover:bg-[#002f6c] hover:text-white px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer">
                        Wybierz
                    </button>
                </td>
            </tr>
        `;
    });
}

// Przepisanie wybranej pozycji do bloku symulatora cenowego
function wybierzDoKalkulatora(sklep, produkt, cena, url) {
    aktualnieAnalizowanyObiekt = { sklep, produkt, cena, url };
    document.getElementById('calc-product-name').innerText = `[${sklep}] ${produkt}`;
    document.getElementById('min-price').value = cena;
    obliczCene();
}

function obliczCene() {
    const minPrice = parseFloat(document.getElementById('min-price').value);
    const discountPercent = parseFloat(document.getElementById('discount-percent').value);
    
    if (!isNaN(minPrice) && !isNaN(discountPercent)) {
        const targetPrice = minPrice * (1 - (discountPercent / 100));
        document.getElementById('target-price').innerText = `${targetPrice.toFixed(2)} zł`;
    } else {
        document.getElementById('target-price').innerText = '0.00 zł';
    }
}

// ZATWIERDZENIE DANYCH DO ETAPU 2 (LOKALNY KOSZYK ANalityczny)
function zatwierdzDoRaportu() {
    if (!aktualnieAnalizowanyObiekt) {
        alert("Wybierz najpierw produkt z tabeli wyników klikając przycisk 'Wybierz'!");
        return;
    }
    
    const cenaKonkurencji = parseFloat(document.getElementById('min-price').value);
    const sugerowanyLidl = parseFloat(document.getElementById('target-price').innerText);
    
    if (isNaN(cenaKonkurencji)) {
        alert("Wprowadź poprawną cenę!");
        return;
    }

    // Szukamy czy dany produkt (grupa produktowa) już istnieje w naszym koszyku raportu
    let produktWKoszyku = KOSZYK_RAPORTU.find(item => item.nazwaWyszukiwana === aktualnieAnalizowanyObiekt.produkt);
    
    if (!produktWKoszyku) {
        produktWKoszyku = {
            nazwaWyszukiwana: aktualnieAnalizowanyObiekt.produkt,
            sugerowanaCenaLidl: sugerowanyLidl,
            ofertySklepowe: {} // Tu będą lądować dane strukturalne
        };
        KOSZYK_RAPORTU.push(produktWKoszyku);
    }
    
    // Zapisujemy cenę oraz link pod adekwatną nazwą sklepu
    produktWKoszyku.ofertySklepowe[aktualnieAnalizowanyObiekt.sklep] = {
        cena: cenaKonkurencji,
        link: aktualnieAnalizowanyObiekt.url
    };
    
    // Aktualizujemy cenę sugerowaną Lidla na najniższą wyliczoną
    if (sugerowanyLidl < produktWKoszyku.sugerowanaCenaLidl) {
        produktWKoszyku.sugerowanaCenaLidl = sugerowanyLidl;
    }

    document.getElementById('raport-box').classList.remove('hidden');
    odswiezTabeleRaportu();
    
    // Mały komunikat informacyjny
    alert(`Dodano dane sieci ${aktualnieAnalizowanyObiekt.sklep} dla produktu do zestawienia zbiorczego.`);
}

// REFRESH TABELI RAPORTU Z ADEKWATNYMI NAZWAMI KOLUMN
function odswiezTabeleRaportu() {
    const checkboxes = Array.from(document.querySelectorAll('#sklepy-lista input'));
    if(checkboxes.length === 0) return;

    // Wyciągamy nazwy tylko tych sieci, które są aktualnie zakliknięte
    const aktywneSklepy = checkboxes.filter(cb => cb.checked).map(cb => cb.value);
    
    const headerRow = document.getElementById('naglowek-tabeli-raportu');
    const bodyTable = document.getElementById('tabela-raportu-body');
    
    // 1. Budujemy nagłówki dynamicznie - adekwatne nazwy kolumn
    let htmlNaglowka = `<th class="p-3">Nazwa artykułu</th>`;
    aktywneSklepy.forEach(sklep => {
        htmlNaglowka += `<th class="p-3 text-center bg-gray-50">Cena ${sklep}</th>`;
        htmlNaglowka += `<th class="p-3 text-center">Link ${sklep}</th>`;
    });
    htmlNaglowka += `<th class="p-3 text-right bg-blue-50 text-[#002f6c]">Sugerowany Lidl</th>`;
    headerRow.innerHTML = htmlNaglowka;
    
    // 2. Wypełniamy wiersze tabeli danymi z koszyka
    bodyTable.innerHTML = '';
    if (KOSZYK_RAPORTU.length === 0) {
        headerRow.innerHTML = '';
        document.getElementById('raport-box').classList.add('hidden');
        return;
    }
    
    KOSZYK_RAPORTU.forEach(item => {
        let wierszHtml = `<tr class="border-b border-gray-100 hover:bg-gray-50/50">`;
        wierszHtml += `<td class="p-3 font-medium text-gray-800">${item.nazwaWyszukiwana}</td>`;
        
        aktywneSklepy.forEach(sklep => {
            const daneSklepu = item.ofertySklepowe[sklep];
            if (daneSklepu) {
                wierszHtml += `<td class="p-3 text-center font-bold text-gray-700 bg-gray-50/50">${daneSklepu.cena.toFixed(2)} zł</td>`;
                wierszHtml += `<td class="p-3 text-center"><a href="${daneSklepu.link}" target="_blank" class="text-blue-500 underline">Przejdź</a></td>`;
            } else {
                // Puste komórki jeśli dla tej sieci jeszcze nie dodałaś ceny
                wierszHtml += `<td class="p-3 text-center text-gray-300 bg-gray-50/50">—</td>`;
                wierszHtml += `<td class="p-3 text-center text-gray-300">—</td>`;
            }
        });
        
        wierszHtml += `<td class="p-3 text-right font-black text-[#002f6c] bg-blue-50/30">${item.sugerowanaCenaLidl.toFixed(2)} zł</td>`;
        wierszHtml += `</tr>`;
        bodyTable.innerHTML += wierszHtml;
    });
    
    lucide.createIcons();
}

// FUNKCJA EKSPORTUJĄCA STRUKTURALNY PLIK CSV DLA GOOGLE SHEETS
function eksportujDoCSV() {
    const aktywneSklepy = Array.from(document.querySelectorAll('#sklepy-lista input:checked')).map(cb => cb.value);
    
    if (KOSZYK_RAPORTU.length === 0) {
        alert("Twój raport jest pusty!");
        return;
    }
    
    // Budowanie nagłówków arkusza w pliku tekstowym CSV
    let linieCsv = [];
    let naglowki = ["Nazwa artykulu"];
    aktywneSklepy.forEach(sklep => {
        naglowki.push(`Cena ${sklep}`);
        naglowki.push(`Link ${sklep}`);
    });
    naglowki.push("Sugerowana Cena Lidl");
    linieCsv.push(naglowki.join(";")); // Separator średnikowy - idealny dla Excel/Google Sheets w PL
    
    // Mapowanie rekordów z koszyka do kolumn
    KOSZYK_RAPORTU.forEach(item => {
        let wiersz = [ `"${item.nazwaWyszukiwana.replace(/"/g, '""')}"` ]; // Zabezpieczenie cudzysłowów
        
        aktywneSklepy.forEach(sklep => {
            const daneSklepu = item.ofertySklepowe[sklep];
            if (daneSklepu) {
                wiersz.push(`"${daneSklepu.cena.toFixed(2).replace('.', ',')}"`); // Zamiana kropki na przecinek pod Excel PL
                wiersz.push(`"${daneSklepu.link}"`);
            } else {
                wiersz.push('""');
                wiersz.push('""');
            }
        });
        
        wiersz.push(`"${item.sugerowanaCenaLidl.toFixed(2).replace('.', ',')}"`);
        linieCsv.push(wiersz.join(";"));
    });
    
    // Generowanie i pobieranie pliku z kodowaniem UTF-8 (obsługa polskich znaków)
    const zawartoscCsv = "\uFEFF" + linieCsv.join("\n");
    const blob = new Blob([zawartoscCsv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const linkPobierania = document.createElement("a");
    const dataAnalizy = document.getElementById('data-analizy').value;
    linkPobierania.setAttribute("href", url);
    linkPobierania.setAttribute("download", `Raport_Cenowy_Konkurencja_${dataAnalizy}.csv`);
    document.body.appendChild(linkPobierania);
    
    linkPobierania.click();
    document.body.removeChild(linkPobierania);
}