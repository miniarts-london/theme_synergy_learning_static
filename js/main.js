/**
 * Synergy Learning theme
 */
(() => {
    'use strict';

    // Stand-in for Moodle's core/toast, so the code below can call addToast() like the theme does.
    const addToast = (message) => {
        const toast = document.querySelector('[data-toast]');
        if (!toast || !window.bootstrap) {
            return;
        }
        toast.querySelector('[data-toast-body]').textContent = message;
        window.bootstrap.Toast.getOrCreateInstance(toast, {delay: 4000}).show();
    };

    // ---- navbar (theme: amd/src/navbar.js) ----

    const initNavbar = () => {
        const header = document.querySelector('[data-header]');

        // Watching a 1px marker 24px down the page is cheaper than a scroll listener.
        // Once it scrolls out of view, the header shrinks.
        const marker = document.createElement('div');
        marker.setAttribute('aria-hidden', 'true');
        marker.style.cssText = 'position:absolute;top:24px;left:0;width:1px;height:1px;pointer-events:none;';
        document.body.prepend(marker);

        new IntersectionObserver(([entry]) => {
            header.classList.toggle('is-scrolled', !entry.isIntersecting);
        }).observe(marker);

        // scroll-padding needs the real header height, which changes between breakpoints.
        new ResizeObserver(() => {
            document.documentElement.style.setProperty('--ml-header-h', `${header.offsetHeight}px`);
        }).observe(header);

        // On mobile, close the menu after picking a link.
        const menu = document.getElementById('primary-nav');
        menu.querySelectorAll('.nav-link').forEach((link) => link.addEventListener('click', () => {
            if (menu.classList.contains('show')) {
                window.bootstrap.Collapse.getOrCreateInstance(menu).hide();
            }
        }));

        // "Course catalogue" is only marked as current while you're looking at that section.
        // (In Moodle, the theme marks the current item on the server instead.)
        document.querySelectorAll('[data-spy-link]').forEach((link) => {
            const section = document.getElementById(link.dataset.spyLink);
            new IntersectionObserver(([entry]) => {
                if (entry.isIntersecting) {
                    link.setAttribute('aria-current', 'location');
                } else {
                    link.removeAttribute('aria-current');
                }
            }, {rootMargin: '-40% 0px -50% 0px'}).observe(section);
        });
    };

    // ---- frontpage (theme: amd/src/frontpage.js) ----

    const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /**
     * Validation, password toggle, Caps Lock warning and a loading state on submit.
     *
     * @param {HTMLFormElement} form
     */
    const setupLoginForm = (form) => {
        const username = form.querySelector('#username');
        const password = form.querySelector('#password');
        const status = form.querySelector('[data-login-status]');

        const check = (input) => {
            const ok = input.value.trim() !== '';
            input.classList.toggle('is-invalid', !ok);
            input.setAttribute('aria-invalid', ok ? 'false' : 'true');
            return ok;
        };

        // Don't shout at people before they've typed anything.
        for (const input of [username, password]) {
            input.addEventListener('input', () => {
                input.dataset.touched = 1;
                if (input.classList.contains('is-invalid')) {
                    check(input);
                }
            });
            input.addEventListener('blur', () => input.dataset.touched && check(input));
        }

        form.addEventListener('submit', (e) => {
            // Static page only: there's no server to post to. In Moodle the form really submits.
            e.preventDefault();
            status.textContent = '';

            // Check both, so both get marked, then focus the first one that's wrong.
            const errors = [username, password].filter((input) => !check(input));
            if (errors.length) {
                errors[0].focus();
                if (errors.length === 2) {
                    status.textContent = 'Enter your username and password.';
                } else {
                    status.textContent = errors[0] === username ? 'Enter your username.' : 'Enter your password.';
                }
                return;
            }

            const button = form.querySelector('[data-login-submit]');
            const icon = button.querySelector('.btn-icon');
            const label = button.querySelector('[data-submit-label]');
            icon.hidden = true;
            button.insertAdjacentHTML('afterbegin', '<span class="spinner-border" aria-hidden="true"></span>');
            label.textContent = 'Logging in…';
            button.setAttribute('aria-busy', 'true');
            button.disabled = true;

            // Static page only: put the button back and explain.
            setTimeout(() => {
                button.querySelector('.spinner-border').remove();
                icon.hidden = false;
                label.textContent = 'Log in';
                button.removeAttribute('aria-busy');
                button.disabled = false;
                status.textContent = 'This is a static prototype, so there is no account to log in to. '
                    + 'In Moodle this form posts to /login/index.php.';
            }, 1200);
        });

        const toggle = form.querySelector('[data-password-toggle]');
        toggle.addEventListener('click', () => {
            const showing = password.type === 'password';
            password.type = showing ? 'text' : 'password';
            toggle.setAttribute('aria-pressed', showing);
            toggle.querySelector('[data-toggle-label]').textContent = showing ? 'Hide password' : 'Show password';
            password.focus();
        });

        const capsWarning = form.querySelector('#capslock-warning');
        const updateCaps = (e) => {
            capsWarning.hidden = !e.getModifierState?.('CapsLock');
        };
        password.addEventListener('keydown', updateCaps);
        password.addEventListener('keyup', updateCaps);
        password.addEventListener('blur', () => {
            capsWarning.hidden = true;
        });
    };

    /**
     * "Course catalogue" in the menu: scroll down and move focus to the section heading.
     *
     * @param {HTMLElement} section
     */
    const setupCatalogueLink = (section) => {
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a[href="#catalogue"]');
            if (!link || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey) {
                return;
            }

            e.preventDefault();
            section.scrollIntoView({behavior: prefersReducedMotion() ? 'auto' : 'smooth'});
            const heading = section.querySelector('h2');
            heading.tabIndex = -1;
            heading.focus({preventScroll: true});
            history.replaceState(null, '', '#catalogue');
        });
    };
    
    /**
     * Static page only: Dashboard, My badges and Events need a login, so they bring you to the form,
     * the way Moodle's require_login redirect would.
     *
     * @param {HTMLFormElement} form
     */
    const setupLoginLinks = (form) => {
        const username = form.querySelector('#username');

        document.querySelectorAll('[data-focus-login], [data-requires-login]').forEach((link) => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const what = link.dataset.requiresLogin;
                if (what) {
                    addToast(`You need to log in first to see ${what}.`);
                }
                form.scrollIntoView({behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'center'});
                username.focus({preventScroll: true});
            });
        });
    };

    /**
     * Static page only: links to Moodle pages that don't exist here explain where they'd go instead of a 404.
    */
    const setupDemoLinks = () => {
        document.querySelectorAll('[data-demo-link]').forEach((link) => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const text = link.textContent.trim().replace(/\s+/g, ' ');
                addToast(`“${text}” links to ${link.getAttribute('href')} in Moodle, which is outside this static page.`);
            });
        });
    };

    /**
     * Fade the sections and cards in as they come into view.
     *
     * @param {HTMLElement} root
     */
    const setupReveal = (root) => {
        if (prefersReducedMotion() || !window.IntersectionObserver) {
            return;
        }

        const cards = root.querySelectorAll('.catalogue__grid [data-reveal]');
        cards.forEach((card, i) => card.style.setProperty('--reveal-index', i));

        const observer = new IntersectionObserver((entries) => {
            for (const entry of entries) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-revealed');
                    observer.unobserve(entry.target);
                }
            }
        }, {threshold: 0.15});
        root.querySelectorAll('[data-reveal]').forEach((el) => observer.observe(el));

        // Content is only hidden from here on, once we know the observer will show it again.
        root.classList.add('reveal-ready');
    };

    /**
     * Click-to-load video, so nothing is downloaded until someone presses play.
     *
     * @param {HTMLElement} frame
     */
    const setupVideo = (frame) => {
        const playButton = frame.querySelector('[data-video-play]');

        playButton.addEventListener('click', () => {
            const video = document.createElement('video');
            video.controls = true;
            video.playsInline = true;
            video.poster = frame.querySelector('img')?.currentSrc || '';
            video.setAttribute('aria-label', frame.dataset.title);
            const source = document.createElement('source');
            source.src = frame.dataset.src;
            source.type = 'video/mp4';
            video.append(source);

            // No video file has been supplied yet, so expect this to fail for now.
            source.addEventListener('error', () => {
                const note = document.createElement('div');
                note.className = 'video__fallback';
                note.setAttribute('role', 'status');
                note.innerHTML = '<strong>Video not available</strong>'
                    + '<span>No video file was supplied with the concept assets. '
                    + 'Add it at <code></code> and it will play here.</span>';
                note.querySelector('code').textContent = frame.dataset.src;
                frame.append(note);
            });

            playButton.replaceWith(video);
            video.focus();
            video.play().catch(() => {
                // Autoplay was blocked; the controls are there.
            });
        }, {once: true});
    };

    const initFrontpage = () => {
        const root = document.documentElement;

        const form = document.querySelector('[data-login-form]');
        if (form) {
            setupLoginForm(form);
            setupLoginLinks(form);
        }
        document.querySelectorAll('[data-video]').forEach(setupVideo);

        const catalogue = document.getElementById('catalogue');
        if (catalogue) {
            setupCatalogueLink(catalogue);
        }
        setupDemoLinks();
        setupReveal(root);
    };

    // ---- footer (theme: amd/src/footer.js) ----

    const STORAGE_KEY = 'ml-cookie-prefs';

    // Some private browsing modes make localStorage throw, so treat it as optional.
    const readPrefs = () => {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
        } catch (e) {
            return {};
        }
    };

    const savePrefs = (prefs) => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
        } catch (e) {
            // Not saved, but the toast still confirms the choice for this visit.
        }
    };

    const initFooter = () => {
        // The year is the only date in the footer; in Moodle it comes from the copyright setting instead.
        document.querySelectorAll('[data-year]').forEach((el) => {
            el.textContent = new Date().getFullYear();
        });

        const popup = document.getElementById('cookie-modal');
        if (!popup) {
            return;
        }
        const analytics = popup.querySelector('#cookie-analytics');

        // Bootstrap opens the pop-up from the button and sends focus back to it when it closes.
        popup.addEventListener('show.bs.modal', () => {
            analytics.checked = !!readPrefs().analytics;
        });

        popup.querySelector('form').addEventListener('submit', (e) => {
            e.preventDefault();
            savePrefs({analytics: analytics.checked, savedAt: Date.now()});
            window.bootstrap.Modal.getOrCreateInstance(popup).hide();
            addToast(`Cookie preferences saved. Analytics ${analytics.checked ? 'on' : 'off'}.`);
        });
    };

    initNavbar();
    initFrontpage();
    initFooter();
})();
