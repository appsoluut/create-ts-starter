export const sum = `export function sum(a: number, b: number): number {
  return a + b;
}
`

export const sumTest = `import { sum } from '@/index';

describe('Sum should be', () => {
  test('total of 3 when adding 1 and 2', () => {
    const expectedOutput = 3;

    let result = sum(1, 2);

    expect(result).toBe(expectedOutput);
  });
});
`

export const notes = `✅ DONE

⚠️ TODO

🚧 WIP

🅿️ PARKED
`

export const readme = `# README

A story about your amazing kata excersize here.`

export const techdebt = ``