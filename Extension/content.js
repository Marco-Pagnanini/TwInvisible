async function getTokensFromJson() {
    const stored = await new Promise(resolve => {
        chrome.storage.local.get(['tokens'], result => {
            resolve(result.tokens);
        });
    });

    if (stored && stored.length > 0) {
        return stored;
    }

    const url = chrome.runtime.getURL('tokens.json');
    const res = await fetch(url);
    return await res.json();
}

async function removeTokenContent() {
    // Load from json
    const jsonFile = await getTokensFromJson();
    const tokens = jsonFile.tokens;

    //FROM NOW IS A PROTOTYPE, FINAL VERSION IS WITH THE API
    // Load all elements (only small)
    const elements = document.querySelectorAll();

    // Research    
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
        })
    })
}

// Remove called
removeTokenContent();