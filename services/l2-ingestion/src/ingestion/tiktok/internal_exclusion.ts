import * as fs from 'fs';
import * as path from 'path';

let excludedAccountsCache: any[] | null = null;

function getExcludedAccounts(): any[] {
    if (excludedAccountsCache !== null) {
        return excludedAccountsCache;
    }

    try {
        const rootDir = path.join(__dirname, '..', '..', '..', '..', '..');
        const configPath = path.join(rootDir, 'config', 'ingestion', 'tiktok_scope.json');
        
        if (fs.existsSync(configPath)) {
            const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
            if (config.excluded_accounts && Array.isArray(config.excluded_accounts)) {
                excludedAccountsCache = config.excluded_accounts;
                return excludedAccountsCache || [];
            }
        }
    } catch (e) {
        console.error("Failed to load excluded_accounts from config", e);
    }
    
    excludedAccountsCache = [];
    return excludedAccountsCache;
}

export function isInternalAccount(author: any): boolean {
    const excludedAccounts = getExcludedAccounts();
    if (!excludedAccounts || excludedAccounts.length === 0) return false;

    // author might be a string (username) or an object
    let usernameToCheck = '';
    let userIdToCheck = '';

    if (typeof author === 'string') {
        usernameToCheck = author.replace('@', '').toLowerCase();
    } else if (author && typeof author === 'object') {
        usernameToCheck = (author.uniqueId || author.username || author.nickname || author.name || author.secUid || '').replace('@', '').toLowerCase();
        userIdToCheck = author.id || author.user_id || author.secUid || author.uid || '';
    }

    for (const ex of excludedAccounts) {
        const exUsername = (ex.username || '').replace('@', '').toLowerCase();
        const exUserId = (ex.user_id || '').toString();

        if (exUsername && usernameToCheck === exUsername) {
            return true;
        }

        if (exUserId && userIdToCheck && userIdToCheck === exUserId) {
            return true;
        }
    }

    return false;
}
