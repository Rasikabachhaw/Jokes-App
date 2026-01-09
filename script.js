// App State
let currentJoke = null;
let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
let jokesViewed = parseInt(localStorage.getItem('jokesViewed')) || 0;
let selectedCategory = 'random';
let punchlineRevealed = false;

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    updateStats();
    renderFavorites();
});

// Fetch jokes with category support
async function getJokes() {
    try {
        // Add loading state
        const jokeContainer = document.querySelector('.joke-container');
        jokeContainer.classList.add('loading');
        
        let url;
        if (selectedCategory === 'random') {
            url = "https://official-joke-api.appspot.com/random_joke";
        } else {
            url = `https://official-joke-api.appspot.com/jokes/${selectedCategory}/random`;
        }
        
        const response = await fetch(url);
        let data = await response.json();
        
        // API returns array for category-specific jokes
        if (Array.isArray(data)) {
            data = data[0];
        }
        
        if (!data || !data.setup) {
            throw new Error('Invalid joke data');
        }
        
        currentJoke = data;
        punchlineRevealed = false;
        
        // Display joke
        document.getElementById("setup").innerText = data.setup;
        document.getElementById("punchline").innerText = data.punchline;
        document.getElementById("jokeType").innerText = data.type || selectedCategory;
        
        // Hide punchline initially
        const punchlineEl = document.getElementById("punchline");
        punchlineEl.classList.remove('show');
        
        // Update favorite button state
        updateFavoriteButton();
        
        // Update stats
        jokesViewed++;
        localStorage.setItem('jokesViewed', jokesViewed);
        updateStats();
        
        // Remove loading state
        jokeContainer.classList.remove('loading');
        
    } catch (error) {
        console.error('Error fetching joke:', error);
        showToast('Failed to fetch joke. Please try again!', 'error');
        document.querySelector('.joke-container').classList.remove('loading');
    }
}

// Show punchline
function showPunchline() {
    if (!currentJoke) {
        showToast('Get a joke first!', 'error');
        return;
    }
    
    const punchlineEl = document.getElementById("punchline");
    punchlineEl.classList.add('show');
    punchlineRevealed = true;
}

// Toggle favorite
function toggleFavorite() {
    if (!currentJoke) {
        showToast('Get a joke first!', 'error');
        return;
    }
    
    const index = favorites.findIndex(fav => fav.id === currentJoke.id);
    
    if (index > -1) {
        // Remove from favorites
        favorites.splice(index, 1);
        showToast('Removed from favorites!', 'info');
    } else {
        // Add to favorites
        favorites.push(currentJoke);
        showToast('Added to favorites!', 'success');
    }
    
    // Save to localStorage
    localStorage.setItem('favorites', JSON.stringify(favorites));
    
    // Update UI
    updateFavoriteButton();
    updateStats();
    renderFavorites();
}

// Update favorite button appearance
function updateFavoriteButton() {
    const btn = document.getElementById('favoriteBtn');
    const heartIcon = btn.querySelector('.heart-icon');
    
    if (!currentJoke) return;
    
    const isFavorite = favorites.some(fav => fav.id === currentJoke.id);
    
    if (isFavorite) {
        btn.classList.add('active');
        heartIcon.textContent = '♥';
    } else {
        btn.classList.remove('active');
        heartIcon.textContent = '♡';
    }
}

// Share joke
async function shareJoke() {
    if (!currentJoke) {
        showToast('Get a joke first!', 'error');
        return;
    }
    
    const jokeText = `${currentJoke.setup}\n\n${currentJoke.punchline}\n\n- Shared from JokesApp`;
    
    if (navigator.share) {
        try {
            await navigator.share({
                title: 'Check out this joke!',
                text: jokeText
            });
            showToast('Joke shared!', 'success');
        } catch (error) {
            if (error.name !== 'AbortError') {
                copyToClipboard(jokeText);
            }
        }
    } else {
        copyToClipboard(jokeText);
    }
}

// Copy joke to clipboard
function copyJoke() {
    if (!currentJoke) {
        showToast('Get a joke first!', 'error');
        return;
    }
    
    const jokeText = `${currentJoke.setup}\n\n${currentJoke.punchline}`;
    copyToClipboard(jokeText);
}

// Helper to copy to clipboard
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showToast('Copied to clipboard!', 'success');
    }).catch(() => {
        showToast('Failed to copy', 'error');
    });
}

// Select category
function selectCategory(category) {
    selectedCategory = category;
    
    // Update active button
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    event.target.classList.add('active');
    
    // Fetch new joke
    getJokes();
}

// Toggle favorites visibility
function toggleFavorites() {
    const list = document.getElementById('favoritesList');
    const icon = document.querySelector('.toggle-icon');
    
    list.classList.toggle('show');
    icon.classList.toggle('rotated');
}

// Render favorites list
function renderFavorites() {
    const list = document.getElementById('favoritesList');
    
    if (favorites.length === 0) {
        list.innerHTML = '<p style="color: var(--text-secondary); text-align: center; padding: 20px;">No favorites yet. Start adding some!</p>';
        return;
    }
    
    list.innerHTML = favorites.map(joke => `
        <div class="favorite-item">
            <button class="remove-btn" onclick="removeFavorite(${joke.id})">✕</button>
            <p class="setup">${joke.setup}</p>
            <p class="punchline show">${joke.punchline}</p>
        </div>
    `).join('');
}

// Remove from favorites
function removeFavorite(jokeId) {
    favorites = favorites.filter(fav => fav.id !== jokeId);
    localStorage.setItem('favorites', JSON.stringify(favorites));
    
    updateStats();
    renderFavorites();
    updateFavoriteButton();
    
    showToast('Removed from favorites!', 'info');
}

// Update stats display
function updateStats() {
    document.getElementById('jokesViewed').textContent = jokesViewed;
    document.getElementById('favoriteCount').textContent = favorites.length;
}

// Show toast notification
function showToast(message, type = 'success') {
    // Remove existing toasts
    document.querySelectorAll('.toast').forEach(t => t.remove());
    
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    
    if (type === 'error') {
        toast.style.background = 'var(--danger)';
    } else if (type === 'info') {
        toast.style.background = 'var(--secondary-color)';
    }
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
        if (e.target.tagName !== 'BUTTON') {
            e.preventDefault();
            getJokes();
        }
    } else if (e.key === 'r' || e.key === 'R') {
        if (e.target.tagName !== 'BUTTON') {
            showPunchline();
        }
    } else if (e.key === 'f' || e.key === 'F') {
        if (e.target.tagName !== 'BUTTON') {
            toggleFavorite();
        }
    }
});

