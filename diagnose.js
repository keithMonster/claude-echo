const fs = require('fs');
const path = require('path');
const readline = require('readline');
const os = require('os');

const baseDir = path.join(os.homedir(), '.claude/projects');

async function scan() {
  const files = [];

  function findJsonl(dir) {
    if (!fs.existsSync(dir)) return;
    const items = fs.readdirSync(dir);
    for (const item of items) {
      const fullPath = path.join(dir, item);
      if (fs.statSync(fullPath).isDirectory()) {
         findJsonl(fullPath);
      } else if (item.endsWith('.jsonl') && item !== 'sessions-index.json') {
         files.push(fullPath);
      }
    }
  }

  findJsonl(baseDir);
  console.log(`Found ${files.length} jsonl files. Searching for tool_use...`);

  for (const file of files) {
    const fileStream = fs.createReadStream(file);
    const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

    for await (const line of rl) {
        try {
             const data = JSON.parse(line);
             // Check for tool_use in raw string form to catch any structure
             if (JSON.stringify(data).includes('tool_use')) {
                 console.log('\nFOUND SAMPLE IN: ' + file);
                 console.log(JSON.stringify(data, null, 2));
                 process.exit(0);
             }
        } catch(e){}
    }
  }
}

scan();
