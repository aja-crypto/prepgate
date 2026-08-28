import fs from 'fs';try{fs.cpSync('public','dist',{recursive:true,force:true});console.log('copied public to dist')}catch(e){console.error(e)}
