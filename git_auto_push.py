import os
import sys
import dulwich.porcelain
import dulwich.repo

REPO_DIR = os.path.dirname(os.path.abspath(__file__))
TOKEN_FILE = os.path.join(REPO_DIR, '.git', 'github_token.txt')

def get_token():
    if os.path.exists(TOKEN_FILE):
        with open(TOKEN_FILE, 'r', encoding='utf-8') as f:
            return f.read().strip()
    return os.environ.get('GITHUB_TOKEN', '')

def auto_push(commit_message="Update codebase"):
    token = get_token()
    if not token:
        print("❌ Error: Missing GitHub Token in .git/github_token.txt")
        return False

    remote_url = f"https://thuysyooyoo:{token}@github.com/thuysyooyoo/video-edit-website.git"
    os.chdir(REPO_DIR)
    repo = dulwich.repo.Repo(REPO_DIR)
    
    # 1. Add all changed files
    dulwich.porcelain.add(REPO_DIR, paths=['.'])
    
    # 2. Commit
    try:
        c = dulwich.porcelain.commit(REPO_DIR, message=commit_message.encode('utf-8'))
        print(f"✅ Committed: {c.decode('utf-8')[:8] if isinstance(c, bytes) else str(c)[:8]}")
    except Exception as e:
        print(f"ℹ️ Commit status: {e}")

    # 3. Ensure branch main ref is updated
    if b'refs/heads/master' in repo.refs:
        repo[b'refs/heads/main'] = repo[b'refs/heads/master']
    
    # 4. Push to GitHub main
    print("🚀 Pushing to GitHub repository...")
    dulwich.porcelain.push(REPO_DIR, remote_url, 'refs/heads/main:refs/heads/main')
    print("🎉 Successfully pushed to GitHub main branch!")
    return True

if __name__ == '__main__':
    msg = sys.argv[1] if len(sys.argv) > 1 else "Auto update from Opus Studio"
    auto_push(msg)
