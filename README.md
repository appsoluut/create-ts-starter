# Typescript Starter

This is an npm command which will help you start your Typescript project
with ease. It will configure all the required dependencies to get your
project running with Typescript and Jest with a small test to make sure
your project is ready to be used.

## Requirements

To be able to run this, npm should already be installed and be globally
available.

## Running

Simply run `$ npm create @appsoluut/ts-starter` in your console to get
an interactive shell asking you for your project name. Afterwards all
files and folders will be generated.

Change into your project directory and run `$ code .` to open it in 
Visual Studio Code and code away to your hearths content.

## Building the project

To build to project on your local machine, run `$ npm install`, then run
`$ npm run build`. This will transpile the project and put the output in
`bin/index.js`. This is also the command which will be run when the
`npm create @appsoluut/ts-starter` command is invoked.

To test this locally run `$ npm link @appsoluut/ts-starter` after every build
to link it to your local npm installation. Then you can run
`$ npx @appsoluut/ts-starter` to view the results.
