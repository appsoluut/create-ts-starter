#!/usr/bin/env node

import { intro, outro } from '@clack/prompts';

function index() {
    intro(`create-my-app`);

    // do stuff

    outro(`You're all set!`);
}

index();