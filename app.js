// Inicjalizacja ikon Lucide
lucide.createIcons();

// ROZBUDOWANA TESTOWA BAZA DANYCH (MOCK-UP) - dodane ID dla bezbłędnego klikania
const BAZA_GAZETEK = [
    { id: 0, kategoria: "Back to School", sklep: "Biedronka", produkt: "Zeszyt A5 60k w kratkę", cena: 2.99, url: "https://www.biedronka.pl/pl/sklep/artykuły-szkolne/zeszyt-a5" },
    { id: 1, kategoria: "Back to School", sklep: "Biedronka", produkt: "Kredki świecowe Bambino 24 kolory", cena: 11.49, url: "https://www.biedronka.pl/pl/gazetka/kredki-bambino" },
    { id: 2, kategoria: "Back to School", sklep: "Aldi", produkt: "Zeszyt A5 60k Oxford premium", cena: 3.49, url: "https://www.aldi.pl/oferty-tygodnia/zeszyt-oxford" },
    { id: 3, kategoria: "Back to School", sklep: "Aldi", produkt: "Piórnik tuba Milan z wyposażeniem", cena: 24.99, url: "https://www.aldi.pl/oferty-tygodnia/piornik-milan" },
    { id: 4, kategoria: "Back to School", sklep: "Action", produkt: "Kredki ołówkowe metalowe etui 50 szt", cena: 9.99, url: "https://www.action.com/pl-pl/p/kredki-artystyczne/" },
    { id: 5, kategoria: "Back to School", sklep: "Action", produkt: "Zeszyt szkolny matowy A5 32k", cena: 0.99, url: "https://www.action.com/pl-pl/p/zeszyt-szkolny-a5/" },
    { id: 6, kategoria: "Back to School", sklep: "Sinsay", produkt: "Piórnik szkolny z organizerem", cena: 15.99, url: "https://www.sinsay.com/pl/pl/piornik-szkolny-organizer" },
    { id: 7, kategoria: "Back to School", sklep: "Sinsay", produkt: "Plecak szkolny pastelowy dziewczęcy", cena: 39.99, url: "https://www.sinsay.com/pl/pl/plecak-szkolny-pastel" },

    { id: 8, kategoria: "Książki", sklep: "Empik", produkt: "Wiedźmin: Ostatnie życzenie - A. Sapkowski", cena: 34.90, url: "https://www.empik.com/wiedxmin-ostatnie-zyczenie" },
    { id: 9, kategoria: "Książki", sklep: "Tania Książka", produkt: "Wiedźmin: Ostatnie życzenie - A. Sapkowski", cena: 29.80, url: "https://www.taniaksiazka.pl/wiedzmin-ostatnie-zyczenie" },
    
    { id: 10, kategoria: "Zabawki", sklep: "Smyk", produkt: "Klocki LEGO Technic Wyścigówka", cena: 45.99, url: "https://www.smyk.com/p/lego-technic-samochod" },
    { id: 11, kategoria: "Zabawki", sklep: "Allegro", produkt: "Gra planszowa Monopoly Classic oryginał", cena: 99.00, url: "https://allegro.pl/oferta/monopoly-classic-gra-planszowa" }
];

// KOSZYK PRZECHOWUJĄCY ELEMENTY DODANE DO RAPORTU
let KOSZYK_RAPORTU = [];
let ostatniaFraza = "";
let ostatniaKategoria = "";

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
    
    const dzis = new Date();
    document.getElementById('data-analizy').value = `${dzis.getFullYear()}-${String(dzis.getMonth() + 1).padStart(2, '0')}-${String(dzis.getDate()).padStart(2, '0')}`;

    const sklepyLista = document.getElementById('sklepy-lista');
    sklepyLista.innerHTML = '';
    sklepy.forEach(sklep => {
        sklepyLista.innerHTML += `
            <label class="flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors text-gray-700">
                <input type="checkbox" checked value="${sklep}" onchange="odswiezTabeleRaportu(); odswiezTabeleWynikow();" class="sklep-checkbox rounded text-blue-600 focus:ring-blue-500">
                <span>${sklep}</span>
            </label>
        `;
    });
    
    document.getElementById('search-input').value = '';
    KOSZYK_RAPORTU = []; // Czyszczenie raportu przy zmianie kategorii głównej
    
    odswiezTabeleRaportu();
    lucide.createIcons();
}

function pokazEkranGlowny() {
    document.getElementById('ekran-kategorii').classList.add('hidden');
    document.getElementById('ekran-glowny').classList.remove('hidden');
    document.getElementById('current-category-badge').classList.add('hidden');
}

function szukajImplementacja() {
    const fraza = document.getElementById('search-input').value.trim().toLowerCase();
    const aktualnaKategoria = document.getElementById('kat-title').innerText;
    
    if (!fraza) {
        alert('Wpisz nazwę szukanego produktu!');
        return;
    }
    
    ostatniaFraza = fraza;
    ostatniaKategoria = aktualnaKategoria;
    odswiezTabeleWynikow();
}

function odswiezTabeleWynikow() {
    if(!ostatniaFraza) return;

    const zaznaczoneSklepy = Array.from(document.querySelectorAll('#sklepy-lista input:checked')).map(cb => cb.value);
    
    const znalezione = BAZA_GAZETEK.filter(item => {
        return item.kategoria === ostatniaKategoria && 
               zaznaczoneSklepy.includes(item.sklep) && 
               item.produkt.toLowerCase().includes(ostatniaFraza);
    });
    
    const wynikiBox = document.getElementById('wyniki-box');
    const tabelaTbody = document.getElementById('tabela-wynikow');
    
    wynikiBox.classList.remove('hidden');
    tabelaTbody.innerHTML = '';
    
    if (znalezione.length === 0) {
        tabelaTbody.innerHTML = `<tr><td colspan="5" class="p-4 text-center text-gray-400 text-sm">Brak ofert pasujących do frazy w zaznaczonych sklepach.</td></tr>`;
        return;
    }
    
    znalezione.forEach((item) => {
        // Identyfikacja po ID wyklucza błędy parsowania stringów w JS
        const istnieje = KOSZYK_RAPORTU.some(r => r.nazwaWyszukiwana === item.produkt && r.ofertySklepowe[item.sklep]);
        
        let przyciskRaportu = '';
        if (istnieje) {
            przyciskRaportu = `
                <button onclick="usunZRaportuPoID(${item.id})" class="bg-red-100 text-red-700 hover:bg-red-600 hover:text-white px-3 py-1.5 rounded-lg font-bold text-xs transition-colors cursor-pointer border-0">
                    Usuń z raportu
                </button>
            `;
        } else {
            przyciskRaportu = `
                <button onclick="dodajDoRaportuPoID(${item.id})" class="bg-green-100 text-green-700 hover:bg-green-600 hover:text-white px-3 py-1.5 rounded-lg font-bold text-xs transition-colors cursor-pointer border-0">
                    Dodaj do raportu
                </button>
            `;
        }

        tabelaTbody.innerHTML += `
            <tr class="border-b border-gray-100 hover:bg-gray-50/80 transition-colors">
                <td class="p-3 font-bold text-gray-700">${item.sklep}</td>
                <td class="p-3 text-gray-600 font-medium">${item.produkt}</td>
                <td class="p-3 text-right font-black text-gray-900">${item.cena.toFixed(2)} zł</td>
                <td class="p-3 text-center">
                    <a href="${item.url}" target="_blank" class="text-blue-600 hover:text-blue-800 font-bold underline text-xs">Przejdź</a>
                </td>
                <td class="p-3 text-center">${przyciskRaportu}</td>
            </tr>
        `;
    });
}

function dodajDoRaportuPoID(id) {
    const item = BAZA_GAZETEK.find(b => b.id === id);
    if(!item) return;

    let produktWKoszyku = KOSZYK_RAPORTU.find(r => r.nazwaWyszukiwana === item.produkt);
    
    if (!produktWKoszyku) {
        produktWKoszyku = {
            nazwaWyszukiwana: item.produkt,
            ofertySklepowe: {}
        };
        KOSZYK_RAPORTU.push(produktWKoszyku);
    }
    
    produktWKoszyku.ofertySklepowe[item.sklep] = {
        cena: item.cena,
        link: item.url
    };
    
    document.getElementById('raport-box').classList.remove('hidden');
    
    odswiezTabeleRaportu();
    odswiezTabeleWynikow(); 
}

function usunZRaportuPoID(id) {
    const item = BAZA_GAZETEK.find(b => b.id === id);
    if(!item) return;

    let produktWKoszyku = KOSZYK_RAPORTU.find(r => r.nazwaWyszukiwana === item.produkt);
    
    if (produktWKoszyku) {
        delete produktWKoszyku.ofertySklepowe[item.sklep];
        if (Object.keys(produktWKoszyku.ofertySklepowe).length === 0) {
            KOSZYK_RAPORTU = KOSZYK_RAPORTU.filter(r => r.nazwaWyszukiwana !== item.produkt);
        }
    }
    
    odswiezTabeleRaportu();
    odswiezTabeleWynikow();
}

function odswiezTabeleRaportu() {
    const checkboxes = Array.from(document.querySelectorAll('#sklepy-lista input'));
    if(checkboxes.length === 0) return;

    const aktywneSklepy = checkboxes.filter(cb => cb.checked).map(cb => cb.value);
    
    const headerRow = document.getElementById('naglowek-tabeli-raportu');
    const bodyTable = document.getElementById('tabela-raportu-body');
    
    let htmlNaglowka = `<th class="p-3">Nazwa artykułu</th>`;
    aktywneSklepy.forEach(sklep => {
        htmlNaglowka += `<th class="p-3 text-center bg-gray-50/50">Cena ${sklep}</th>`;
        htmlNaglowka += `<th class="p-3 text-center">Link ${sklep}</th>`;
    });
    htmlNaglowka += `<th class="p-3 text-center bg-red-50 text-red-700">Akcja</th>`;
    headerRow.innerHTML = htmlNaglowka;
    
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
                wierszHtml += `<td class="p-3 text-center text-gray-300 bg-gray-50/50">—</td>`;
                wierszHtml += `<td class="p-3 text-center text-gray-300">—</td>`;
            }
        });
        
        // Bezpieczne usuwanie całego wiersza na podstawie dokładnego dopasowania nazwy
        const bezpiecznaNazwa = item.nazwaWyszukiwana.replace(/'/g, "\\'");
        wierszHtml += `
            <td class="p-3 text-center bg-red-50/20">
                <button onclick="usunCalyArtykulZRaportu('${bezpiecznaNazwa}')" class="text-red-600 hover:text-red-900 font-bold text-xs cursor-pointer bg-transparent border-0">
                    Usuń artykuł
                </button>
            </td>
        `;
        
        wierszHtml += `</tr>`;
        bodyTable.innerHTML += wierszHtml;
    });
    
    lucide.createIcons();
}

function usunCalyArtykulZRaportu(produkt) {
    KOSZYK_RAPORTU = KOSZYK_RAPORTU.filter(item => item.nazwaWyszukiwana !== produkt);
    odswiezTabeleRaportu();
    odswiezTabeleWynikow();
}

function eksportujDoXLSX() {
    const aktywneSklepy = Array.from(document.querySelectorAll('#sklepy-lista input:checked')).map(cb => cb.value);
    
    if (KOSZYK_RAPORTU.length === 0) {
        alert("Twój raport jest pusty!");
        return;
    }
    
    let naglowki = ["Nazwa artykułu"];
    aktywneSklepy.forEach(sklep => {
        naglowki.push(`Cena ${sklep}`);
        naglowki.push(`Link ${sklep}`);
    });
    
    let daneArkusza = [naglowki];
    
    KOSZYK_RAPORTU.forEach(item => {
        let wiersz = [item.nazwaWyszukiwana];
        
        aktywneSklepy.forEach(sklep => {
            const daneSklepu = item.ofertySklepowe[sklep];
            if (daneSklepu) {
                wiersz.push(daneSklepu.cena); 
                wiersz.push(daneSklepu.link);
            } else {
                wiersz.push(""); 
                wiersz.push("");
            }
        });
        
        daneArkusza.push(wiersz);
    });
    
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(daneArkusza);
    
    XLSX.utils.book_append_sheet(wb, ws, "Raport Cenowy");
    
    const dataAnalizy = document.getElementById('data-analizy').value;
    XLSX.writeFile(wb, `Raport_Cenowy_${dataAnalizy}.xlsx`);
}