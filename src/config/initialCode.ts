export const sum = `export function sum(a: number, b: number): number {
  return a + b;
}

console.log("Run 'npm run update-kata' from the commandline" +
" and you will see this message in the console.");
`;

export const sumTest = `import { sum } from '../src/main';

describe('Sum should be', () => {
  test('total of 3 when adding 1 and 2', () => {
    const expectedOutput = 3;

    let result = sum(1, 2);

    expect(result).toBe(expectedOutput);
  });
});
`;

export const notes = `✅ DONE

⚠️ TODO

🚧 WIP

🅿️ PARKED
`;

export const readme = `## README

A story about your amazing kata exercise here.

# Useful commands in this project:
- \`npm run help\` - see useful commands.
- \`npm run test\` - run all tests.
- \`npm run coverage\` - run all tests and generate a coverage report.
- \`npm run compile\` - compile the TypeScript code to JavaScript (output goes to \`/dist\`).
- \`npm run kata\` - run the kata (executes \`main.js\`).
- \`npm run update-kata\` - compile latest code and run the kata (executes \`main.js\`).
`;

export const techdebt = ``;
