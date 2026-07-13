// Konfiguracja kluczy Google API
const GOOGLE_API_KEY = 'AIzaSyCM64jCCKtfjSQYaoWa4GM9ATbUjo9_wC8';
const GOOGLE_CX = '5393052c79d0c4c4a';

// Mapowanie kafelków na konkretne domeny sklepów
const CATEGORY_DOMAINS = {
    'school': ['biedronka.pl', 'aldi.pl', 'action.com', 'sinsay.com', 'smyk.com'],
    'books': ['empik.com', 'taniaksiazka.pl', 'tantis.pl'],
    'clothes': ['sinsay.com', 'smyk.com'],
    'toys': ['smyk.com', 'action.com', 'empik.com']
};

let currentCategory = 'school'; // Domyślna kategoria na start

// Funkcja przełączania kategorii (kafelków)
function setCategory(category, element) {
    currentCategory = category;
    
    // Wizualna zmiana aktywnego kafelka
    document.querySelectorAll('.tile').forEach(tile => tile.classList.remove('active'));
    if (element) element.classList.add('active');
    
    // Wyczyszczenie poprzednich wyników
    document.getElementById('resultsTable').innerHTML = '';
}

// Główna funkcja wyszukiwania w Google API
async function searchProduct() {
    const query = document.getElementById('productSearch').value.trim();
    const tableBody = document.getElementById('resultsTable');
    
    if (!query) {
        alert('Wpisz nazwę produktu!');
        return;
    }

    tableBody.innerHTML = '<tr><td colspan="4" class="text-center">Szukam w bazie danych konkurencji...</td></tr>';

    // Pobranie sklepów przypisanych do wybranego kafelka
    const allowedDomains = CATEGORY_DOMAINS[currentCategory] || [];
    
    if (allowedDomains.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="4" class="text-center text-danger">Brak przypisanych sklepów dla tej kategorii.</td></tr>';
        return;
    }

    // Budowanie sprytnego zapytania filtrującego domeny (np. "site:empik.com OR site:tantis.pl")
    const siteFilter = allowedDomains.map(domain => `site:${domain}`).join(' OR ');
    const fullQuery = `${query} (${siteFilter})`;

    // Adres URL do Google Custom Search JSON API
    const url = `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_API_KEY}&cx=${GOOGLE_CX}&q=${encodeURIComponent(fullQuery)}`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        tableBody.innerHTML = ''; // Czyszczenie ładowania

        if (!data.items || data.items.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="4" class="text-center">Brak wyników w przeszukiwanych sklepach. Spróbuj zmienić hasło.</td></tr>';
            return;
        }

        // Renderowanie wyników w tabeli
        data.items.forEach(item => {
            const title = item.title;
            const link = item.link;
            const displayLink = item.displayLink; // Nazwa sklepu, np. empik.com
            
            // Próba wyciągnięcia miniaturki zdjęcia z metadanych strony
            let imgHtml = '<span class="text-muted">Brak foto</span>';
            if (item.pagemap && item.pagemap.cse_image && item.pagemap.cse_image[0]) {
                const imgUrl = item.pagemap.cse_image[0].src;
                imgHtml = `<img src="${imgUrl}" alt="Foto" style="max-width: 50px; max-height: 50px; border-radius: 4px;">`;
            }

            // Próba sprytnego wyciągnięcia ceny z opisu (Google często ją tam podaje)
            const price = extractPrice(item.snippet || '');

            const row = `
                <tr>
                    <td class="text-center">${imgHtml}</td>
                    <td>
                        <strong>${title}</strong><br>
                        <small class="text-muted">Sklep: ${displayLink}</small>
                    </td>
                    <td class="text-success fw-bold text-center">${price}</td>
                    <td class="text-center">
                        <a href="${link}" target="_blank" class="btn btn-sm btn-outline-primary">Zobacz ofertę</a>
                    </td>
                </tr>
            `;
            tableBody.insertAdjacentHTML('beforeend', row);
        });

    } catch (error) {
        console.error('Błąd pobierania danych z Google API:', error);
        tableBody.innerHTML = '<tr><td colspan="4" class="text-center text-danger">Wystąpił błąd podczas wyszukiwania. Sprawdź konsolę przeglądarki.</td></tr>';
    }
}

// Pomocnicza funkcja szukająca wzorca ceny (np. 29,99 zł) w tekście opisu
function extractPrice(text) {
    const priceRegex = /(\d+[\.,]\d{2})\s*(zł|PLN)/i;
    const match = text.match(priceRegex);
    return match ? `${match[1]} ${match[2]}` : 'Do weryfikacji';
}