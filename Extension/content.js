async function getTokensFromJson() {
    // Get from the chrome storage the json
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

    // Get from URL if not found from key
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
    const jsonFile = await getTokensFromJson();
    const tokens = jsonFile?.tokens;

    //FROM NOW IS A PROTOTYPE, FINAL VERSION IS WITH THE API
    const elements = document.querySelectorAll('h2, h3, p');

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
}

removeTokenContent();