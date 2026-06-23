const fs = require('fs');
const path = require('path');

const fixFile = (filePath) => {
  let content = fs.readFileSync(filePath, 'utf8');
  content = content.replace(/mb=\{4\}/g, 'sx={{ mb: 4 }}');
  content = content.replace(/height=\{400\}/g, 'sx={{ height: 400 }}');
  content = content.replace(/display="flex" justifyContent="center" alignItems="center"/g, 'sx={{ display: "flex", justifyContent: "center", alignItems: "center" }}');
  content = content.replace(/display="flex" justifyContent="space-between" alignItems="center"/g, 'sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}');
  content = content.replace(/display="flex" justifyContent="space-between" alignItems="flex-start"/g, 'sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}');
  content = content.replace(/display="flex" alignItems="center"/g, 'sx={{ display: "flex", alignItems: "center" }}');
  content = content.replace(/mt=\{2\}/g, 'sx={{ mt: 2 }}');
  content = content.replace(/height=\{300\}/g, 'sx={{ height: 300 }}');
  fs.writeFileSync(filePath, content);
};

const pagesDir = path.join(__dirname, 'src/features');
const walkSync = (dir, callback) => {
  fs.readdirSync(dir).forEach(file => {
    let filepath = path.join(dir, file);
    let stat = fs.statSync(filepath);
    if (stat.isDirectory()) walkSync(filepath, callback);
    else if (filepath.endsWith('.tsx')) callback(filepath);
  });
};

walkSync(pagesDir, fixFile);

// Also fix Sidebar.tsx primaryTypographyProps
let sidebarPath = path.join(__dirname, 'src/layouts/Sidebar.tsx');
let sidebarContent = fs.readFileSync(sidebarPath, 'utf8');
sidebarContent = sidebarContent.replace(/primaryTypographyProps=\{\{ \r?\n\s*fontSize: '0.875rem',\r?\n\s*fontWeight: isActive \? 600 : 500\r?\n\s*\}\}/g, 
  "sx={{ '& .MuiListItemText-primary': { fontSize: '0.875rem', fontWeight: isActive ? 600 : 500 } }}");
fs.writeFileSync(sidebarPath, sidebarContent);
