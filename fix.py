import os
import glob

def fix_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()
    
    content = content.replace('mb={4}', 'sx={{ mb: 4 }}')
    content = content.replace('height={400} display="flex" justifyContent="center" alignItems="center"', 'sx={{ height: 400, display: "flex", justifyContent: "center", alignItems: "center" }}')
    
    with open(filepath, 'w') as f:
        f.write(content)

pages_dir = 'src/features'
for filepath in glob.glob(os.path.join(pages_dir, '**/*.tsx'), recursive=True):
    fix_file(filepath)

print("Fixed TS files")
