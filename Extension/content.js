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

async function modifyHtmlFromDom(instructions) {
    // Get html body 
    const html = document.body.outerHTML;

    // 
    const formData = new FormData();
    formData.append('html', html);
    formData.append('instructions', instructions);

    const response = await fetch('http://10.10.50.130:5062/api/htmlmodifier/upload/html', {
    method: 'POST',
    body: formData
    });

    const result = await response.json();
    // result.modifiedHtml, result.selectorsApplied, result.success
    return result;
}

async function removeTokenContent() {
    // Get json
    const jsonFile = await getTokensFromJson();

    // API call
    const result = await modifyHtmlFromDom(jsonFile);

    // Output in body
    document.body.outerHTML = result.modifiedHtml;
}

removeTokenContent();