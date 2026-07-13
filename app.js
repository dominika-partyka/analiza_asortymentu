// Konfiguracja Twoich indywidualnych kluczy Google API
const GOOGLE_API_KEY = 'AIzaSyCM64jCCKtfjSQYaoWa4GM9ATbUjo9_wC8';
const GOOGLE_CX = '5393052c79d0c4c4a';

// Mapowanie kafelków na konkretne domeny sklepów (możesz tu dopisywać nowe!)
const CATEGORY_DOMAINS = {
    'school': ['biedronka.pl', 'aldi.pl', 'action.com', 'sinsay.com', 'smyk.com'],
    'books': ['empik.com', 'taniaksiazka.pl', 'tantis.pl'],
    'clothes': ['sinsay.com', 'smyk.com'],
    'toys': ['smyk.com', 'action.com', 'empik.com']
};

let currentCategory = 'school'; // Domyślny kafel na start projektu
let rawResults = [];            // Globalny schowek na pobrane z sieci wyniki (potrzebny do filtrów i sortowania)

// 1. Obsługa przełączania kafelków / kategorii
function setCategory(category, element) {
    currentCategory = category;
    
    // Zmiana podświetlenia kafelka w HTML
    document.querySelectorAll('.tile').forEach(tile => tile.classList.remove('active'));
    if (element) {
        element.classList.add('active');
    } else {
        const fallbackTile = document.getElementById(`tile-${category}`);
        if (fallbackTile) fallbackTile.classList.add('active');
    }
    
    // Automatyczne czyszczenie ekranu przy zmianie kategorii
    clearResults();
}

// 2. Główny silnik wyszukiwania i odpytywania Google API
async function searchProduct() {
    const query = document.getElementById('productSearch').value.trim();
    const tableBody = document.getElementById('resultsTable');
    const counter = document.getElementById('resultsCounter');
    
    if (!query) {
        alert('Proszę wprowadzić nazwę produktu przed uruchomieniem skanowania!');
        return;
    }

    // Stan ładowania danych
    tableBody.innerHTML = `
        <tr>
            <td colspan="4" class="text-center py-5">
                <div class="spinner-border text-primary mb-3" role="status"></div>
                <div class="fw-bold text-muted">Odpytuję wyszukiwarkę Google dla przypisanych domen...</div>
            </td>
        </tr>
    `;
    counter.innerText = 'Skanowanie sieci w toku...';

    // Pobranie sklepów dopasowanych do klikniętego kafelka
    const allowedDomains = CATEGORY_DOMAINS[currentCategory] || [];
    if (allowedDomains.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="4" class="text-center text-danger py-4 fw-bold">Brak przypisanych sklepów do tej kategorii!</td></tr>';
        return;
    }

    // Konstrukcja zapytania filtrującego domeny (np. "site:empik.com OR site:tantis.pl")
    const siteFilter = allowedDomains.map(domain => `site:${domain}`).join(' OR ');
    const fullQuery = `${query} (${siteFilter})`;

    // Budowanie poprawnego adresu URL żądania API
    const url = `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_API_KEY}&cx=${GOOGLE_CX}&q=${encodeURIComponent(fullQuery)}`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (!data.items || data.items.length === 0) {
            rawResults = [];
            renderTable([]);
            counter.innerText = 'Zakończono skanowanie. Brak pasujących ofert u konkurencji.';
            return;
        }

        // Mapowanie surowej odpowiedzi Google na czysty obiekt danych w naszej aplikacji
        rawResults = data.items.map(item => {
            // Próba sprytnego znalezienia miniatury zdjęcia w metadanych witryny
            let imageUrl = '';
            if (item.pagemap && item.pagemap.cse_image && item.pagemap.cse_image[0]) {
                imageUrl = item.pagemap.cse_image[0].src;
            } else if (item.pagemap && item.pagemap.metatags && item.pagemap.metatags[0]) {
                imageUrl = item.pagemap.metatags[0]['og:image'] || '';
            }

            // Automatyczne wyciąganie ceny z tekstu snippetu
            const extractedPrice = parsePriceFromText(item.snippet || '');

            return {
                title: item.title,
                link: item.link,
                shop: item.displayLink ? item.displayLink.replace('www.', '') : 'Sklep internetowy',
                image: imageUrl,
                price: extractedPrice
            };
        });

        // Włączenie sortowania/filtracji i wyświetlenie wyników
        applyFiltersAndSort();

    } catch (error) {
        console.error('Krytyczny błąd połączenia z Google API:', error);
        tableBody.innerHTML = '<tr><td colspan="4" class="text-center text-danger py-4 fw-bold">Błąd połączenia. Upewnij się, że nie wygasły limity klucza API.</td></tr>';
        counter.innerText = 'Wystąpił błąd.';
    }
}

// 3. Renderowanie wygenerowanych wierszy tabeli HTML
function renderTable(items) {
    const tableBody = document.getElementById('resultsTable');
    const counter = document.getElementById('resultsCounter');
    
    if (items.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="4" class="text-center py-4 text-muted">
                    Brak wyników spełniających kryteria w wybranej grupie sklepów.
                </td>
            </tr>
        `;
        return;
    }

    tableBody.innerHTML = '';
    items.forEach(item => {
        const imgHtml = item.image 
            ? `<img src="${item.image}" alt="Podgląd">` 
            : `<div class="text-muted small"><i class="fa-regular fa-image d-block mb-1"></i>Brak foto</div>`;

        const row = `
            <tr>
                <td class="text-center">${imgHtml}</td>
                <td>
                    <div class="fw-bold text-dark">${item.title}</div>
                    <span class="badge badge-shop mt-1"><i class="fa-solid fa-store me-1"></i>${item.shop}</span>
                </td>
                <td class="text-center text-success fw-bold fs-5">${item.price}</td>
                <td class="text-center">
                    <a href="${item.link}" target="_blank" class="btn btn-sm btn-primary px-3" style="background-color: #0050aa; border: none;">
                        <i class="fa-solid fa-arrow-up-right-from-square me-1"></i> Sprawdź
                    </a>
                </td>
            </tr>
        `;
        tableBody.insertAdjacentHTML('beforeend', row);
    });

    counter.innerText = `Znaleziono ${items.length} pasujących rekordów w tej sekcji.`;
}

// 4. Obsługa filtrów i sortowania tabeli na żywo
function applyFiltersAndSort() {
    let results = [...rawResults];
    const sortValue = document.getElementById('sortFilter').value;

    // Sortowanie danych
    if (sortValue === 'name-asc') {
        results.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortValue === 'shop-asc') {
        results.sort((a, b) => a.shop.localeCompare(b.shop));
    }

    renderTable(results);
}

// 5. Pomocnicza funkcja czyszcząca ekran
function clearResults() {
    rawResults = [];
    document.getElementById('resultsTable').innerHTML = `
        <tr>
            <td colspan="4" class="text-center py-5 text-muted">
                <i class="fa-solid fa-arrow-pointer display-6 mb-3 d-block text-black-50"></i>
                Wpisz słowo kluczowe i kliknij "Skanuj ceny", aby pobrać nowe dane dla tej sekcji.
            </td>
        </tr>
    `;
    document.getElementById('resultsCounter').innerText = 'Wyczyszczono historię skanowania.';
}

// 6. Sprytne wyrażenie regularne wyciągające ceny (np. 14,99 zł, 45 PLN) z tekstu
function parsePriceFromText(text) {
    const regex = /(\d+[\.,]\d{2})\s*(zł|PLN)/i;
    const match = text.match(regex);
    return match ? `${match[1]} ${match[2]}` : 'Do weryfikacji';
}