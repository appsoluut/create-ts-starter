#!/usr/bin/env node

import { intro, text, tasks, outro, isCancel, cancel, log } from '@clack/prompts';
import { exec, execSync } from 'node:child_process';
import { promises } from 'fs';
import { eslintConfig, prettierConfig } from './config/linting';
import { vsCodeSettings } from './config/vsCode';
import { gitIgnore } from './config/git';
import { jestConfig } from './config/jest';

const sum = `export function sum(a: number, b: number): number {
  return a + b;
}
`

const sumTest = `import { sum } from '@/index';

describe('sum', () => {
  it('sum of 1 + 2 should return 3', () => {
    // arrange
    const expectedOutput = 3;

    // act
    let result = sum(1, 2);

    // assert
    expect(result).toBe(expectedOutput);
  });
});
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

async function updateValues(fileName: string, values: Map<String, any>) {
    const fname = process.cwd() + '/' + fileName;
    try {
        let file = require(fname);
        file = Object.assign(file, Object.fromEntries(values));
        await promises.writeFile(fname, JSON.stringify(file, null, 2))
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
                await myExec(`npm init -init-version=0.0.1 -y && npm install ts-node && npm install --save-dev jest ts-jest @types/jest`)
                
                await updateValues('./package.json', new Map<string, any>([
                    ['name', projectName],
                    ['type', "module"],
                    ['scripts', {test: "jest", lint: "eslint . --ext .ts,.tsx --fix"}]
                ]));

                return `Installed via npm`;
            },
        },
        {
            title: 'Setting up typescript',
            task: async (message) => {
                await myExec(`tsc --init`);

                await stripComments('./tsconfig.json').then(() => {
                    updateValues('./tsconfig.json', new Map<string, any>([
                        ['include', ["src/**/*", "tests/**/*"]],
                        ['compilerOptions', {
                            "target": "es2016",
                            "module": "commonjs",
                            "esModuleInterop": true,
                            "forceConsistentCasingInFileNames": true,
                            "strict": true,
                            "skipLibCheck": true,
                            "baseUrl": ".",
                            "paths": {
                              "@/*": ["src/*"]
                        }}],
                    ]));
                });

                return 'Typescript initializer done';
            },
        },
        {
            title: 'Setting up linter',
            task: async (message) => {
                await myExec(`npm install --save-dev eslint typescript @typescript-eslint/parser @typescript-eslint/eslint-plugin prettier eslint-config-prettier eslint-plugin-prettier eslint-import-resolver-typescript`);
                
                await promises.writeFile('eslint.config.ts', eslintConfig);
                await promises.writeFile('.prettierrc', prettierConfig);

                return 'Linter initializer done';
            },
        },
        {
            title: 'Configuring vscode settings for project',
            task: async (message) => {      
                await promises.mkdir('.vscode');
                await promises.writeFile('.vscode/settings.json', vsCodeSettings);

                return 'Configuring vscode settings for project done';
            },
        },
        {
            title: 'Initializing git repository',
            task: async () => {
              await myExec(`git init --initial-branch=main`);
              
              await promises.writeFile(".gitignore", gitIgnore);

              return 'Git initialized with main branch';
            },
        },
        {
            title: 'Creating src and test folders',
            task: async (message) => {
                await promises.mkdir("src");
                await promises.writeFile("src/index.ts", sum);

                await promises.mkdir("tests");
                await promises.writeFile("tests/index.test.ts", sumTest);

                await promises.writeFile("jest.config.ts", jestConfig);

                await promises.writeFile("README.md", readme);
                await promises.writeFile("TECHDEBT.md", techdebt);
                await promises.writeFile("NOTES.md", notes);

                return 'Source and test folders generated';
            },
        }
    ]);

    outro(`You're all set!`);
}

main().catch(console.error);