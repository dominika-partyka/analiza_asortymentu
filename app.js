// Inicjalizacja ikon Lucide po starcie strony
lucide.createIcons();

// Automatyczne wstawienie dzisiejszej daty do kalendarza
document.getElementById('data-analizy').valueAsDate = new Date();

/**
 * Główna funkcja nawigacyjna - przełącza widok na wybraną kategorię
 */
function wybierzKategorie(nazwa, ikona, sklepy) {
    // Ukrywamy ekran główny, pokazujemy panel kategorii
    document.getElementById('ekran-glowny').classList.add('hidden');
    document.getElementById('ekran-kategorii').classList.remove('hidden');
    
    // Aktualizacja tytułów i odznaki w menu
    document.getElementById('kat-title').innerText = nazwa;
    const badge = document.getElementById('current-category-badge');
    badge.innerText = nazwa.toUpperCase();
    badge.classList.remove('hidden');

    // Dynamiczna stylizacja boksu z ikoną
    const iconBox = document.getElementById('kat-icon-box');
    iconBox.innerHTML = `<i data-lucide="${ikona}" class="w-6 h-6"></i>`;
    
    if(nazwa === 'Książki') iconBox.className = "w-12 h-12 rounded-xl flex items-center justify-center text-white bg-blue-600";
    if(nazwa === 'Back to School') iconBox.className = "w-12 h-12 rounded-xl flex items-center justify-center text-white bg-yellow-500";
    if(nazwa === 'Zabawki') iconBox.className = "w-12 h-12 rounded-xl flex items-center justify-center text-white bg-pink-500";

    // Generowanie specyficznych checkboxów ze sklepami dla danej kategorii
    const sklepyKontener = document.getElementById('sklepy-lista');
    sklepyKontener.innerHTML = '';
    sklepy.forEach(sklep => {
        sklepyKontener.innerHTML += `
            <label class="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-700 cursor-pointer transition-colors border border-gray-200">
                <input type="checkbox" checked class="rounded border-gray-300 text-blue-600 focus:ring-blue-500">
                ${sklep}
            </label>
        `;
    });

    // Podświetlanie odpowiedniego linku w pasku górnym (Navbarze)
    oznaczAktywnyLink(nazwa);

    // Przeładowanie ikon biblioteki Lucide, by obsłużyć nowe elementy na ekranie
    lucide.createIcons();
    
    // Reset symulatora cenowego przy zmianie kategorii
    document.getElementById('min-price').value = '';
    document.getElementById('target-price').innerText = "0.00 zł";
}

/**
 * Resetuje widok i przenosi użytkownika z powrotem na pulpit (ekran główny)
 */
function pokazEkranGlowny() {
    document.getElementById('ekran-kategorii').classList.add('hidden');
    document.getElementById('ekran-glowny').classList.remove('hidden');
    document.getElementById('current-category-badge').classList.add('hidden');
    
    // Usuwamy podświetlenie z linków w menu górnym
    oznaczAktywnyLink(null);
}

/**
 * Zarządza klasami CSS, aby podświetlić aktywną kategorię na pasku górnym
 */
function oznaczAktywnyLink(aktywnaNazwa) {
    const linki = document.querySelectorAll('.nav-link');
    linki.forEach(link => {
        if (link.innerText.trim() === aktywnaNazwa) {
            link.classList.add('nav-link-active');
        } else {
            link.classList.remove('nav-link-active');
        }
    });
}

/**
 * Logika działania symulatora cenowego dla Lidla
 */
function obliczCene() {
    const minPrice = parseFloat(document.getElementById('min-price').value) || 0;
    const discount = parseFloat(document.getElementById('discount-percent').value) || 0;
    
    if (minPrice > 0) {
        const finalPrice = minPrice * (1 - (discount / 100));
        document.getElementById('target-price').innerText = finalPrice.toFixed(2) + " zł";
    } else {
        document.getElementById('target-price').innerText = "0.00 zł";
    }
}