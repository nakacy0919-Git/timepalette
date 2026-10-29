// iPad Japanese keyboards can emit full-width digits; normalize before filtering.
export const normalizeLoginCode=value=>String(value||'').normalize('NFKC').replace(/\D/g,'').slice(0,4);
