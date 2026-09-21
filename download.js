const https = require('https');
const fs = require('fs');

const download = (url, dest) => {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
};

async function run() {
  await download('https://upload.wikimedia.org/wikipedia/commons/thumb/1/1c/Logo_de_Unimarc.svg/512px-Logo_de_Unimarc.svg.png', 'src/assets/images/unimarc.png');
  await download('https://upload.wikimedia.org/wikipedia/commons/thumb/c/cb/Logo_Tottus.svg/512px-Logo_Tottus.svg.png', 'src/assets/images/tottus.png');
  await download('https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Jumbo_Logo.svg/512px-Jumbo_Logo.svg.png', 'src/assets/images/jumbo.png');
  console.log("Done");
}

run();
