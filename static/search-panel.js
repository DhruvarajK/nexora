const observer = new MutationObserver(() => {
    const closePanelBtn = document.getElementById('closePanelBtn');
    const panelContent = document.getElementById('panelContent');
    const slidingPanel = document.getElementById('slidingPanel'); // always exists

    if (!closePanelBtn || !panelContent || !slidingPanel) return;

    function getDomainFromUrl(url) {
        try {
            const hostname = new URL(url).hostname;
            return hostname.startsWith('www.') ? hostname.substring(4) : hostname;
        } catch (e) {
            if (url.includes("googleusercontent.com/youtube.com")) return "youtube.com";
            return 'Invalid URL';
        }
    }

    async function fetchLinkDetails(url) {
        const domain = getDomainFromUrl(url);
        const apiUrl = `https://api.microlink.io?url=${encodeURIComponent(url)}`;

        try {
            const response = await fetch(apiUrl);
            if (!response.ok) throw new Error(`API error! status: ${response.status}`);
            const data = await response.json();

            return {
                title: data.data.title || `Link to ${domain}`,
                description: data.data.description || 'No description available.',
                source: data.data.publisher || domain,
                error: false
            };
        } catch (error) {
            console.error(`Failed to fetch details for ${url}:`, error);
            return {
                title: `Link to ${domain}`,
                description: 'Could not load a preview for this source.',
                source: domain,
                error: true
            };
        }
    }

    async function populatePanel(srcCon) {
        panelContent.innerHTML = `
            <div class="loading-spinner"></div>
            <p class="loading-text">Loading sources...</p>
        `;

        const sourceLinks = srcCon.querySelectorAll('.source-link-r');

        const allDetails = await Promise.all(
            Array.from(sourceLinks).map(link => fetchLinkDetails(link.href))
        );

        panelContent.innerHTML = ''; // Clear loading state

        allDetails.forEach((detail, index) => {
            const link = sourceLinks[index];
            const url = link.href;
            const domain = getDomainFromUrl(url);
            const faviconUrl = `https://www.google.com/s2/favicons?sz=32&domain=${domain}`;
            const descriptionClass = detail.error ? 'description error' : 'description';

            const sourceItem = document.createElement('div');
            sourceItem.classList.add('source-item');

            sourceItem.innerHTML = `
                <img src="${faviconUrl}" alt="Favicon for ${domain}" onerror="this.onerror=null;this.src='https://placehold.co/32x32/cccccc/ffffff?text=?'">
                <div>
                    <a href="${url}" target="_blank" rel="noopener noreferrer">${detail.title}</a>
                    <p class="${descriptionClass}">${detail.description}</p>
                    <span class="domain">${detail.source}</span>
                </div>
            `;
            panelContent.appendChild(sourceItem);
        });
    }

    // ✅ Safe Event Delegation for dynamically added #srcCon
    document.addEventListener('click', (e) => {
        const srcCon = e.target.closest('#srcCon');
        if (!srcCon) return;

        e.preventDefault();
        slidingPanel.classList.add('open');
        populatePanel(srcCon);
    });

    // Close panel handlers
    closePanelBtn.addEventListener('click', () => {
        slidingPanel.classList.remove('open');
    });

    document.addEventListener('click', (event) => {
        const srcConEl = document.getElementById('srcCon');
        if (
            !slidingPanel.contains(event.target) &&
            (!srcConEl || !srcConEl.contains(event.target)) &&
            slidingPanel.classList.contains('open')
        ) {
            slidingPanel.classList.remove('open');
        }
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && slidingPanel.classList.contains('open')) {
            slidingPanel.classList.remove('open');
        }
    });
});

// Watch for changes in DOM that might introduce #srcCon
observer.observe(document.body, { childList: true, subtree: true });

