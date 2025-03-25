#!/usr/bin/env node

import { intro, text, tasks, outro, isCancel, cancel, log } from '@clack/prompts';
import { execSync } from 'child_process';
import { promises } from 'fs';

const sum =
`export function sum(a: number, b: number): number {
    return a + b;
}
`

const sumTest =
`import { sum } from '../src/index'

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

const gitignore =
`node_modules/
package-lock.json
`

const jestconfig =
`module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
};
`

function onCancel(message: string) {
    cancel(message);
    process.exit(0);
}

async function myExecSync(cmd: string) {
    var output;
    try {
        output = execSync(cmd, { stdio: 'pipe' });
    } catch(err) {
        onCancel(err as string);
    }
    return output;
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
                myExecSync(`npm init -init-version=0.0.1 -y && npm install ts-node && npm install --save-dev jest ts-jest @types/jest`).then(() => {
                    updateValues('./package.json', new Map<string, any>([
                        ['name', projectName],
                        ['scripts', {test: "jest"}]
                    ]));
                });
                return `Installed via npm`;
            },
        },
        {
            title: 'Setting up typescript',
            task: async (message) => {
                // Do installation here
                myExecSync(`tsc --init`).then(() => {
                    stripComments('./tsconfig.json').then(() => {
                        updateValues('./tsconfig.json', new Map<string, any>([
                            ['include', ["src/**/*", "tests/**/*"]],
                        ]));
                    });
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

                return 'Source and test folders generated';
            },
        }
    ]);

    outro(`You're all set!`);
}

main().catch(console.error);