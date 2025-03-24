#!/usr/bin/env node

import { intro, outro } from '@clack/prompts';

function index() {
    intro(`Set up Typescript project`);

    // do stuff

    outro(`You're all set!`);
}

index();