// Inicjalizacja ikonek Lucide
lucide.createIcons();

// Funkcja przełączania kategorii
function wybierzKategorie(nazwa, ikona, sklepy) {
    document.getElementById('ekran-glowny').classList.add('hidden');
    document.getElementById('ekran-kategorii').classList.remove('hidden');
    
    // Ukrywamy stare wyniki wyszukiwania
    document.getElementById('google-results-box').classList.add('hidden');
    
    document.getElementById('kat-title').innerText = nazwa;
    const badge = document.getElementById('current-category-badge');
    badge.innerText = nazwa;
    badge.classList.remove('hidden');
    
    const iconBox = document.getElementById('kat-icon-box');
    iconBox.innerHTML = `<i data-lucide="${ikona}" class="w-6 h-6"></i>`;
    
    if(nazwa === 'Książki') iconBox.className = "w-12 h-12 rounded-xl flex items-center justify-center text-white bg-blue-600";
    if(nazwa === 'Back to School') iconBox.className = "w-12 h-12 rounded-xl flex items-center justify-center text-white bg-yellow-500";
    if(nazwa === 'Zabawki') iconBox.className = "w-12 h-12 rounded-xl flex items-center justify-center text-white bg-pink-500";
    
    // USTAWIANIE DOMYŚLNEJ DZISIEJSZEJ DATY
    const dzis = new Date();
    const rok = dzis.getFullYear();
    const miesiac = String(dzis.getMonth() + 1).padStart(2, '0');
    const dzien = String(dzis.getDate()).padStart(2, '0');
    document.getElementById('data-analizy').value = `${rok}-${miesiac}-${dzien}`;

    // Generowanie nowych checkboxów dla sklepów
    const sklepyLista = document.getElementById('sklepy-lista');
    sklepyLista.innerHTML = '';
    sklepy.forEach(sklep => {
        sklepyLista.innerHTML += `
            <label class="flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors text-gray-700">
                <input type="checkbox" checked class="rounded text-blue-600 focus:ring-blue-500">
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

// WYSZUKIWANIE WEWNĘTRZNE W PANELU
function uruchomWyszukiwanieWewnetrzne() {
    const produkt = document.getElementById('search-input').value.trim();
    
    if (!produkt) {
        alert('Wpisz najpierw nazwę produktu!');
        return;
    }
    
    const checkboxy = document.querySelectorAll('#sklepy-lista input:checked');
    let wybraneSklepy = [];
    checkboxy.forEach(cb => {
        wybraneSklepy.push(cb.nextElementSibling.innerText);
    });
    
    let query = produkt;
    if (wybraneSklepy.length > 0) {
        const sklepyQuery = wybraneSklepy.map(s => s.toLowerCase()).join(" OR ");
        query += ` (${sklepyQuery})`;
    }
    
    const resultsBox = document.getElementById('google-results-box');
    const insideResults = document.getElementById('inside-results');
    resultsBox.classList.remove('hidden');
    
    insideResults.innerHTML = `
        <div class="flex flex-col items-center gap-3 p-4">
            <p class="text-sm text-gray-500 animate-pulse">🔎 Przeszukuję bazy konkurencji (Biedronka, Aldi, Action, Sinsay)... to zajmie tylko chwilę.</p>
            <button onclick="zatrzymajWyszukiwanie()" class="bg-red-600 text-white px-4 py-1.5 rounded-lg font-bold text-xs hover:bg-red-700 transition-colors cursor-pointer flex items-center gap-1 shadow-sm">
                <i data-lucide="square" class="w-3.5 h-3.5"></i> Anuluj wyszukiwanie
            </button>
        </div>
    `;
    lucide.createIcons();
    
    if (typeof google !== 'undefined' && google.search && google.search.cse) {
        google.search.cse.element.render({
            div: 'inside-results',
            tag: 'searchresults-only',
            attributes: { gname: 'lidl-search' }
        });
        
        const element = google.search.cse.element.getElement('lidl-search');
        if (element) {
            element.execute(query);
        } else {
            insideResults.innerHTML = '<p class="text-sm text-red-500">Błąd wyszukiwarki. Odśwież stronę (F5).</p>';
        }
    } else {
        insideResults.innerHTML = '<p class="text-sm text-amber-600">Skrypt się ładuje. Poczekaj sekundę i kliknij ponownie.</p>';
    }
}

function zatrzymajWyszukiwanie() {
    document.getElementById('google-results-box').classList.add('hidden');
    document.getElementById('inside-results').innerHTML = ''; 
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