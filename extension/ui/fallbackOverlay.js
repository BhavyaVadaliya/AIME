// Fallback Overlay - AIME S12-T03
// Appears if automated injection fails.

export function showFallbackOverlay(replyText, reason) {
    const existing = document.getElementById('aime-fallback-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'aime-fallback-overlay';
    overlay.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 350px;
        background: #1e293b;
        border: 2px solid #334155;
        border-radius: 16px;
        padding: 20px;
        z-index: 999999;
        box-shadow: 0 10px 25px rgba(0,0,0,0.5);
        color: white;
        font-family: sans-serif;
    `;

    overlay.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
            <span style="font-size: 10px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em;">AIME Manual Fallback</span>
            <button id="aime-close-fallback" style="background: none; border: none; color: #64748b; cursor: pointer; font-size: 18px;">&times;</button>
        </div>
        <p style="font-size: 11px; color: #94a3b8; margin: 0 0 12px 0; line-height: 1.4;">AIME could not insert the draft automatically. You may continue manually using the tools below.</p>
        <div style="background: #0f172a; padding: 12px; border-radius: 8px; border: 1px solid #1e293b; margin-bottom: 16px;">
            <p style="font-size: 13px; margin: 0; line-height: 1.5; color: #f1f5f9;">${replyText}</p>
        </div>
        <div style="display: flex; flex-direction: column; gap: 8px;">
            <p style="font-size: 10px; color: #ef4444; margin: 0;">Error Code: ${reason}</p>
            <button id="aime-copy-fallback" style="width: 100%; background: #4f46e5; color: white; border: none; padding: 10px; border-radius: 8px; font-weight: 700; cursor: pointer; text-transform: uppercase; font-size: 11px;">Copy to Clipboard</button>
        </div>
    `;


    document.body.appendChild(overlay);

    document.getElementById('aime-close-fallback').onclick = () => overlay.remove();
    document.getElementById('aime-copy-fallback').onclick = () => {
        navigator.clipboard.writeText(replyText);
        const btn = document.getElementById('aime-copy-fallback');
        btn.innerText = 'Copied!';
        btn.style.background = '#10b981';
        setTimeout(() => {
            btn.innerText = 'Copy to Clipboard';
            btn.style.background = '#4f46e5';
        }, 2000);
    };
}
