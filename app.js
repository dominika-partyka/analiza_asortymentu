// Inicjalizacja ikonek Lucide
lucide.createIcons();

// Funkcja przełączania kategorii
function wybierzKategorie(nazwa, ikona, sklepy) {
    document.getElementById('ekran-glowny').classList.add('hidden');
    document.getElementById('ekran-kategorii').classList.remove('hidden');
    
    // Aktualizacja nagłówków i odznaki
    document.getElementById('kat-title').innerText = nazwa;
    const badge = document.getElementById('current-category-badge');
    badge.innerText = nazwa;
    badge.classList.remove('hidden');
    
    // Ustawienie koloru ikony w zależności od kategorii
    const iconBox = document.getElementById('kat-icon-box');
    iconBox.innerHTML = `<i data-lucide="${ikona}" class="w-6 h-6"></i>`;
    
    if(nazwa === 'Książki') iconBox.className = "w-12 h-12 rounded-xl flex items-center justify-center text-white bg-blue-600";
    if(nazwa === 'Back to School') iconBox.className = "w-12 h-12 rounded-xl flex items-center justify-center text-white bg-yellow-500";
    if(nazwa === 'Zabawki') iconBox.className = "w-12 h-12 rounded-xl flex items-center justify-center text-white bg-pink-500";
    
    // Dynamiczna zmiana podpowiedzi dla systemu FOCUS
    const focusGrupa = document.getElementById('focus-grupa');
    if(nazwa === 'Książki') focusGrupa.innerText = "KULTURA I ROZRYWKA / KSIĄŻKI";
    if(nazwa === 'Back to School') focusGrupa.innerText = "ART. PAPIERNICZE / SZKOLNE";
    if(nazwa === 'Zabawki') focusGrupa.innerText = "ZABAWKI I GRY SEZONOWE";

    // Generowanie checkboxów dla sklepów
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
    
    // Reset pola wyszukiwania i kalkulatora
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

// Funkcja odpowiedzialna za bezpieczne wyszukiwanie
function uruchomWyszukiwanie() {
    const produkt = document.getElementById('search-input').value.trim();
    const kategoria = document.getElementById('kat-title').innerText;
    
    if (!produkt) {
        alert('Wpisz najpierw nazwę produktu!');
        return;
    }
    
    // Pobieramy zaznaczone sklepy konkurencji
    const checkboxy = document.querySelectorAll('#sklepy-lista input:checked');
    let wybraneSklepy = [];
    checkboxy.forEach(cb => {
        wybraneSklepy.push(cb.nextElementSibling.innerText);
    });
    
    // Budujemy zapytanie do Google z operatorami site:
    let query = produkt;
    if (wybraneSklepy.length > 0) {
        query += " (";
        const siteQueries = wybraneSklepy.map(sklep => {
            if(sklep.toLowerCase() === 'biedronka') return 'site:biedronka.pl';
            if(sklep.toLowerCase() === 'aldi') return 'site:aldi.pl';
            if(sklep.toLowerCase() === 'sinsay') return 'site:sinsay.com';
            if(sklep.toLowerCase() === 'action') return 'site:action.com';
            if(sklep.toLowerCase() === 'empik') return 'site:empik.com';
            if(sklep.toLowerCase() === 'tania książka') return 'site:taniaksiazka.pl';
            if(sklep.toLowerCase() === 'świat książki') return 'site:swiatksiazki.pl';
            if(sklep.toLowerCase() === 'smyk') return 'site:smyk.com';
            if(sklep.toLowerCase() === 'allegro') return 'site:allegro.pl';
            return `intitle:${sklep}`;
        });
        query += siteQueries.join(" OR ") + ")";
    }
    
    // Otwieramy czyste wyszukiwanie w nowej karcie Google
    const url = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
    window.open(url, '_blank');
}

// Funkcja kalkulatora
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