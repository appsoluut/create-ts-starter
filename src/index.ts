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
  return new Promise((resolve, reject) => {
    myExecImpl((output, err) => {
      if (err != undefined) {
        reject(err);
      } else {
        resolve(output);
      }
    }, cmd);
  });
}

function myExecImpl(callback: (output: string, error: unknown) => void, cmd: string) {
  exec(cmd, (error, stdout, stderr) => {
    callback(stdout || stderr, error);
  });
}

async function stripComments(fileName: string) {
  try {
    const safeFileName = path.resolve(process.cwd(), fileName);
    if (!safeFileName.startsWith(process.cwd())) throw new Error('Invalid file path');
    const re = /\/\*[\s\S]*?\*\/|(?<=[^:])\/\/.*|^\/\/.*/g;

    const data = await promises.readFile(path.resolve(fileName), 'utf8');
    const contents = data.replace(re, '').replace(/\s*\r?\n/g, '\n');

    await promises.writeFile(safeFileName, contents);
  } catch (err) {
    onCancel(err as string);
    return;
  }
}

async function updateValues(fileName: string, values: Map<string, unknown>) {
  const fname = path.join(process.cwd(), fileName);
  try {
    const data = await promises.readFile(fname, 'utf8');
    const file = JSON.parse(data);
    const updated = Object.assign(file, Object.fromEntries(values));
    await promises.writeFile(`${fname}`, JSON.stringify(updated, null, 2));
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
            await myExec(
              `git clone git@github.com:sw-craftsmanship-dojo/${CURRENT_DOJO}.git .`
            ).catch(async () => {
              // trying over https
              log.warning('Cloning over SSH failed, trying HTTPS!');
              await myExec(
                `git clone https://github.com/sw-craftsmanship-dojo/${CURRENT_DOJO}.git .`
              );
            });
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
      title: 'Installing packages via npm',
      task: async () => {
        await myExec(
          `npm init -init-version=0.0.1 -y && npm install ts-node && npm install --save-dev jest jest-each ts-jest @types/jest`
        );

        await updateValues(
          './package.json',
          new Map<string, unknown>([
            ['name', projectName],
            ['type', 'commonjs'],
            [
              'scripts',
              {
                test: 'jest',
                lint: 'eslint . --ext .ts,.tsx --fix',
                coverage: 'npx jest --coverage',
                compile: 'npx tsc',
                'update-kata': 'npx tsc && node dist/main.js',
                kata: 'node dist/main.js',
                help: `echo "Useful commands in this project:\n- \\\`npm run help\\\` - see useful commands.\n- \\\`npm run test\\\` - run all tests.\n- \\\`npm run coverage\\\` - run all tests and generate a coverage report.\n- \\\`npm run compile\\\` - compile the TypeScript code to JavaScript (output goes to /dist).\n- \\\`npm run kata\\\` - run the kata (executes main.js).\n- \\\`npm run update-kata\\\` - compile latest code and run the kata (executes main.js)."`,
              },
            ],
          ])
        );

        await myExec(`npm install`);

        return `Packages have been installed successfully`;
      },
    },
    {
      title: 'Checking TypeScript installation',
      task: async () => {
        try {
          await myExec('tsc --version');
          return 'TypeScript is already installed globally';
        } catch {
          await myExec('npm install -g typescript');
          return 'TypeScript has been installed globally';
        }
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
            ['include', ['src/**/*']],
            [
              'compilerOptions',
              {
                target: 'es2024',
                module: 'commonjs',
                moduleResolution: 'node',
                esModuleInterop: true,
                forceConsistentCasingInFileNames: true,
                allowSyntheticDefaultImports: true,
                strict: true,
                skipLibCheck: true,
                baseUrl: '.',
                rootDir: 'src',
                outDir: 'dist',
              },
            ],
          ])
        );

        return 'Typescript setup done';
      },
    },
    {
      title: 'Setting up linter',
      task: async () => {
        const installCmd =
          'npm install --save-dev eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin prettier eslint-config-prettier eslint-plugin-prettier eslint-import-resolver-typescript';
        await myExec(installCmd);
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
        await promises.writeFile('src/main.ts', sum);

        await promises.mkdir('tests');
        await promises.writeFile('tests/index.test.ts', sumTest);

        await promises.writeFile('jest.config.ts', jestConfig);

        await promises.writeFile('README.md', readme);
        await promises.writeFile('TECHDEBT.md', techdebt);
        await promises.writeFile('NOTES.md', notes);

        await myExec(`npm run coverage`);
        await myExec('npm run compile');

        return 'Source and test folders generated successfully. All tests on initial sourcecode passed. Project compiled successfully.';
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
    `Finished setting up the project for you in:\n'${installedPath}'
    
Change into your new folder and:
- Run \`npm run help\` to see useful commands regarding test coverage, compiling and code executing.
- Run 'code .' to open Visual Studio Code and start your kata. 

Enjoy and good luck!`,
    `Info`
  );

  outro(`You're all set!`);
}

main().catch(console.error);
