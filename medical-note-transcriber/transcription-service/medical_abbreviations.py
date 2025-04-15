import re

"""
French medical terminology database for improving transcription accuracy.
This module provides comprehensive dictionaries of medical terms, abbreviations,
Quebec-specific expressions, and common transcription errors to enhance
the accuracy of French medical transcriptions.
"""

# Standard French medical abbreviations
STANDARD_ABBREVIATIONS = {
    "HTA": "Hypertension Artérielle",
    "MPOC": "Maladie Pulmonaire Obstructive Chronique",
    "MCAS": "Maladie Coronarienne Athérosclérotique",
    "MC1S": "Maladie Coronarienne 1 Sténose",
    "MVAS": "Maladie Vasculaire Athérosclérotique",
    "DB": "Diabète",
    "FA": "Fibrillation Auriculaire",
    "IC": "Insuffisance Cardiaque",
    "IRC": "Insuffisance Rénale Chronique",
    "IVRS": "Infection des Voies Respiratoires Supérieures",
    "Sx": "Symptômes",
    "Rx": "Prescription / Médicaments",
    "ATCD": "Antécédents",
    "EP": "Examen Physique",
    "MI": "Membre Inférieur",
    "MS": "Membre Supérieur",
    "B1B2": "Bruits cardiaques normaux",
    "MV": "Murmure Vésiculaire",
    "SAG": "Sans Aucun Problème / Stable",
    "TRS": "Trouble Respiratoire du Sommeil",
    "SAOS": "Syndrome d'Apnée Obstructive du Sommeil",
    "SARM": "Staphylococcus Aureus Résistant à la Méthicilline",
    "BPCO": "Bronchopneumopathie Chronique Obstructive",
    "AINS": "Anti-Inflammatoires Non Stéroïdiens",
    "AVC": "Accident Vasculaire Cérébral",
    "ICT": "Ischémie Cérébrale Transitoire",
    "MAPA": "Mesure Ambulatoire de la Pression Artérielle",
    "ECBU": "Examen Cytobactériologique des Urines",
    "NFS": "Numération Formule Sanguine",
    "ECG": "Électrocardiogramme",
    "ETT": "Échocardiographie Trans-Thoracique",
    "ETO": "Échocardiographie Trans-Œsophagienne",
    "SCA": "Syndrome Coronarien Aigu",
    "IDM": "Infarctus Du Myocarde",
    "FEVG": "Fraction d'Éjection du Ventricule Gauche",
    "BBG": "Bloc de Branche Gauche",
    "BBD": "Bloc de Branche Droit",
    "ESV": "Extrasystole Ventriculaire",
    "ESA": "Extrasystole Auriculaire",
    "TSVP": "Tachycardie SupraVentriculaire Paroxystique",
    "BAV": "Bloc Auriculo-Ventriculaire",
    "OAP": "Œdème Aigu du Poumon",
}

# Reverse mapping for abbreviation to full term
REVERSE_ABBREVIATIONS = {v.lower(): k for k, v in STANDARD_ABBREVIATIONS.items()}

# Quebec-specific medical terminology and expressions
QUEBEC_MEDICAL_TERMS = {
    "pogner une grippe": "contracter une grippe",
    "être magané": "être fatigué/affaibli",
    "avoir mal à la plotte": "douleur pelvienne (terme familier)",
    "être à boute": "être épuisé",
    "avoir de la misère à respirer": "avoir de la difficulté à respirer",
    "être écoeuré": "être dégoûté/fatigué d'une situation",
    "garrocher des pilules": "prescrire des médicaments de façon excessive",
    "chialer": "se plaindre",
    "être en maudit": "être en colère",
    "barrer": "verrouiller",
    "se sentir tout croche": "se sentir mal",
    "avoir des étourdissements": "avoir des vertiges",
    "avoir le cœur gros": "être triste",
    "avoir le souffle court": "être essoufflé",
    "avoir les bleus": "être déprimé",
    "avoir mal au cœur": "avoir la nausée",
}

# Specialty-specific terminology
SPECIALTY_TERMS = {
    "cardiology": {
        "SCA": "Syndrome Coronarien Aigu",
        "IDM": "Infarctus Du Myocarde",
        "FEVG": "Fraction d'Éjection du Ventricule Gauche",
        "BBG": "Bloc de Branche Gauche",
        "BBD": "Bloc de Branche Droit",
        "ESV": "Extrasystole Ventriculaire",
        "ESA": "Extrasystole Auriculaire",
        "TSVP": "Tachycardie SupraVentriculaire Paroxystique",
        "BAV": "Bloc Auriculo-Ventriculaire",
        "OAP": "Œdème Aigu du Poumon",
        "NSTEMI": "Infarctus sans élévation du segment ST",
        "STEMI": "Infarctus avec élévation du segment ST",
    },
    "pulmonology": {
        "VEMS": "Volume Expiratoire Maximum Seconde",
        "CVF": "Capacité Vitale Forcée",
        "EFR": "Exploration Fonctionnelle Respiratoire",
        "PaO2": "Pression partielle artérielle en O2",
        "PaCO2": "Pression partielle artérielle en CO2",
        "VNI": "Ventilation Non Invasive",
        "PPC": "Pression Positive Continue",
        "TDM TAP": "Tomodensitométrie Thoraco-Abdomino-Pelvienne",
        "BPCO": "Broncho-Pneumopathie Chronique Obstructive",
        "DEP": "Débit Expiratoire de Pointe",
        "SpO2": "Saturation pulsée en Oxygène",
    },
    "neurology": {
        "AVC": "Accident Vasculaire Cérébral",
        "ICT": "Ischémie Cérébrale Transitoire",
        "SEP": "Sclérose En Plaques",
        "SLA": "Sclérose Latérale Amyotrophique",
        "TCE": "Traumatisme Crânio-Encéphalique",
        "HTIC": "Hypertension Intracrânienne",
        "EEG": "Électroencéphalogramme",
        "EMG": "Électromyogramme",
        "LCR": "Liquide Céphalo-Rachidien",
        "PL": "Ponction Lombaire",
    },
}

# Common French medical drugs with their phonetic representations
MEDICAL_DRUGS = {
    "amoxicilline": {"phonetic": "a-mok-si-si-lin", "variations": ["amoxiciline", "amoxicilin"]},
    "paracétamol": {"phonetic": "pa-ra-sé-ta-mol", "variations": ["paracetamol", "paracetamole"]},
    "ibuprofène": {"phonetic": "i-bu-pro-fèn", "variations": ["ibuprofene", "ibuprofein"]},
    "metformine": {"phonetic": "mèt-for-min", "variations": ["metformin", "metformin"]},
    "atorvastatine": {"phonetic": "a-tor-va-sta-tin", "variations": ["atorvastatin", "atorvastatine"]},
    "ramipril": {"phonetic": "ra-mi-pril", "variations": ["ramipril", "ramiprill"]},
    "amlodipine": {"phonetic": "am-lo-di-pin", "variations": ["amlodipine", "amlodipine"]},
    "lévothyroxine": {"phonetic": "lé-vo-ti-rok-sin", "variations": ["levothyroxine", "levotiroxine"]},
    "pantoprazole": {"phonetic": "pan-to-pra-zol", "variations": ["pantoprazole", "pantoprazol"]},
    "warfarine": {"phonetic": "war-fa-rin", "variations": ["warfarine", "warfarin"]},
    "clopidogrel": {"phonetic": "klo-pi-do-grèl", "variations": ["clopidogrel", "clopidogrel"]},
    "lorazépam": {"phonetic": "lo-ra-zé-pam", "variations": ["lorazepam", "lorazepam"]},
    "zopiclone": {"phonetic": "zo-pi-klon", "variations": ["zopiclone", "zopiclone"]},
    "prednisone": {"phonetic": "prèd-ni-zon", "variations": ["prednisone", "prednisone"]},
    "salbutamol": {"phonetic": "sal-bu-ta-mol", "variations": ["salbutamol", "salbutamol"]},
}

# Common transcription errors and their corrections
COMMON_ERRORS = {
    "toxicoïde affecté": "trouble schizo-affectif",
    "mammiférien": "membre inférieur",
    "planète générale": "pas d'état général",
    "syndrome coronaire régulier": "syndrome coronarien",
    "coup de coeur": "cou, coeur",
    "MCRS": "MC1S",
    "VRS": "MVAS",
    "dispné": "dyspnée",
    "edème": "œdème",
    "iskémie": "ischémie",
    "parestésie": "paresthésie",
    "disestésie": "dysesthésie",
    "disfagie": "dysphagie",
    "disartrie": "dysarthrie",
    "fibulation": "fibrillation",
    "auriculère": "auriculaire",
    "ventriculère": "ventriculaire",
    "taquicardie": "tachycardie",
    "bradicardie": "bradycardie",
    "broncho-spasme": "bronchospasme",
    "pneumoni": "pneumonie",
    "asmatique": "asthmatique",
    "état générale": "état général",
    "membre inférieurs": "membres inférieurs",
    "membre supérieurs": "membres supérieurs",
    "tension artériel": "tension artérielle",
    "fréquence cardiaque": "fréquence cardiaque",
    "fréquence respiratoir": "fréquence respiratoire",
}

# Original function with improvements
def normalize_medical_terms(text: str) -> str:
    """Normalize medical terms to their abbreviated forms."""
    normalized = text
    for full_term, abbrev in STANDARD_ABBREVIATIONS.items():
        # Case insensitive replacement for full terms
        pattern = re.compile(full_term, re.IGNORECASE)
        normalized = pattern.sub(abbrev, normalized)
        
        # Also check for the lowercase version in REVERSE_ABBREVIATIONS
        full_term_lower = full_term.lower()
        if full_term_lower in REVERSE_ABBREVIATIONS:
            pattern = re.compile(full_term_lower, re.IGNORECASE)
            normalized = pattern.sub(REVERSE_ABBREVIATIONS[full_term_lower], normalized)
    
    return normalized

def correct_common_errors(text: str) -> str:
    """Apply corrections to common transcription errors."""
    corrected = text
    for error, correction in COMMON_ERRORS.items():
        # Case insensitive replacement
        pattern = re.compile(error, re.IGNORECASE)
        corrected = pattern.sub(correction, corrected)
    return corrected

def normalize_quebec_terms(text: str) -> str:
    """Normalize Quebec-specific medical expressions."""
    normalized = text
    for quebec_term, standard_term in QUEBEC_MEDICAL_TERMS.items():
        # Case insensitive replacement
        pattern = re.compile(quebec_term, re.IGNORECASE)
        normalized = pattern.sub(standard_term, normalized)
    return normalized

def get_specialty_terms(specialty: str = None) -> dict:
    """Get terminology specific to a medical specialty."""
    if specialty and specialty in SPECIALTY_TERMS:
        return SPECIALTY_TERMS[specialty]
    return {}

def get_drug_variations() -> dict:
    """Get variations of drug names for recognition improvement."""
    variations = {}
    for drug, data in MEDICAL_DRUGS.items():
        for variation in data["variations"]:
            variations[variation] = drug
    return variations

def post_process_transcription(text: str, specialty: str = None) -> str:
    """
    Apply comprehensive post-processing to improve French medical transcription accuracy.
    
    Args:
        text: The raw transcription text
        specialty: Optional medical specialty for context-specific corrections
        
    Returns:
        Processed transcription with improved accuracy
    """
    processed = text
    
    # Apply common error corrections
    processed = correct_common_errors(processed)
    
    # Normalize Quebec-specific terms
    processed = normalize_quebec_terms(processed)
    
    # Normalize medical abbreviations
    processed = normalize_medical_terms(processed)
    
    # Apply specialty-specific corrections if a specialty is provided
    if specialty and specialty in SPECIALTY_TERMS:
        for term, full_term in SPECIALTY_TERMS[specialty].items():
            # Check for the full term and replace with abbreviation
            pattern = re.compile(full_term, re.IGNORECASE)
            processed = pattern.sub(term, processed)
    
    # Normalize drug name variations
    drug_variations = get_drug_variations()
    for variation, standard in drug_variations.items():
        pattern = re.compile(r'\b' + variation + r'\b', re.IGNORECASE)
        processed = pattern.sub(standard, processed)
    
    # Context-aware corrections (using surrounding words for better accuracy)
    context_patterns = [
        (r'tension\s+(?:de|est|était|a été)\s+(\d+)[/\\](\d+)', r'tension artérielle est \1/\2'),  # Fix blood pressure readings
        (r'température\s+(?:de|est|était|a été)\s+(\d+)[,.](\d+)', r'température est \1.\2'),  # Fix temperature readings
        (r'saturation\s+(?:de|est|était|a été)\s+(\d+)\s*%', r'saturation est \1%'),  # Fix oxygen saturation
    ]
    
    for pattern, replacement in context_patterns:
        processed = re.sub(pattern, replacement, processed, flags=re.IGNORECASE)
    
    # Normalize spacing and punctuation
    processed = re.sub(r'\s+', ' ', processed)  # Normalize spaces
    processed = re.sub(r'\s([,.;:!?])', r'\1', processed)  # Fix spacing before punctuation
    
    return processed

def get_french_medical_prompt(specialty: str = None) -> str:
    """
    Generate a specialized French medical transcription prompt.
    
    Args:
        specialty: Optional medical specialty for context-specific terminology
        
    Returns:
        A detailed prompt for improving French medical transcription accuracy
    """
    base_prompt = """Ce qui suit est une transcription d'une note médicale dictée en français québécois. 
    Le texte contient des termes médicaux, des abréviations courantes et potentiellement des anglicismes.
    Prioriser la précision pour tous les termes médicaux et les noms de médicaments."""
    
    # Common terms for all specialties
    common_terms = """
    Termes et abréviations fréquents à surveiller :
    - MPOC (Maladie Pulmonaire Obstructive Chronique)
    - HTA (Hypertension Artérielle)
    - MCAS / MC1S (Maladie Coronarienne Athérosclérotique / Sténose)
    - MVAS (Maladie Vasculaire Athérosclérotique)
    - DB (Diabète)
    - FA (Fibrillation Auriculaire)
    - IC (Insuffisance Cardiaque)
    - IRC (Insuffisance Rénale Chronique)
    - IVRS (Infection des Voies Respiratoires Supérieures)
    - Sx (Symptômes)
    - Rx (Prescription / Médicaments)
    - ATCD (Antécédents)
    - EP (Examen Physique)
    - MI (Membre Inférieur)
    - MS (Membre Supérieur)
    - B1B2 (Bruits cardiaques normaux)
    - MV (Murmure Vésiculaire)
    - SAG (Sans Aucun Problème / Stable)
    - TRS (Trouble Respiratoire du Sommeil)
    """
    
    # Specialty-specific terms
    specialty_terms = {
        "cardiology": """
        Termes spécifiques à la cardiologie :
        - SCA (Syndrome Coronarien Aigu)
        - IDM (Infarctus Du Myocarde)
        - FEVG (Fraction d'Éjection du Ventricule Gauche)
        - BBG/BBD (Bloc de Branche Gauche/Droit)
        - ESV (Extrasystole Ventriculaire)
        - ESA (Extrasystole Auriculaire)
        - TSVP (Tachycardie SupraVentriculaire Paroxystique)
        - BAV (Bloc Auriculo-Ventriculaire)
        - OAP (Œdème Aigu du Poumon)
        - NSTEMI (Infarctus sans élévation du segment ST)
        - STEMI (Infarctus avec élévation du segment ST)
        """,
        "pulmonology": """
        Termes spécifiques à la pneumologie :
        - VEMS (Volume Expiratoire Maximum Seconde)
        - CVF (Capacité Vitale Forcée)
        - EFR (Exploration Fonctionnelle Respiratoire)
        - PaO2/PaCO2 (Pression partielle artérielle en O2/CO2)
        - VNI (Ventilation Non Invasive)
        - PPC (Pression Positive Continue)
        - TDM TAP (Tomodensitométrie Thoraco-Abdomino-Pelvienne)
        - BPCO (Broncho-Pneumopathie Chronique Obstructive)
        - DEP (Débit Expiratoire de Pointe)
        - SpO2 (Saturation pulsée en Oxygène)
        """,
        "neurology": """
        Termes spécifiques à la neurologie :
        - AVC (Accident Vasculaire Cérébral)
        - ICT (Ischémie Cérébrale Transitoire)
        - SEP (Sclérose En Plaques)
        - SLA (Sclérose Latérale Amyotrophique)
        - TCE (Traumatisme Crânio-Encéphalique)
        - HTIC (Hypertension Intracrânienne)
        - EEG (Électroencéphalogramme)
        - EMG (Électromyogramme)
        - LCR (Liquide Céphalo-Rachidien)
        - PL (Ponction Lombaire)
        """
    }
    
    # Regional variations and phonetic challenges
    regional_variations = """
    Particularités du français québécois :
    - "Pogner" (attraper/contracter une maladie)
    - "Être magané" (être fatigué/affaibli)
    - "Avoir mal à la plotte" (douleur pelvienne, terme familier)
    - "Être à boute" (être épuisé)
    - "Avoir de la misère à" (avoir de la difficulté à)
    - "Être écoeuré" (être dégoûté/fatigué d'une situation)
    - "Garrocher" (lancer/jeter, par exemple des médicaments)
    - "Chialer" (se plaindre)
    - "Être en maudit" (être en colère)
    - "Barrer" (verrouiller)
    
    Défis phonétiques :
    - Sons nasaux (in/un/an/on) souvent prononcés différemment du français standard
    - Diphtongaison des voyelles longues (père → paère, fête → faite)
    - Affrication des consonnes t/d devant i/u (tu → tsu, dire → dzire)
    - Réduction des groupes consonantiques (notre → not', quatre → quat')
    """
    
    # Common errors and corrections
    error_corrections = """
    Corrections importantes :
    - État général (et non 'état générale')
    - Syndrome coronarien (et non 'syndrome coronaire')
    - Trouble schizo-affectif (et non 'toxicoïde affecté')
    - Cou, coeur (et non 'coup de coeur')
    - Membre inférieur (et non 'mammiférien')
    - Pas d'état général (et non 'planète générale')
    - MC1S (et non 'MCRS')
    - MVAS (et non 'VRS')
    - Dyspnée (et non 'dispné')
    - Œdème (et non 'edème')
    - Ischémie (et non 'iskémie')
    - Paresthésie (et non 'parestésie')
    - Dysesthésie (et non 'disestésie')
    - Dysphagie (et non 'disfagie')
    - Dysarthrie (et non 'disartrie')
    """
    
    # Instructions
    instructions = """
    Instructions importantes :
    - Transcrire littéralement, y compris les hésitations ('euh') ou répétitions si présentes.
    - Conserver les anglicismes s'ils sont utilisés par le locuteur (ex: 'check-up', 'feeling').
    - Utiliser la terminologie médicale précise même si la prononciation est approximative.
    - Faire attention aux chiffres, dosages de médicaments et unités.
    - Préserver la distinction entre singulier et pluriel (ex: 'membre inférieur' vs 'membres inférieurs').
    - Respecter la ponctuation dictée ou implicite dans l'intonation.
    - Maintenir les structures de phrases même si elles semblent grammaticalement incorrectes.
    - Transcrire les acronymes médicaux tels que prononcés, sans les développer.
    """
    
    # Combine all sections
    prompt = base_prompt + "\n\n" + common_terms
    
    # Add specialty-specific terms if a specialty is provided
    if specialty and specialty in specialty_terms:
        prompt += "\n\n" + specialty_terms[specialty]
    
    prompt += "\n\n" + regional_variations + "\n\n" + error_corrections + "\n\n" + instructions
    
    return prompt