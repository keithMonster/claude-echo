const fs = require('fs');
const readline = require('readline');

const filePath = '/Users/xuke/.claude/projects/-Users-xuke-githubProject-orbit/b5213419-2d38-49f6-80f1-8ee8ffc6a11c.jsonl';

async function analyze() {
  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let toolUseFound = 0;
  let emptyAssistantFound = 0;

  for await (const line of rl) {
    try {
      const data = JSON.parse(line);

      // Check for Tool Use
      if (JSON.stringify(data).includes('tool_use')) {
           toolUseFound++;
           if (toolUseFound <= 2) {
               console.log('--- Tool Use Sample ---');
               console.log(JSON.stringify(data, null, 2));
           }
      }

      // Check for what we thought were "empty" messages
      if (data.role === 'assistant') {
          let hasContent = false;
          // Check message content
          if (data.message && data.message.content && data.message.content.length > 0) hasContent = true;
          // Check root content (sometimes data.content)
          if (data.content && data.content.length > 0) hasContent = true;

          if (!hasContent) {
              emptyAssistantFound++;
              if (emptyAssistantFound <= 2) {
                  console.log('--- Empty Assistant Sample ---');
                  console.log(JSON.stringify(data, null, 2));
              }
          }
      }

    } catch (e) {}

    if (toolUseFound > 2 && emptyAssistantFound > 2) break;
  }
}

analyze();
