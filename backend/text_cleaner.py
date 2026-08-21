from backend.config import DEFAULT_FILLER_WORDS

def detect_filler_words_and_silence(words: list, filler_list: list = None, min_silence_duration: float = 0.6) -> dict:
    """
    Phát hiện các từ ậm ờ và khoảng lặng kéo dài để lọc bỏ khỏi video.
    """
    if filler_list is None:
        filler_list = DEFAULT_FILLER_WORDS
        
    cleaned_words = []
    removed_fillers = []
    silence_gaps = []
    
    # 1. Phát hiện từ ậm ờ (Filler words)
    for w in words:
        word_clean = w["word"].lower().strip(".,!?\"'")
        if word_clean in filler_list:
            removed_fillers.append(w)
        else:
            cleaned_words.append(w)
            
    # 2. Phát hiện khoảng lặng kéo dài (Silence gaps)
    for i in range(len(cleaned_words) - 1):
        curr_end = cleaned_words[i]["end"]
        next_start = cleaned_words[i+1]["start"]
        gap = next_start - curr_end
        
        if gap >= min_silence_duration:
            silence_gaps.append({
                "start": curr_end,
                "end": next_start,
                "duration": gap
            })
            
    print(f"[TextCleaner] Đã phát hiện {len(removed_fillers)} từ ậm ờ và {len(silence_gaps)} khoảng lặng cần loại bỏ.")
    
    return {
        "cleaned_words": cleaned_words,
        "removed_fillers": removed_fillers,
        "silence_gaps": silence_gaps,
        "cleaned_text": " ".join([w["word"] for w in cleaned_words])
    }
