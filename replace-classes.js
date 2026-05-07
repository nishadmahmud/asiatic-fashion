const fs = require('fs');
const path = require('path');

const replacements = {
  'section-container': 'w-full max-w-[1280px] mx-auto px-4 md:px-8 lg:px-12',
  'bg-primary': 'bg-[#E8611A]',
  'text-primary': 'text-[#E8611A]',
  'border-primary': 'border-[#E8611A]',
  'shadow-primary': 'shadow-[#E8611A]',
  'ring-primary': 'ring-[#E8611A]',
  'hover:bg-primary-hover': 'hover:bg-[#D45515]',
  'hover:text-primary-hover': 'hover:text-[#D45515]',
  'bg-primary-light': 'bg-[#FFF3ED]',
  'hover:bg-primary-light': 'hover:bg-[#FFF3ED]',
  'bg-bg-offwhite': 'bg-[#F8F8F6]',
  'bg-card-yellow': 'bg-[#F5EDDA]',
  'bg-card-pink': 'bg-[#F8E4E4]',
  'bg-card-beige': 'bg-[#F0ECE3]',
  'text-text-dark': 'text-[#1A1A1A]',
  'text-text-muted': 'text-[#6B6B6B]',
  'text-text-light': 'text-[#999999]',
  'border-border': 'border-[#E5E5E5]',
  'bg-text-dark': 'bg-[#1A1A1A]',
  'hover:border-text-dark': 'hover:border-[#1A1A1A]',
  'hover:text-text-dark': 'hover:text-[#1A1A1A]',
  'hover:border-text-muted': 'hover:border-[#6B6B6B]',
  'hover:text-primary': 'hover:text-[#E8611A]',
  'hover:border-primary': 'hover:border-[#E8611A]',
  'hover:bg-primary': 'hover:bg-[#E8611A]',
  'font-playfair': '"Playfair Display"',
  'var(--font-playfair)': '"Playfair Display"',
  'var(--font-inter)': '"Inter"'
};

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.js')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // Perform replacements
      for (const [search, replace] of Object.entries(replacements)) {
        // Use a global regex. For classes like hover:bg-primary we need to escape the colon.
        const escapedSearch = search.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
        const regex = new RegExp(`\\b${escapedSearch}\\b`, 'g');
        content = content.replace(regex, replace);
        
        // Also handle cases where it might be in an object property or string without word boundaries
        content = content.split(search).join(replace);
      }
      
      fs.writeFileSync(fullPath, content);
      console.log(`Updated ${fullPath}`);
    }
  }
}

processDirectory(path.join(__dirname, 'components'));
console.log('Done!');
