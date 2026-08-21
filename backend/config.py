import os
from pathlib import Path
from dotenv import load_dotenv
import imageio_ffmpeg

# Load environment variables
load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent
DOWNLOADS_DIR = BASE_DIR / "downloads"
OUTPUT_CLIPS_DIR = BASE_DIR / "output_clips"
TEMP_DIR = BASE_DIR / "temp"

# Ensure directories exist
DOWNLOADS_DIR.mkdir(exist_ok=True, parents=True)
OUTPUT_CLIPS_DIR.mkdir(exist_ok=True, parents=True)
TEMP_DIR.mkdir(exist_ok=True, parents=True)

def find_ffmpeg_executable():
    # 1. Search WinGet installed packages directory
    winget_pkg_dir = Path(r"C:\Users\thuyn\AppData\Local\Microsoft\WinGet\Packages")
    if winget_pkg_dir.exists():
        for p in winget_pkg_dir.glob("**/ffmpeg.exe"):
            if p.exists():
                return str(p)
                
    # 2. Fallback to imageio-ffmpeg static binary
    try:
        return imageio_ffmpeg.get_ffmpeg_exe()
    except Exception:
        pass
        
    return "ffmpeg"

FFMPEG_PATH = find_ffmpeg_executable()
FFMPEG_DIR = os.path.dirname(FFMPEG_PATH)

# Inject FFmpeg directory into OS PATH environment variable
os.environ["PATH"] = FFMPEG_DIR + os.pathsep + os.environ.get("PATH", "")

# API Keys & Models
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
WHISPER_MODEL_SIZE = os.getenv("WHISPER_MODEL_SIZE", "base")
WHISPER_DEVICE = os.getenv("WHISPER_DEVICE", "cpu")
WHISPER_COMPUTE_TYPE = os.getenv("WHISPER_COMPUTE_TYPE", "int8")

# Common Filler Words in Vietnamese and English
DEFAULT_FILLER_WORDS = [
    "à", "ừm", "ừ", "ờ", "hả", "kiểu như", "ý là", "thì là", "như là",
    "uh", "um", "uhh", "umm", "like", "you know", "i mean", "basically", "actually"
]
