const menuButton = document.querySelector('.menu-button');
const mobileMenu = document.querySelector('.mobile-menu');

if (menuButton && mobileMenu) {
    const setMenuOpen = (isOpen) => {
        mobileMenu.classList.toggle('is-open', isOpen);
        menuButton.setAttribute('aria-expanded', String(isOpen));
        menuButton.setAttribute('aria-label', isOpen ? 'Menü schließen' : 'Menü öffnen');
    };

    menuButton.addEventListener('click', () => {
        setMenuOpen(menuButton.getAttribute('aria-expanded') !== 'true');
    });

    mobileMenu.addEventListener('click', (event) => {
        if (event.target.closest('a')) setMenuOpen(false);
    });

    document.addEventListener('click', (event) => {
        if (!event.target.closest('.navbar-inner')) setMenuOpen(false);
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            setMenuOpen(false);
            menuButton.focus();
        }
    });

    window.addEventListener('resize', () => {
        if (window.matchMedia('(min-width: 681px)').matches) setMenuOpen(false);
    });
}

const copyButton = document.querySelector('.copy-button');

if (copyButton) {
    const hint = copyButton.querySelector('.copy-hint');
    const original = hint.textContent;
    let timer;

    copyButton.addEventListener('click', async () => {
        let ok = true;
        try {
            await navigator.clipboard.writeText(copyButton.dataset.copy);
        } catch {
            ok = false;
        }
        hint.textContent = ok ? 'Kopiert!' : 'Bitte manuell kopieren';
        copyButton.classList.toggle('copied', ok);
        clearTimeout(timer);
        timer = setTimeout(() => {
            hint.textContent = original;
            copyButton.classList.remove('copied');
        }, 2000);
    });
}

const revealItems = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window) {
    document.documentElement.classList.add('js-reveal');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                setTimeout(() => { entry.target.style.transitionDelay = ''; }, 1200);
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.15 });
    revealItems.forEach((el, i) => {
        el.style.transitionDelay = el.classList.contains('mode-card') ? `${(i % 3) * 0.1}s` : '0s';
        observer.observe(el);
    });
}

const creatorGrid = document.querySelector('.creator-grid');
const originalCreatorCards = creatorGrid ? Array.from(creatorGrid.querySelectorAll('.creator-card')) : [];
const creatorPrev = document.querySelector('.creator-prev');
const creatorNext = document.querySelector('.creator-next');
const creatorProgress = document.querySelector('.creator-progress');
const creatorProgressFill = document.querySelector('.creator-progress-fill');

if (creatorGrid && originalCreatorCards.length > 1 && creatorPrev && creatorNext && creatorProgress && creatorProgressFill) {
    const cloneCount = Math.min(3, originalCreatorCards.length);
    const cloneCard = (card) => {
        const clone = card.cloneNode(true);
        clone.classList.remove('reveal');
        clone.classList.add('visible');
        return clone;
    };
    creatorGrid.prepend(...originalCreatorCards.slice(-cloneCount).map(cloneCard));
    creatorGrid.append(...originalCreatorCards.slice(0, cloneCount).map(cloneCard));
    const creatorCards = Array.from(creatorGrid.querySelectorAll('.creator-card'));
    const interval = 4500;
    let activeIndex = cloneCount;
    let timer;
    let isResetting = false;
    let resetTimer;

    const getCreatorScrollPosition = (index) => {
        const cardWidth = creatorCards[0].offsetWidth;
        const gap = parseFloat(getComputedStyle(creatorGrid).columnGap) || 0;
        return Math.max(0, index * (cardWidth + gap) - (creatorGrid.clientWidth - cardWidth) / 2);
    };

    const updateCreatorSlider = (restartProgress = true, behavior = 'smooth') => {
        creatorCards.forEach((card, index) => {
            card.classList.toggle('is-active', index === activeIndex);
        });
        creatorGrid.scrollTo({ left: getCreatorScrollPosition(activeIndex), behavior });
        const progressIndex = (activeIndex - cloneCount + originalCreatorCards.length) % originalCreatorCards.length;
        creatorProgress.setAttribute('aria-valuenow', String(progressIndex + 1));
        if (restartProgress) {
            creatorProgressFill.style.transition = 'none';
            creatorProgressFill.style.width = '0';
            requestAnimationFrame(() => {
                creatorProgressFill.style.transition = `width ${interval}ms linear`;
                creatorProgressFill.style.width = '100%';
            });
        }
    };

    const resetToLoop = () => {
        const canonicalIndex = cloneCount + (
            (activeIndex - cloneCount + originalCreatorCards.length) % originalCreatorCards.length
        );
        if (canonicalIndex === activeIndex) return;
        isResetting = true;
        activeIndex = canonicalIndex;
        updateCreatorSlider(false, 'instant');
        isResetting = false;
    };

    const scheduleLoopReset = () => {
        clearTimeout(resetTimer);
        resetTimer = setTimeout(resetToLoop, 900);
    };

    const restartTimer = () => {
        clearInterval(timer);
        timer = setInterval(() => {
            if (isResetting) return;
            activeIndex += 1;
            updateCreatorSlider();
            scheduleLoopReset();
        }, interval);
    };

    const moveSlider = (direction) => {
        activeIndex += direction;
        if (activeIndex < 0) activeIndex = cloneCount + originalCreatorCards.length - 1;
        if (activeIndex >= cloneCount + originalCreatorCards.length + cloneCount) activeIndex = cloneCount;
        updateCreatorSlider();
        scheduleLoopReset();
        restartTimer();
    };

    creatorPrev.addEventListener('click', () => moveSlider(-1));
    creatorNext.addEventListener('click', () => moveSlider(1));
    window.addEventListener('resize', () => updateCreatorSlider(false));
    updateCreatorSlider();
    restartTimer();
}

// Promo-Karte: einmal pro Besuch beim Runterscrollen, jederzeit schließbar
const promo = document.getElementById('promo');
if (promo) {
    let seen = false;
    try { seen = sessionStorage.getItem('promoSeen') === '1'; } catch {}

    const closePromo = () => {
        try { sessionStorage.setItem('promoSeen', '1'); } catch {}
        promo.classList.remove('show');
        setTimeout(() => { promo.hidden = true; }, 400);
        window.removeEventListener('scroll', onScroll);
    };

    const onScroll = () => {
        if (window.scrollY < window.innerHeight * 0.6) return;
        window.removeEventListener('scroll', onScroll);
        promo.hidden = false;
        requestAnimationFrame(() => requestAnimationFrame(() => promo.classList.add('show')));
    };

    if (!seen) window.addEventListener('scroll', onScroll, { passive: true });
    promo.querySelector('.promo-close').addEventListener('click', closePromo);
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && promo.classList.contains('show')) closePromo();
    });
}