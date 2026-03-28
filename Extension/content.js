async function getTokensFromJson() {
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

    // No bundled tokens.json fallback needed
    return { tokens: [] };
}

async function modifyHtmlFromDom(instructions) {
    const html = document.body.outerHTML;
    console.log('[TwInvisible] HTML size:', html.length, 'chars');

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
                console.log('[TwInvisible] Background response:', JSON.stringify(response).substring(0, 500));
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
        const jsonFile = await getTokensFromJson();

        if (!jsonFile || !jsonFile.tokens || jsonFile.tokens.length === 0) {
            console.log('[TwInvisible] No tokens found, skipping.');
            return;
        }

        const instructions = buildInstructionsFromTokens(jsonFile);
        console.log('[TwInvisible] Sending request with instructions:', instructions);

        const result = await modifyHtmlFromDom(instructions);
        console.log('[TwInvisible] Result received. success:', result?.success, 'modifiedHtml length:', result?.modifiedHtml?.length, 'selectors:', result?.selectorsApplied);

        if (result && result.modifiedHtml) {
            document.body.outerHTML = result.modifiedHtml;
            console.log('[TwInvisible] Page modified! Selectors applied:', result.selectorsApplied);
        } else {
            console.warn('[TwInvisible] No modifiedHtml in response:', result);
        }
    } catch (err) {
        console.error('[TwInvisible] Error:', err.message);
    }
}

removeTokenContent();
