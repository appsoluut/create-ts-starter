#!/usr/bin/env node

import { intro, text, tasks, outro, isCancel, cancel, log } from '@clack/prompts';
import { exec, execSync } from 'node:child_process';
import { promises } from 'fs';

const sum = `export function sum(a: number, b: number): number {
    return a + b;
}
`

const sumTest = `import { sum } from '../src/index'

describe('sum', () => {
    it("sum of 1 + 2 should return 3", () => {
        // arrange
        const expectedOutput = 3;
        
        // act
        let result = sum(1, 2);

        // assert
        expect(result).toBe(expectedOutput);
    })
});`

const gitignore = `node_modules/
package-lock.json
`

const jestconfig =`module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
};
`

const notes = `✅ DONE

⚠️ TODO

🚧 WIP

🅿️ PARKED
`

const readme = `# README

A story about your amazing kata excersize here.`

const techdebt = ``

function onCancel(message: string) {
    cancel(message);
    process.exit(0);
}

function myExec(cmd: string): Promise<string> {
    return new Promise((resolve) => {
        myExecImpl(resolve, cmd)
    });
}

function myExecImpl(callback: (output: string) => void, cmd: string) {
    exec(cmd, (error, stdout, stderr) => {
        if (error) throw error;
        callback(stdout || stderr);
    })
}

async function stripComments(fileName: string) {
    const fname = process.cwd() + '/' + fileName;
    const re = /\/\*[\s\S]*?\*\/|(?<=[^:])\/\/.*|^\/\/.*/g

    try {
        let data = await promises.readFile(fileName, "utf8");
        let contents = data.replace(re, "").replace(/\s*\r?\n/g, "\n");
        await promises.writeFile(fname, contents)
    } catch(err) {
        onCancel(err as string);
        return;
    }
}

function updateValues(fileName: string, values: Map<String, any>) {
    const fname = process.cwd() + '/' + fileName;
    try {
        let file = require(fname);
        file = Object.assign(file, Object.fromEntries(values));
        promises.writeFile(fname, JSON.stringify(file, null, 2))
    } catch(err) {
        onCancel(err as string);
        return;
    }
}

async function main() {
    intro(`Set up Typescript project`);

    const projectName = await text({
        message: 'What is your project name?',
        placeholder: 'project-name',
        initialValue: 'kata-ts',
        validate(value) {
            if (value.length === 0) return `Value is required!`;
        },
    });

    if (isCancel(projectName)) {
        onCancel('User cancelled.')
    }

    await tasks([
        {
            title: 'Setting up npm package',
            task: async (message) => {
                // Do installation here
                await myExec(`npm init -init-version=0.0.1 -y && npm install ts-node && npm install --save-dev jest ts-jest @types/jest`)
                updateValues('./package.json', new Map<string, any>([
                    ['name', projectName],
                    ['scripts', {test: "jest"}]
                ]));
                return `Installed via npm`;
            },
        },
        {
            title: 'Setting up typescript',
            task: async (message) => {
                // Do installation here
                await myExec(`tsc --init`);
                stripComments('./tsconfig.json').then(() => {
                    updateValues('./tsconfig.json', new Map<string, any>([
                        ['include', ["src/**/*", "tests/**/*"]],
                    ]));
                });
                return 'Typescript initializer done';
            },
        },
        {
            title: 'Creating src and test folders',
            task: async (message) => {
                // Do installation here
                promises.mkdir("src").then(() => {
                    promises.writeFile("src/index.ts", sum);
                });
                promises.mkdir("tests").then(() => {
                    promises.writeFile("tests/index.test.ts", sumTest);
                });

                promises.writeFile(".gitignore", gitignore);
                promises.writeFile("jest.config.ts", jestconfig);

                promises.writeFile("README.md", readme);
                promises.writeFile("TECHDEBT.md", techdebt);
                promises.writeFile("NOTES.md", notes);

                return 'Source and test folders generated';
            },
        }
    ]);

    outro(`You're all set!`);
}

main().catch(console.error);