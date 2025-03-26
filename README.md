# Typescript Starter

This is an npm command which will help you start your Typescript project
with ease. It will configure all the required dependencies to get your
project running with Typescript and Jest with a small test to make sure
your project is ready to be used.

## Requirements

To be able to run this, npm should already be installed and be globally
available.

## Running

Simply run `$ npm create @appsoluut/ts-starter@latest` in your console to get
an interactive shell asking you for your project name. Afterwards all
files and folders will be generated.

Change into your project directory and run `$ code .` to open it in 
Visual Studio Code and code away to your hearths content.

## Building the project

To build to project on your local machine, run `$ npm install`, then run
`$ npm run build`. This will transpile the project and put the output in
`bin/index.js`. This is also the command which will be run when the
`$ npm create @appsoluut/ts-starter@latest` command is invoked.

A shorthand is to just run `$ npm run bin` which will do both the transpilation
and running of the script immediately.

To test this locally:
1. Run `$ npm link` in the current project folder
2. Make a new empty folder somewhere else and run
   `$ npm link @appsoluut/create-ts-starter`
3. In this folder, you can now use `$ npx create-ts-starter` to test locally
