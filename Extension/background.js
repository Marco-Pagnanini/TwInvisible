chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'MODIFY_HTML') {
        handleModifyHtml(message.html, message.instructions)
            .then(result => sendResponse({ success: true, data: result }))
            .catch(err => sendResponse({ success: false, error: err.message }));
        return true; // keep the message channel open for async response
    }
});

async function handleModifyHtml(html, instructions) {
    const response = await fetch('http://10.10.50.130:5062/api/htmlmodifier/json', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ html, instructions })
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API error ${response.status}: ${errorText}`);
    }

    return await response.json();
}
