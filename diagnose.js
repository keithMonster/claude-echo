const fs = require('fs');
const readline = require('readline');

const filePath = '/Users/xuke/.claude/projects/-Users-xuke-githubProject-TokenFlow/b27d00ae-9b61-446a-acb1-9d102d7dfcb3.jsonl';

async function deepScan() {
  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  console.log('--- Deep Scanning Session: b27d00ae-9b61-446a-acb1-9d102d7dfcb3 ---');

  let count = 0;
  for await (const line of rl) {
    try {
      const data = JSON.parse(line);
      // ...
    } catch(e) {
      console.log('JSON Parse Error:', e.message);
      console.log('Bad line preview:', line.substring(0, 50));
    }
          count++;
          console.log(`\n[Msg #${count}] Type: ${data.message?.type || data.type}`);

          const content = data.message?.content || data.content;
          if (Array.isArray(content)) {
              console.log('Content Blocks:', content.length);
              content.forEach((block, idx) => {
                  console.log(`  Block ${idx}: type="${block.type}"`);
                  if (block.type === 'text') {
                      console.log(`    Length: ${block.text.length}`);
                      console.log(`    Is Blank?: ${!block.text.trim()}`);
                      console.log(`    Preview: ${JSON.stringify(block.text.substring(0, 50))}`);
                  }
                  if (block.type === 'tool_use') {
                      console.log(`    Tool: ${block.name}`);
                  }
              });
          } else {
              console.log('Content is not an array:', content);
          }
      }
    } catch(e) {}
  }
}

deepScan();
