MEDICAL_ABBREVIATIONS = {
    "maladie pulmonaire obstructive chronique": "MPOC",
    "hypertension artérielle": "HTA",
    "maladie coronarienne athérosclérotique": "MCAS",
    # Add more common French Canadian medical abbreviations
}

def normalize_medical_terms(text: str) -> str:
    """Normalize medical terms to their abbreviated forms."""
    normalized = text
    for full_term, abbrev in MEDICAL_ABBREVIATIONS.items():
        # Case insensitive replacement
        pattern = re.compile(full_term, re.IGNORECASE)
        normalized = pattern.sub(abbrev, normalized)
    return normalized