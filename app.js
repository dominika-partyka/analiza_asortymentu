// Inicjalizacja ikonek
lucide.createIcons();

// LOKALNA BAZA DANYCH GAZETEK KONKURENCJI (Działa natychmiastowo!)
const BAZA_GAZETEK = [
    // --- BACK TO SCHOOL ---
    { kategoria: "Back to School", sklep: "Biedronka", produkt: "Zeszyt A5 60 kartek w linię / kratkę", cena: 2.99 },
    { kategoria: "Back to School", sklep: "Biedronka", produkt: "Kredki świecowe Bambino 24 kolory", cena: 11.49 },
    { kategoria: "Back to School", sklep: "Aldi", produkt: "Zeszyt A5 60 kartek Oxford", cena: 3.49 },
    { kategoria: "Back to School", sklep: "Aldi", produkt: "Piórnik tuba Milan z wyposażeniem", cena: 24.99 },
    { kategoria: "Back to School", sklep: "Action", produkt: "Kredki ołówkowe w metalowym etui 50 szt", cena: 9.99 },
    { kategoria: "Back to School", sklep: "Action", produkt: "Zeszyt szkolny A5 32 kartki", cena: 0.99 },
    { kategoria: "Back to School", sklep: "Sinsay", produkt: "Piórnik szkolny z organizerem z nadrukiem", cena: 15.99 },
    { kategoria: "Back to School", sklep: "Sinsay", produkt: "Plecak szkolny klasyczny pastelowy", cena: 39.99 },

    // --- KSIĄŻKI ---
    { kategoria: "Książki", sklep: "Empik", produkt: "Wiedźmin: Ostatnie życzenie - Andrzej Sapkowski", cena: 34.90 },
    { kategoria: "Książki", sklep: "Tania Książka", produkt: "Wiedźmin: Ostatnie życzenie - Andrzej Sapkowski", cena: 29.80 },
    { kategoria: "Książki", sklep: "Świat Książki", produkt: "Mały Książę - wydanie ilustrowane", cena: 19.99 },

    // --- ZABAWKI ---
    { kategoria: "Zabawki", sklep: "Smyk", produkt: "Klocki LEGO Technic - Samochód wyścigowy", cena: 45.99 },
    { kategoria: "Zabawki", sklep: "Allegro", produkt: "Gra planszowa Monopoly Classic", cena: 99.00 },
    { kategoria: "Zabawki", sklep: "Empik", produkt: "Gra planszowa Monopoly Classic", cena: 109.00 }
];

// Funkcja przełączania kategorii
function wybierzKategorie(nazwa, ikona, sklepy) {
    document.getElementById('ekran-glowny').classList.add('hidden');
    document.getElementById('ekran-kategorii').classList.remove('hidden');
    document.getElementById('wyniki-box').classList.add('hidden'); // Ukryj starą tabelę
    
    document.getElementById('kat-title').innerText = nazwa;
    const badge = document.getElementById('current-category-badge');
    badge.innerText = nazwa;
    badge.classList.remove('hidden');
    
    const iconBox = document.getElementById('kat-icon-box');
    iconBox.innerHTML = `<i data-lucide="${ikona}" class="w-6 h-6"></i>`;
    
    if(nazwa === 'Książki') iconBox.className = "w-12 h-12 rounded-xl flex items-center justify-center text-white bg-blue-600";
    if(nazwa === 'Back to School') iconBox.className = "w-12 h-12 rounded-xl flex items-center justify-center text-white bg-yellow-500";
    if(nazwa === 'Zabawki') iconBox.className = "w-12 h-12 rounded-xl flex items-center justify-center text-white bg-pink-500";
    
    // Ustawienie dzisiejszej daty
    const dzis = new Date();
    document.getElementById('data-analizy').value = `${dzis.getFullYear()}-${String(dzis.getMonth() + 1).padStart(2, '0')}-${String(dzis.getDate()).padStart(2, '0')}`;

    // Filtry sklepów
    const sklepyLista = document.getElementById('sklepy-lista');
    sklepyLista.innerHTML = '';
    sklepy.forEach(sklep => {
        sklepyLista.innerHTML += `
            <label class="flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors text-gray-700">
                <input type="checkbox" checked value="${sklep}" class="rounded text-blue-600 focus:ring-blue-500">
                <span>${sklep}</span>
            </label>
        `;
    });
    
    document.getElementById('search-input').value = '';
    document.getElementById('min-price').value = '';
    document.getElementById('target-price').innerText = '0.00 zł';
    
    lucide.createIcons();
}

function pokazEkranGlowny() {
    document.getElementById('ekran-kategorii').classList.add('hidden');
    document.getElementById('ekran-glowny').classList.remove('hidden');
    document.getElementById('current-category-badge').classList.add('hidden');
}

// BŁYSKAWICZNE PRZESZUKIWANIE BAZY
function szukajWBazieGazetek() {
    const fraza = document.getElementById('search-input').value.trim().toLowerCase();
    const aktualnaKategoria = document.getElementById('kat-title').innerText;
    
    if (!fraza) {
        alert('Wpisz nazwę szukanego produktu!');
        return;
    }
    
    // Pobierz tylko aktywne (zaznaczone) sklepy
    const zaznaczoneSklepy = Array.from(document.querySelectorAll('#sklepy-lista input:checked')).map(cb => cb.value);
    
    // Filtrowanie bazy w ułamku sekundy
    const znalezione = BAZA_GAZETEK.filter(item => {
        const należyDoKategorii = (item.kategoria === aktualnaKategoria);
        const pasujeDoSklepu = zaznaczoneSklepy.includes(item.sklep);
        const pasujeDoFrazy = item.produkt.toLowerCase().includes(fraza);
        return należyDoKategorii && pasujeDoSklepu && pasujeDoFrazy;
    });
    
    const wynikiBox = document.getElementById('wyniki-box');
    const tabelaTbody = document.getElementById('tabela-wynikow');
    
    wynikiBox.classList.remove('hidden');
    tabelaTbody.innerHTML = '';
    
    if (znalezione.length === 0) {
        tabelaTbody.innerHTML = `<tr><td colspan="4" class="p-4 text-center text-gray-400 text-sm">Brak ofert pasujących do frazy "${fraza}" w zaznaczonych sklepach.</td></tr>`;
        return;
    }
    
    // Wstrzyknięcie wyników do tabeli
    znalezione.forEach(item => {
        tabelaTbody.innerHTML += `
            <tr class="border-b border-gray-100 hover:bg-gray-50/80 transition-colors">
                <td class="p-3 font-bold text-gray-700">${item.sklep}</td>
                <td class="p-3 text-gray-600">${item.produkt}</td>
                <td class="p-3 text-right font-black text-gray-900">${item.cena.toFixed(2)} zł</td>
                <td class="p-3 text-center">
                    <button onclick="przepiszCeneToKalkulatora(${item.cena})" class="bg-blue-50 text-[#002f6c] hover:bg-[#002f6c] hover:text-white px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer">
                        Wybierz do analizy
                    </button>
                </td>
            </tr>
        `;
    });
}

// Dodatkowy trik: automatyczne wrzucenie wybranej ceny do kalkulatora
function przepiszCeneToKalkulatora(cena) {
    document.getElementById('min-price').value = cena;
    obliczCene();
    // Przewiń widok w dół do kalkulatora
    document.getElementById('min-price').scrollIntoView({ behavior: 'smooth' });
}

// Symulator ceny
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