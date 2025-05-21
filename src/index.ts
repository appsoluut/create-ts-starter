#!/usr/bin/env node

import { intro, text, tasks, outro, isCancel, cancel, log, note } from '@clack/prompts';
import { existsSync } from 'node:fs';
import { exec } from 'node:child_process';
import { promises } from 'fs';
import { eslintConfig, prettierConfig } from './config/linting';
import { vsCodeSettings } from './config/vsCode';
import { gitIgnore } from './config/git';
import { jestConfig } from './config/jest';
import path from 'node:path';
import { notes, readme, sum, sumTest, techdebt } from './config/initialCode';

const CURRENT_DOJO = 'ns_white_crane_white_belt';

function onCancel(message: string) {
  cancel(message);
  process.exit(0);
}

function myExec(cmd: string): Promise<string> {
  return new Promise((resolve) => {
    myExecImpl(resolve, cmd);
  });
}

function myExecImpl(callback: (output: string) => void, cmd: string) {
  exec(cmd, (error, stdout, stderr) => {
    if (error) throw error;
    callback(stdout || stderr);
  });
}

async function stripComments(fileName: string) {
  try {
    const saveFileName = path.relative(process.cwd(), fileName);
    const re = /\/\*[\s\S]*?\*\/|(?<=[^:])\/\/.*|^\/\/.*/g;

    const data = await promises.readFile(path.resolve(fileName), 'utf8');
    const contents = data.replace(re, '').replace(/\s*\r?\n/g, '\n');

    await promises.writeFile(saveFileName, contents);
  } catch (err) {
    onCancel(err as string);
    return;
  }
}

async function updateValues(fileName: string, values: Map<string, unknown>) {
  const fname = path.join(process.cwd(), fileName);
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    let file = require(`${fname}`);
    file = Object.assign(file, Object.fromEntries(values));
    await promises.writeFile(fname, JSON.stringify(file, null, 2));
    return true;
  } catch (err) {
    onCancel(err as string);
    return false;
  }
}

function getErrorMessage(error: unknown): string {
  if (typeof error === 'object' && error && 'message' in error) {
    return String((error as { message: unknown }).message);
  }
  return 'unknown error';
}

async function main() {
  intro(`Set up Typescript project`);

  const isDojoLessonAnswer = await text({
    message: 'Is this part of the Dojo lessons for the white belt? (Y/n)',
    placeholder: 'Y',
    validate(value) {
      return /^[YyNn]$/.test(value) ? undefined : 'Please enter Y or N';
    },
  });

  if (isCancel(isDojoLessonAnswer)) onCancel('User cancelled.');

  const isDojoLesson =
    typeof isDojoLessonAnswer === 'string' && isDojoLessonAnswer.toLowerCase() === 'y';

  let projectName = await text({
    message: 'What is your project name?',
    placeholder: 'project-name',
    initialValue: 'kata-ts',
    validate(value) {
      if (value.length === 0) return `Value is required!`;
    },
  });

  if (isCancel(projectName)) {
    onCancel('User cancelled.');
  }

  if (typeof projectName !== 'string') {
    return `Invalid project name!`;
  }

  const placeHolderFolderName = isDojoLesson ? 'Lesson XX' : projectName;
  const initialFolderName = isDojoLesson ? 'Lesson 0X' : projectName;

  let folderName = await text({
    message: 'In which sub-folder should this project be placed?',
    placeholder: placeHolderFolderName,
    initialValue: initialFolderName,
    validate(value) {
      if (value.length === 0) return `Value is required!`;
    },
  });

  if (isCancel(folderName)) {
    onCancel('User cancelled.');
  }

  folderName = folderName as string;

  const setupTasks = [];

  if (isDojoLesson) {
    const safeBranchName = folderName.replace(/\s+/g, '_');

    setupTasks.push(
      {
        title: `Creating project folder '${CURRENT_DOJO}' if needed`,
        task: async () => {
          const dojoFolder = path.join('.', CURRENT_DOJO);

          if (!existsSync(dojoFolder)) {
            await promises.mkdir(dojoFolder);
          } else {
            log.info('Folder already exists, skipping creation');
          }

          process.chdir(path.join('.', CURRENT_DOJO));
        },
      },
      {
        title: 'Clone Dojo repo or continue with existing repo',
        task: async () => {
          const gitFolderExists = existsSync(path.join('.', '.git'));

          if (!gitFolderExists) {
            await myExec(`git clone git@github.com:sw-craftsmanship-dojo/${CURRENT_DOJO}.git .`);
          } else {
            log.info('Git repo already present, skipping clone.');
          }

          return 'Dojo repo ready';
        },
      },
      {
        title: `Create new folder '${folderName}' and branch '${safeBranchName}'`,
        task: async () => {
          await promises.mkdir(`${folderName}`, { recursive: true }).catch((error: unknown) => {
            console.error(`Failed to create folder: ${getErrorMessage(error)}`);
          });

          await promises
            .mkdir(path.join(folderName, 'code'), { recursive: true })
            .catch((error: unknown) => {
              console.error(`Failed to create folder: ${getErrorMessage(error)}`);
            });

          await promises
            .mkdir(path.join(folderName, 'theory'), { recursive: true })
            .catch((error: unknown) => {
              console.error(`Failed to create folder: ${getErrorMessage(error)}`);
            });

          process.chdir(path.join(folderName, 'code'));

          // Ensure .gitignore is present
          await promises.writeFile('.gitignore', gitIgnore);

          // If inside git repo, create branch
          const gitFolderExists = existsSync(path.join('../../.git'));
          if (gitFolderExists) {
            // make sure you're inside the repo (from a subfolder)
            await myExec(`git checkout -b ${safeBranchName}`);
          }

          return `Switched to new branch: ${folderName}`;
        },
      }
    );
  } else {
    setupTasks.push(
      {
        title: 'Creating project folder',
        task: async () => {
          await promises.mkdir(path.join('.', folderName));
          process.chdir(path.join('.', folderName));
        },
      },
      {
        title: 'Setting up Git repository',
        task: async () => {
          await myExec(`git init --initial-branch=main`);
          await promises.writeFile('.gitignore', gitIgnore);
          return `Initialized Git repository`;
        },
      }
    );
  }

  await tasks([
    ...setupTasks,
    {
      title: 'Setting up npm package',
      task: async () => {
        await myExec(
          `npm init -init-version=0.0.1 -y && npm install ts-node && npm install --save-dev jest jest-each ts-jest @types/jest`
        );

        await updateValues(
          './package.json',
          new Map<string, unknown>([
            ['name', projectName],
            ['type', 'module'],
            ['scripts', { test: 'jest', lint: 'eslint . --ext .ts,.tsx --fix' }],
          ])
        );

        await myExec(`npm install`);

        return `Installed via npm`;
      },
    },
    {
      title: 'Setting up typescript',
      task: async () => {
        await myExec(`tsc --init`);

        await stripComments('./tsconfig.json');
        await updateValues(
          './tsconfig.json',
          new Map<string, unknown>([
            ['include', ['src/**/*', 'tests/**/*']],
            [
              'compilerOptions',
              {
                target: 'es2016',
                module: 'commonjs',
                esModuleInterop: true,
                forceConsistentCasingInFileNames: true,
                strict: true,
                skipLibCheck: true,
                baseUrl: '.',
                paths: {
                  '@/*': ['src/*'],
                },
              },
            ],
          ])
        );
        return 'Typescript initializer done';
      },
    },
    {
      title: 'Setting up linter',
      task: async () => {
        await myExec(
          `npm install --save-dev eslint typescript @typescript-eslint/parser @typescript-eslint/eslint-plugin prettier eslint-config-prettier eslint-plugin-prettier eslint-import-resolver-typescript`
        );

        await promises.writeFile('eslint.config.js', eslintConfig);
        await promises.writeFile('.prettierrc', prettierConfig);

        return 'Linter initializer done';
      },
    },
    {
      title: 'Configuring vscode settings for project',
      task: async () => {
        await promises.mkdir('.vscode');
        await promises.writeFile('.vscode/settings.json', vsCodeSettings);

        return 'Configuring vscode settings for project done';
      },
    },
    {
      title: 'Creating src and test folders',
      task: async () => {
        await promises.mkdir('src');
        await promises.writeFile('src/index.ts', sum);

        await promises.mkdir('tests');
        await promises.writeFile('tests/index.test.ts', sumTest);

        await promises.writeFile('jest.config.ts', jestConfig);

        await promises.writeFile('README.md', readme);
        await promises.writeFile('TECHDEBT.md', techdebt);
        await promises.writeFile('NOTES.md', notes);

        await myExec(`npm run test`);

        return 'Source and test folders generated successfully. All tests on initial sourcecode passed.';
      },
    },
    {
      title: 'Create first git commit',
      task: async () => {
        if (isDojoLesson) {
          const lessonPath = path.resolve('../../', folderName);
          await myExec(`git add "${lessonPath}"`);
          await myExec(`git commit -m "Initial commit for ${folderName}"`);
        } else {
          await myExec(`git add .`);
          await myExec(`git commit -m "Initial commit for ${projectName}"`);
        }

        return 'First git commit done';
      },
    },
  ]);

  let installedPath = '';
  if (isDojoLesson) {
    process.chdir(`../../`);

    installedPath = path.join(process.cwd(), folderName, 'code');
  } else {
    process.chdir(`../`);

    installedPath = path.join(process.cwd(), folderName);
  }

  note(
    `Finished setting up the project for you in:\n'${installedPath}'.\n\nChange into this folder and run 'code .' to open\nVisual Studio Code and start your kata!`,
    `Info`
  );

  outro(`You're all set!`);
}

main().catch(console.error);
