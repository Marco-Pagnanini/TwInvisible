console.log('[TwInsible] content script avviato su', location.href);

async function getTokensFromJson() {
    // Stesso percorso del popup: twin["tokens.json"] è l'oggetto { tokens: [...] }
    const stored = await new Promise((resolve, reject) => {
        try {
            chrome.storage.local.get(['twin'], result => {
                const err = chrome.runtime?.lastError;
                if (err) {
                    reject(new Error(err.message));
                    return;
                }
                const doc = result.twin?.['tokens.json'];
                if (doc && Array.isArray(doc.tokens) && doc.tokens.length > 0) {
                    resolve(doc);
                } else {
                    resolve(null);
                }
            });
        } catch (e) {
            reject(e);
        }
    });

    if (stored) {
        return stored;
    }

    const url = chrome.runtime.getURL('tokens.json');
    try {
        const res = await fetch(url);
        if (!res.ok) {
            return { tokens: [] };
        }
        const data = await res.json();
        return data && Array.isArray(data.tokens) ? data : { tokens: [] };
    } catch {
        return { tokens: [] };
    }
}

async function removeTokenContent() {
    try {
        const jsonFile = await getTokensFromJson();
        console.log('[TwInsible] contenuto tokens:', jsonFile);

        const tokens = jsonFile?.tokens;
        if (!Array.isArray(tokens) || tokens.length === 0) {
            console.log('[TwInsible] nessun token da applicare (lista vuota o assente).');
            return;
        }

        //FROM NOW IS A PROTOTYPE, FINAL VERSION IS WITH THE API
        const elements = document.querySelectorAll('*');

        elements.forEach(el => {
            const text = el.innerText.toLowerCase();

            tokens.forEach(token => {
                const itoken = token.toLowerCase();

                if (text.includes(itoken)) {
                    let grandParent = el.parentElement?.parentElement;
                    if (grandParent && grandParent.tagName.toLowerCase() === 'div') {
                        grandParent.remove();
                    } else {
                        el.remove();
                    }
                }
            });
        });
    } catch (e) {
        console.error('[TwInsible] errore in removeTokenContent:', e);
    }
}

removeTokenContent().catch(e => console.error('[TwInsible] promise non gestita:', e));