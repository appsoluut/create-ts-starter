#!/usr/bin/env node

import { intro, text, tasks, outro, isCancel, cancel } from '@clack/prompts';
const { execSync } = require('child_process');

function onCancel(message: string) {
    cancel(message);
    process.exit(0);
}

function myExecSync(cmd: string) {
    var output;
    try {
        output = execSync(cmd, { stdio: 'pipe' });
    } catch(err) {
        onCancel(err as string);
    }
    return output;
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
                myExecSync(`xxxnpm init -y`);
                return `Installed via npm`;
          },
        },
        {
            title: 'Setting up typescript',
            task: async (message) => {
                // Do installation here
                // tsc --init
                // update tsconfig.json with: "include": ["src/**/*", "tests/**/*"]
                return 'Typescript initializer done';
          },
        },
        {
            title: 'Creating src and test folders',
            task: async (message) => {
                // Do installation here
                // mkdir src 
                // mkdir tests

                // create .gitignore
                // create /src/sum.ts
                // create /tests/sum.test.ts

                // create /jest.config.ts

                // npm install --save-dev jest
                // npm install --save-dev ts-jest
                // npm install --save-dev @types/jest

                // update package.json with: "test": "jest"
                return 'Source and test folders generated';
          },
        },
    ]);

    outro(`You're all set!`);
}

main().catch(console.error);