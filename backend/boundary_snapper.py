import re

def snap_clip_boundaries(start_time: float, end_time: float, words: list, segments: list,
                         start_padding: float = 0.1, end_padding: float = 0.3) -> tuple:
    """
    Tự động căn chỉnh mốc thời gian start_time và end_time:
    1. start_time: Căn chuẩn vào đầu từ đầu tiên của câu (-start_padding).
    2. end_time: Căn chuẩn vào kết thúc của câu hoàn chỉnh (+end_padding) để không bị ngắt câu.
    """
    if not words:
        return start_time, end_time

    # 1. Snap Start Time: Tìm từ bắt đầu gần start_time nhất
    # Ưu tiên từ đầu câu (nằm sau dấu chấm/khoảng lặng hoặc ở đầu segment)
    best_start = start_time
    for i, w in enumerate(words):
        if abs(w["start"] - start_time) <= 1.5:
            # Nếu từ trước đó kết thúc bằng dấu câu hoặc có khoảng lặng > 0.4s
            if i == 0 or (words[i-1]["word"].rstrip().endswith(('.', '?', '!', '...')) or (w["start"] - words[i-1]["end"]) >= 0.4):
                best_start = max(0.0, w["start"] - start_padding)
                break
            elif best_start == start_time:
                best_start = max(0.0, w["start"] - start_padding)

    # 2. Snap End Time: Tìm điểm kết thúc câu gần end_time nhất
    # Tìm các từ có dấu kết thúc câu ('.', '?', '!') hoặc khoảng lặng sau đó
    best_end = end_time
    sentence_endings = []
    
    for i, w in enumerate(words):
        w_text = w["word"].strip()
        has_punct = bool(re.search(r'[.?!]$', w_text))
        
        # Kiểm tra khoảng lặng sau từ (>0.4s)
        has_pause = False
        if i < len(words) - 1:
            has_pause = (words[i+1]["start"] - w["end"]) >= 0.45
            
        if has_punct or has_pause or i == len(words) - 1:
            sentence_endings.append(w["end"])

    # Tìm điểm kết thúc câu gần với end_time nhất trong khoảng [-3.0s, +5.0s]
    candidates = [e for e in sentence_endings if (end_time - 4.0) <= e <= (end_time + 6.0)]
    if candidates:
        # Chọn candidate gần end_time nhất nhưng ưu tiên kết thúc sau end_time nếu câu đang nói dở
        best_candidate = min(candidates, key=lambda x: (abs(x - end_time), x < end_time))
        best_end = best_candidate + end_padding
    else:
        # Nếu không tìm thấy dấu câu rõ ràng, lấy từ gần end_time nhất + padding
        closest_word = min(words, key=lambda w: abs(w["end"] - end_time))
        best_end = closest_word["end"] + end_padding

    return round(best_start, 2), round(best_end, 2)
