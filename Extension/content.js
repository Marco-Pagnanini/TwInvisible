async function getTokensFromJson() {
    // Get the json from chrome storage with key 'twin'
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
    // No tokens found
    return { tokens: [] };
}

async function modifyHtmlFromDom(instructions) {
    // Get html body
    const html = document.body.outerHTML;

    // Return the output by calling the function in background.js with chrome.runtime
    return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage(
            { type: 'MODIFY_HTML', html, instructions },
            response => {
                const err = chrome.runtime?.lastError;
                if (err) {
                    console.error('[TwInvisible] sendMessage error:', err.message);
                    reject(new Error(err.message));
                    return;
                }
                if (response?.success) {
                    resolve(response.data);
                } else {
                    reject(new Error(response?.error || 'Unknown error from background'));
                }
            }
        );
    });
}

function buildInstructionsFromTokens(tokensData) {
    if (!tokensData || !Array.isArray(tokensData.tokens) || tokensData.tokens.length === 0) {
        return '';
    }
    const tokenList = tokensData.tokens.join(', ');
    return `Remove all elements that contain or are related to these tokens/keywords: ${tokenList}`;
}

async function removeTokenContent() {
    try {
        // Get json file
        const jsonFile = await getTokensFromJson();
        // If no token skip
        if (!jsonFile || !jsonFile.tokens || jsonFile.tokens.length === 0) {
            return;
        }

        // Translate json to instructions for the API
        const instructions = buildInstructionsFromTokens(jsonFile);

        // Get the output with the API call
        const result = await modifyHtmlFromDom(instructions);

        // Put the output (new body) in the body, checking the result first
        if (result && result.modifiedHtml) {
            document.body.outerHTML = result.modifiedHtml;
        } else {
            console.warn('[TwInvisible] No modifiedHtml in response:', result);
        }
    } catch (err) {
        console.error('[TwInvisible] Error:', err.message);
    }
}

removeTokenContent();